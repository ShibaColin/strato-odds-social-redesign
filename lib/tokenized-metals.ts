/** Tracked physical-bullion circulation, not an exhaustive global reserve audit.
 * Issuer unit references are retained below. Canonical issuer supplies are counted
 * once; wrapped XAUT0, PAXG-backed ONSG, ETFs/miners and unmined GGBR are excluded.
 */
export type MetalObservation={at:number;supplyOz:number;valueUsd:number;stratoSupplyOz:number;stratoValueUsd:number};
export type MetalToken={id:string;symbol:string;name:string;metal:'gold'|'silver';supplyOz:number;valueUsd:number;at:number;url:string;unit:string;source:string;logo?:string};
export type MetalBenchmark={label:string;points:{at:number;value:number}[];coverage:string[];asOf:number};
export type MetalBenchmarkSources={observedAt:number;series:{id:string;market_caps:[number,number][]}[]};
export type TokenizedMetal={symbol:'GOLD'|'SILVER';name:string;supplyOz:number|null;valueUsd:number|null;stratoSupplyOz:number|null;stratoValueUsd:number|null;stratoSharePct:number|null;asOf:number|null;history:MetalObservation[];historySince?:number|null;benchmark?:MetalBenchmark;tokens:MetalToken[];coverage:string[];missing:string[];complete:boolean};
export type TokenizedMetalsSnapshot={asOf:number;metals:TokenizedMetal[];errors:string[];coverageLabel:string;methodology:string};
export type MetalHistoryRange='1D'|'7D'|'1M'|'3M'|'1Y'|'All';
export const METAL_HISTORY_RANGES:MetalHistoryRange[]=['1D','7D','1M','3M','1Y','All'];
const HISTORY_DAY=86400000;
/** Retain actual samples:5min for7days, latest observed point per hour to90days,
 * latest observed point per UTC day to365days. Never average or synthesize data. */
export function compactMetalHistory(input:MetalObservation[],now=Date.now()):MetalObservation[]{
 const buckets=new Map<string,MetalObservation>();
 const sorted=input.filter(p=>Number.isFinite(p.at)&&p.at<=now&&now-p.at<=365*HISTORY_DAY&&[p.supplyOz,p.valueUsd,p.stratoSupplyOz,p.stratoValueUsd].every(n=>Number.isFinite(n)&&n>=0)).sort((a,b)=>a.at-b.at);
 for(const p of sorted){const age=now-p.at,width=age<=7*HISTORY_DAY?300000:age<=90*HISTORY_DAY?3600000:HISTORY_DAY;const key=width+':'+Math.floor(p.at/width);buckets.set(key,p)}
 return [...buckets.values()].sort((a,b)=>a.at-b.at);
}
export function metalHistoryForRange(history:MetalObservation[],range:MetalHistoryRange,now=Date.now()):MetalObservation[]{
 const days=({'1D':1,'7D':7,'1M':30,'3M':90,'1Y':365} as Record<string,number>)[range];
 const sorted=history.filter(p=>Number.isFinite(p.at)&&p.at<=now).sort((a,b)=>a.at-b.at);
 return days?sorted.filter(p=>now-p.at<=days*HISTORY_DAY):sorted;
}
const BENCHMARK_IDS=['tether-gold','pax-gold','kinesis-gold','kinesis-silver'] as const;
/** Genuine provider market-cap history, kept separate from measured token ounces. */
export function parseMetalBenchmarks(input:MetalBenchmarkSources,now=Date.now()):Record<'GOLD'|'SILVER',MetalBenchmark>{
 if(!input||!Number.isFinite(input.observedAt)||input.observedAt>now+30000||now-input.observedAt>300000)throw Error('Invalid benchmark observation time');
 if(!Array.isArray(input.series)||input.series.length!==4)throw Error('Missing benchmark issuers');
 const series=new Map<string,Map<number,{at:number;value:number}>>();
 for(const row of input.series){
  if(!BENCHMARK_IDS.includes(row?.id as typeof BENCHMARK_IDS[number])||series.has(row.id)||!Array.isArray(row.market_caps)||row.market_caps.length<2||row.market_caps.length>370)throw Error('Invalid benchmark issuer');
  const days=new Map<number,{at:number;value:number}>();
  for(const point of row.market_caps){
   if(!Array.isArray(point)||point.length!==2)throw Error('Invalid benchmark point');
   const [at,value]=point;if(!Number.isFinite(at)||!Number.isFinite(value)||at>now+30000||now-at>366*HISTORY_DAY||value<0||value>1e14)throw Error('Invalid benchmark values');
   if(value===0)continue;const day=Math.floor(at/HISTORY_DAY),prior=days.get(day);
   // Daily UTC observations take precedence over a same-day trailing live point.
   if(!prior||at<prior.at)days.set(day,{at,value});
  }
  if(days.size<2||now-Math.max(...[...days.values()].map(p=>p.at))>3*HISTORY_DAY)throw Error('Stale benchmark series');
  series.set(row.id,days);
 }
 const aggregate=(ids:string[],coverage:string[]):MetalBenchmark=>{
  const first=series.get(ids[0])!;const points=[...first.keys()].sort((a,b)=>a-b).flatMap(day=>{const rows=ids.map(id=>series.get(id)!.get(day));return rows.every(Boolean)?[{at:Math.max(...rows.map(p=>p!.at)),value:rows.reduce((sum,p)=>sum+p!.value,0)}]:[]});
  if(points.length<2)throw Error('No aligned benchmark history');
  return {label:'Historical market value benchmark',points,coverage,asOf:input.observedAt};
 };
 return {GOLD:aggregate(['tether-gold','pax-gold','kinesis-gold'],['XAUT','PAXG','KAU']),SILVER:aggregate(['kinesis-silver'],['KAG'])};
}
const GRAMS_PER_TROY_OZ=31.1034768;
type Spec={id:string;symbol:string;name:string;metal:'gold'|'silver';grams?:boolean;url:string};
export const METAL_ISSUERS:Spec[]=[
 {id:'tether-gold',symbol:'XAUT',name:'Tether Gold',metal:'gold',url:'https://gold.tether.to/'},
 {id:'pax-gold',symbol:'PAXG',name:'PAX Gold',metal:'gold',url:'https://www.paxos.com/pax-gold'},
 {id:'kinesis-gold',symbol:'KAU',name:'Kinesis Gold',metal:'gold',grams:true,url:'https://support.kinesis.money/hc/en-gb/articles/12393881555613-What-is-the-Kinesis-Platform'},
 {id:'matrixdock-gold',symbol:'XAUM',name:'Matrixdock Gold',metal:'gold',url:'https://www.matrixdock.com/xaum'},
 {id:'gold-token-sa-dgld-tokenized-gold',symbol:'DGLD',name:'Digital Gold',metal:'gold',url:'https://dgld.ch/docs/terms'},
 {id:'comtech-gold',symbol:'CGO',name:'Comtech Gold',metal:'gold',grams:true,url:'https://comtechgold.com/assets/pdf/cgo_whitepaper_v1.pdf'},
 {id:'vnx-gold',symbol:'VNXAU',name:'VNX Gold',metal:'gold',grams:true,url:'https://vnx.li/vnxau-transparency'},
 {id:'goldzip-gold',symbol:'XGZ',name:'GoldZip',metal:'gold',grams:true,url:'https://goldzip.info/transparency/'},
 {id:'pleasing-gold',symbol:'PGOLD',name:'Pleasing Gold',metal:'gold',url:'https://www.globenewswire.com/news-release/2025/10/29/3176301/0/en/pleasing-international-launches-rwa-platform-pleasing-golden-introducing-tokenized-gold-pgold-and-synthetic-dollar-pusd.html'},
 {id:'streamex-gldy',symbol:'GLDY',name:'Streamex GLDY',metal:'gold',url:'https://gldy.streamex.com/'},
 {id:'kinesis-silver',symbol:'KAG',name:'Kinesis Silver',metal:'silver',url:'https://support.kinesis.money/hc/en-gb/articles/12393881555613-What-is-the-Kinesis-Platform'},
 {id:'ember-silver',symbol:'EXAG',name:'Ember Silver',metal:'silver',url:'https://help.templedigitalgroup.com/en/articles/16124639-exau-exag-frequently-asked-questions'},
 {id:'token-teknoloji-a-s-ons-silver',symbol:'ONSS',name:'ONS Silver',metal:'silver',url:'https://www.token.com.tr/en/reserve-tokens/'},
];
const APP='https://app.strato.nexus';
const MARKET_URL='https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+METAL_ISSUERS.map(s=>s.id).join(',')+'&sparkline=false';
const SNAPSHOT_KEY='metals:snapshot:v1',PROVIDER_KEY='metals:provider:v1',TTL=300000;
type StagedMetalSources={markets:unknown[];observedAt:number};
const methodology='Tracked circulating physical-bullion tokens across the listed issuers, plus STRATO native issued supply. Gram tokens are converted using 31.1034768 grams per troy ounce. CoinGecko supplies and market caps are aggregated once per issuer token across chains. Native GOLDST/SILVST supply and reference value come from STRATO. This is tracked coverage, not an exhaustive worldwide total or independently audited reserves. XAUT0 wrappers, PAXG-backed ONSG, ETFs/miners and unmined GGBR are excluded. XAGM is omitted because its current custody-adjusted ounces-per-token ratio is not available; GRAMS and STT are omitted without verifiable current circulating ounces. History contains actual observations for a consistent set of available issuers; it restarts if coverage changes. Retention is one year: five-minute observations for seven days, then the last actual hourly observation to ninety days and the last actual daily observation thereafter. No earlier supply or growth is invented.';
const coverageLabel='Tracked tokenized bullion';
let cached:{at:number;value:TokenizedMetalsSnapshot}|null=null;
let pending:Promise<TokenizedMetalsSnapshot>|null=null;
const cacheTtl=(value:TokenizedMetalsSnapshot)=>value.metals.every(m=>m.supplyOz!==null&&m.stratoSupplyOz!==null)?TTL:30000;
async function get<T>(url:string):Promise<T>{const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Data provider HTTP '+r.status);const data=await r.json();return data as T}
function amount(value:unknown,positive=true){const n=Number(value);if(value===null||value===undefined||!Number.isFinite(n)||(positive?n<=0:n<0))throw Error('Invalid amount');return n}
function nativeAmount(value:unknown){if(typeof value!=='string'||!/^\d+$/.test(value))throw Error('Invalid native base units');return amount(Number(value)/1e18)}
export function parseMetalMarkets(input:unknown,now=Date.now()):{tokens:MetalToken[];missing:string[]}{
 if(!Array.isArray(input))throw Error('Invalid market response');const tokens:MetalToken[]=[],missing:string[]=[];
 for(const spec of METAL_ISSUERS){
  try{const rows=input.filter(r=>r?.id===spec.id);if(rows.length!==1)throw Error('Missing or duplicate issuer');const r=rows[0];if(String(r.symbol).toUpperCase()!==spec.symbol)throw Error('Wrong issuer symbol');const at=Date.parse(String(r.last_updated));if(!Number.isFinite(at)||at>now+60000||now-at>3600000)throw Error('Stale issuer data');const supply=amount(r.circulating_supply),valueUsd=amount(r.market_cap);amount(r.current_price);const supplyOz=supply/(spec.grams?GRAMS_PER_TROY_OZ:1);if(supplyOz>1e11||valueUsd>1e14)throw Error('Implausible issuer data');tokens.push({id:spec.id,symbol:spec.symbol,name:spec.name,metal:spec.metal,supplyOz,valueUsd,at,url:spec.url,unit:spec.grams?'1 token = 1 gram':'1 token = 1 troy oz',source:'CoinGecko circulating supply / issuer unit definition',logo:typeof r.image==='string'&&/^https:\/\/(?:coin-images|assets)\.coingecko\.com\//.test(r.image)?r.image:undefined})}catch{missing.push(spec.symbol)}
 }
 return {tokens,missing};
}
export function parseNativeMetals(input:unknown,now=Date.now()):MetalToken[]{
 const rows=(input as {tokens?:unknown[]})?.tokens;if(!Array.isArray(rows))throw Error('Invalid STRATO token stats');
 const result:MetalToken[]=[];
 for(const [symbol,address,metal] of [['GOLDST','cdc93d30182125e05eec985b631c7c61b3f63ff0','gold'],['SILVST','2c59ef92d08efde71fe1a1cb5b45f4f6d48fcc94','silver']] as const){
  const matches=rows.filter((r:any)=>r?.symbol===symbol&&String(r.address).replace(/^0x/,'').toLowerCase()===address);if(matches.length!==1)continue;
  try{const r=matches[0] as Record<string,unknown>;const supplyOz=nativeAmount(r.totalSupply),price=nativeAmount(r.price);if(supplyOz>1e10||price>100000)throw Error('Implausible native data');result.push({id:'strato-'+symbol.toLowerCase(),symbol,name:metal==='gold'?'STRATO Gold':'STRATO Silver',metal,supplyOz,valueUsd:supplyOz*price,at:now,url:'https://strato.nexus/treasury',unit:'1 token = 1 troy oz',source:'STRATO public token stats · issued supply',logo:'/metals/'+symbol+'.png'})}catch{}
 }
 return result;
}
async function readMeta<T>(db:D1Database,key:string):Promise<T|null>{try{const row=await db.prepare('SELECT value FROM news_meta WHERE key=?').bind(key).first<{value:string}>();return row?JSON.parse(row.value):null}catch{return null}}
function writeMeta(db:D1Database,key:string,value:unknown){return db.prepare('INSERT INTO news_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(value)).run()}
export async function metalsSnapshot(db?:D1Database):Promise<TokenizedMetalsSnapshot>{
 const now=Date.now();if(cached&&now>=cached.at&&now-cached.at<cacheTtl(cached.value))return cached.value;if(pending)return pending;
 pending=(async()=>{
  const persisted=db?await readMeta<{at:number;value:TokenizedMetalsSnapshot}>(db,SNAPSHOT_KEY):null;
  if(persisted&&now>=persisted.at&&now-persisted.at<cacheTtl(persisted.value)){cached=persisted;return persisted.value}
  const staged=db?await readMeta<StagedMetalSources>(db,PROVIDER_KEY):null;
  const stagedFresh=staged&&Array.isArray(staged.markets)&&Number.isFinite(staged.observedAt)&&staged.observedAt<=now+30000&&now-staged.observedAt<=600000;
  const errors:string[]=[];const [globalResult,nativeResult]=await Promise.allSettled([stagedFresh?Promise.resolve(staged.markets):get<unknown>(MARKET_URL),get<unknown>(APP+'/api/tokens/stats')]);
  let global:ReturnType<typeof parseMetalMarkets>={tokens:[],missing:METAL_ISSUERS.map(s=>s.symbol)},native:MetalToken[]=[];
  if(globalResult.status==='fulfilled'){try{global=parseMetalMarkets(globalResult.value,now)}catch{errors.push('Global issuer data unavailable')}}else errors.push('Global issuer data unavailable');
  if(nativeResult.status==='fulfilled'){try{native=parseNativeMetals(nativeResult.value,now)}catch{errors.push('STRATO supply unavailable')}}else errors.push('STRATO supply unavailable');
  const freshGlobalIds=new Set(global.tokens.map(t=>t.id)),freshNativeIds=new Set(native.map(t=>t.id));
  // A transient provider failure can retain its last successful observation for
  // up to one hour, with the ORIGINAL source timestamp and an explicit error.
  // It never records a new supply-history point from cached fallback data.
  if(persisted&&now-persisted.at<3600000){
   if(!global.tokens.length){global.tokens=persisted.value.metals.flatMap(m=>m.tokens).filter(t=>!t.id.startsWith('strato-')&&now-t.at<=3600000);if(global.tokens.length)errors.push('Issuer totals use the last successful observation; inspect the source timestamp.')}
   if(!native.length){native=persisted.value.metals.flatMap(m=>m.tokens).filter(t=>t.id.startsWith('strato-')&&now-t.at<=3600000);if(native.length)errors.push('STRATO supply uses the last successful observation; inspect the source timestamp.')}
  }
  const storedBenchmarks=db?await readMeta<{at:number;metals:Record<'GOLD'|'SILVER',MetalBenchmark>}>(db,'metals:benchmark:v1'):null;
  const benchmarkFresh=storedBenchmarks&&now>=storedBenchmarks.at&&now-storedBenchmarks.at<=3*HISTORY_DAY;
  const metals:TokenizedMetal[]=[];
  for(const metal of ['gold','silver'] as const){
   const symbol=metal==='gold'?'GOLD':'SILVER',ours=native.find(t=>t.metal===metal),tokens=[...global.tokens.filter(t=>t.metal===metal),...(ours?[ours]:[])],expected=METAL_ISSUERS.filter(t=>t.metal===metal),missing=expected.filter(s=>global.missing.includes(s.symbol)).map(s=>s.symbol);if(!ours)missing.push(metal==='gold'?'GOLDST':'SILVST');
   const required=metal==='gold'?['XAUT','PAXG']:['KAG'];const hasBaseline=required.every(s=>tokens.some(t=>t.symbol===s));
   const supplyOz=hasBaseline?tokens.reduce((sum,t)=>sum+t.supplyOz,0):null,valueUsd=hasBaseline?tokens.reduce((sum,t)=>sum+t.valueUsd,0):null;
   const coverageKey=tokens.map(t=>t.id).sort().join('|');
   const stored=db?await readMeta<{coverageKey:string;points:MetalObservation[]}>(db,'metals:history:v1:'+symbol):null;
   // Different issuer coverage must never look like token minting or burning.
   let history:MetalObservation[]=stored?.coverageKey===coverageKey&&Array.isArray(stored.points)?stored.points:[];
   history=compactMetalHistory(history,now);
   const complete=missing.length===0&&globalResult.status==='fulfilled'&&nativeResult.status==='fulfilled';
   if(hasBaseline&&global.tokens.filter(t=>t.metal===metal).every(t=>freshGlobalIds.has(t.id))&&supplyOz!==null&&valueUsd!==null&&ours&&freshNativeIds.has(ours.id)&&(!history.length||now-history[history.length-1].at>=TTL-1000)){
    history.push({at:now,supplyOz,valueUsd,stratoSupplyOz:ours.supplyOz,stratoValueUsd:ours.valueUsd});history=compactMetalHistory(history,now);
    if(db)try{await writeMeta(db,'metals:history:v1:'+symbol,{coverageKey,points:history})}catch{errors.push(symbol+' history storage unavailable')}
   }
   metals.push({symbol,name:metal==='gold'?'Tokenized gold':'Tokenized silver',supplyOz,valueUsd,stratoSupplyOz:ours?.supplyOz??null,stratoValueUsd:ours?.valueUsd??null,stratoSharePct:supplyOz&&ours?ours.supplyOz/supplyOz*100:null,asOf:tokens.length?Math.min(...tokens.map(t=>t.at)):null,history,historySince:history[0]?.at??null,...(benchmarkFresh?{benchmark:storedBenchmarks.metals[symbol]}:{}),tokens,coverage:tokens.map(t=>t.symbol),missing,complete});
  }
  if(metals.some(m=>!m.complete))errors.push('Some tracked issuers are missing or stale; totals and shares reflect available coverage only.');
  const value:TokenizedMetalsSnapshot={asOf:now,metals,errors,coverageLabel,methodology};cached={at:now,value};
  if(db)try{
   // Another isolate can receive a newer authenticated collector sample while
   // this isolate is awaiting an unsuccessful direct provider request.
   const latest=await readMeta<StagedMetalSources>(db,PROVIDER_KEY);
   if(!latest||latest.observedAt<=(stagedFresh?staged.observedAt:0))await writeMeta(db,SNAPSHOT_KEY,cached);
  }catch{errors.push('Shared metals cache unavailable')}
  return value;
 })();try{return await pending}finally{pending=null}
}

/** Accept only an authenticated collector's recent, canonical provider sample.
 * The route must authenticate its caller. This never fetches a caller-supplied
 * URL and never changes the provider's original last_updated timestamps.
 */
export async function saveMetalSources(db:D1Database,input:{markets:unknown;observedAt:number;benchmark?:MetalBenchmarkSources}):Promise<TokenizedMetalsSnapshot>{
 const now=Date.now();
 if(!Number.isFinite(input?.observedAt)||input.observedAt>now+30000||now-input.observedAt>300000)throw Error('Invalid collector observation time');
 if(!Array.isArray(input.markets)||input.markets.length<3||input.markets.length>30)throw Error('Invalid collector market array');
 let encoded:string;try{encoded=JSON.stringify(input.markets)}catch{throw Error('Invalid collector JSON')}
 if(encoded.length>250000)throw Error('Collector payload too large');
 const known=new Set(METAL_ISSUERS.map(s=>s.id));
 if(input.markets.some(r=>!r||typeof r!=='object'||!known.has(String(r.id))))throw Error('Unknown collector issuer');
 const parsed=parseMetalMarkets(input.markets,now);
 if(!['XAUT','PAXG','KAG'].every(symbol=>parsed.tokens.some(t=>t.symbol===symbol)))throw Error('Collector baseline issuers missing, duplicated or stale');
 const benchmark=input.benchmark?parseMetalBenchmarks(input.benchmark,now):null;
 const previous=await readMeta<StagedMetalSources>(db,PROVIDER_KEY);
 if(previous&&previous.observedAt>input.observedAt)throw Error('Outdated collector sample');
 // Let an in-progress read finish before invalidating its cached result.
 if(pending)try{await pending}catch{}
 await writeMeta(db,PROVIDER_KEY,{markets:input.markets,observedAt:input.observedAt});
 if(benchmark)await writeMeta(db,'metals:benchmark:v1',{at:input.benchmark!.observedAt,metals:benchmark});
 await db.prepare('DELETE FROM news_meta WHERE key=?').bind(SNAPSHOT_KEY).run();
 cached=null;
 return metalsSnapshot(db);
}
