import {oddsMarkets,type OddsMarket} from './odds-markets';
import {validateQuote} from './market-data';

export type TerminalPoint={at:number;price:number};
export type TerminalQuote={symbol:string;name:string;price:number|null;change24h:number|null;at:number|null;unit:string;source:string;url:string;points:TerminalPoint[]};
export type TerminalMetric={label:string;value:number|null;unit:string;source:string;url:string;at:number|null};
export type TerminalNativeAsset={symbol:string;name:string;price:number|null;issuedSupply:number|null;marketCap:number|null;at:number|null;url:string;image:string};
export type TerminalSnapshot={asOf:number;nativeAssets:TerminalNativeAsset[];quotes:TerminalQuote[];network:TerminalMetric[];markets:OddsMarket[];errors:string[]};
const APP='https://app.strato.nexus',ODDS='https://stratoodds.com';
const HEADERS={Accept:'application/json','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'};
// Worker-isolate caches avoid multiplying public API requests for each reader.
const cache=new Map<string,{until:number;value:unknown}>();
const inflight=new Map<string,Promise<unknown>>();
async function read<T>(url:string,ttl=60000):Promise<T>{
 const hit=cache.get(url);if(hit&&hit.until>Date.now())return hit.value as T;
 const pending=inflight.get(url);if(pending)return pending as Promise<T>;
 const work=(async()=>{const r=await fetch(url,{headers:HEADERS,signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Source HTTP '+r.status);const value=await r.json();cache.set(url,{until:Date.now()+ttl,value});return value})();
 inflight.set(url,work);try{return await work as T}finally{inflight.delete(url)}
}
function rawUnits(value:unknown,decimals=18){
 if(typeof value!=='string'||!/^\d+$/.test(value))throw Error('Invalid base-unit amount');
 const n=Number(value)/10**decimals;if(!Number.isFinite(n)||n<0)throw Error('Invalid amount');return n;
}
function timestamp(value:unknown,now:number,maxAge:number){const at=typeof value==='number'?value:Date.parse(String(value));if(!Number.isFinite(at)||at>now+30000||now-at>maxAge)throw Error('Stale source');return at}
function points(rows:unknown,now:number,kind:'coinbase'|'oracle'):TerminalPoint[]{
 if(!Array.isArray(rows))throw Error('Invalid history');
 const seen=new Set<number>();const result:TerminalPoint[]=[];
 for(const row of rows){
  const at=Number(kind==='coinbase'?row?.[0]:row?.timestamp)*1000;
  let price:number;try{price=kind==='coinbase'?Number(row?.[4]):rawUnits(row?.price)}catch{continue}
  if(!Number.isFinite(at)||at>now+30000||now-at>26*3600000||!Number.isFinite(price)||price<=0||seen.has(at))continue;
  seen.add(at);result.push({at,price});
 }
 result.sort((a,b)=>a.at-b.at);
 while(result.length>2&&result[1].at<now-86400000)result.shift();
 if(result.length<2)throw Error('Insufficient history');timestamp(result.at(-1)!.at,now,kind==='coinbase'?25*60000:15*60000);return result;
}
function failureQuote(symbol:string,name:string,unit:string,source:string,url:string):TerminalQuote{return {symbol,name,unit,source,url,price:null,change24h:null,at:null,points:[]}}
async function cryptoQuote(symbol:'BTC'|'ETH',now:number,errors:string[]):Promise<TerminalQuote>{
 const url='https://www.coinbase.com/advanced-trade/spot/'+symbol+'-USD';const result=failureQuote(symbol,symbol==='BTC'?'Bitcoin':'Ethereum','USD','Coinbase Exchange',url);
 const base='https://api.exchange.coinbase.com/products/'+symbol+'-USD/';
 const quote=(async()=>{const [stats,ticker]=await Promise.all([read<Record<string,unknown>>(base+'stats'),read<Record<string,unknown>>(base+'ticker')]);return validateQuote(symbol,stats,ticker,now)})();
 const history=read<unknown>(base+'candles?granularity=900',120000).then(rows=>points(rows,now,'coinbase'));
 const [q,h]=await Promise.allSettled([quote,history]);
 if(q.status==='fulfilled')Object.assign(result,{price:q.value.price,change24h:q.value.change24h,at:q.value.at});else errors.push(symbol+' price unavailable or stale');
 if(h.status==='fulfilled')result.points=h.value;else errors.push(symbol+' chart unavailable or stale');
 return result;
}
async function metalQuote(symbol:'GOLDST'|'SILVST',now:number,errors:string[]):Promise<TerminalQuote>{
 const result=failureQuote(symbol,symbol==='GOLDST'?'Tokenized gold':'Tokenized silver','USD / troy oz','STRATO oracle',APP+'/dashboard/');
 try{
  const rows=await read<unknown>(ODDS+'/api/v1/prices/history/'+symbol+'?range=1d',120000);const series=points(rows,now,'oracle');const last=series.at(-1)!;
  // Reference prices are per token (one troy ounce); no token-market premium is inferred.
  const baseline=series.filter(p=>Math.abs(now-p.at-86400000)<=20*60000).sort((a,b)=>Math.abs(now-a.at-86400000)-Math.abs(now-b.at-86400000))[0];
  Object.assign(result,{points:series,price:last.price,at:last.at,change24h:baseline?(last.price/baseline.price-1)*100:null});
  if(!baseline)errors.push(symbol+' 24h change unavailable');
 }catch{errors.push(symbol+' oracle price unavailable or stale')}
 return result;
}
async function networkMetrics(now:number,errors:string[]):Promise<TerminalMetric[]>{
 const stakingUrl=APP+'/api/staking/info/public',tvlUrl=APP+'/api/v1/metrics/tvl';
 const result:TerminalMetric[]=[
  {label:'Protocol TVL',value:null,unit:'USD',source:'STRATO App · canonical TVL',url:APP+'/dashboard/',at:null},
  {label:'STRATO staked',value:null,unit:'STRATO',source:'STRATO staking',url:APP+'/staking/',at:null},
  {label:'Staked value',value:null,unit:'USD',source:'STRATO staking',url:APP+'/staking/',at:null},
  {label:'Active validators',value:null,unit:'validators',source:'STRATO staking',url:APP+'/staking/',at:null},
 ];
 await Promise.all([
  (async()=>{try{const d=await read<Record<string,unknown>>(tvlUrl);const at=timestamp(d.timestamp,now,5*60000);if(d.methodologyVersion!=='1')throw Error('Unknown TVL methodology');Object.assign(result[0],{value:rawUnits(d.totalUsd),at})}catch{errors.push('STRATO TVL unavailable or stale')}})(),
  (async()=>{try{const d=await read<Record<string,unknown>>(stakingUrl);if(d.configured!==true||d.deployed!==true||String(d.tokenDecimals)!=='18')throw Error('Unconfigured staking');const count=Number(d.activeValidatorCount);if(!Number.isSafeInteger(count)||count<0||count>10000)throw Error('Invalid validator count');const stake=rawUnits(d.totalRewardableStake),value=rawUnits(d.totalRewardableStakeUsd),at=(cache.get(stakingUrl)?.until||now+60000)-60000;Object.assign(result[1],{value:stake,at});Object.assign(result[2],{value,at});Object.assign(result[3],{value:count,at})}catch{errors.push('STRATO staking metrics unavailable')}})(),
 ]);
 return result;
}
const NATIVE_ASSETS=[['STRATO','STRATO'],['USDST','STRATO Dollar'],['GOLDST','Tokenized Gold'],['SILVST','Tokenized Silver']] as const;
/** The API totalSupply field is issued supply, not a verified circulating-supply figure. */
export function parseNativeAssets(raw:unknown,at:number):TerminalNativeAsset[]{
 const rows=(raw as {tokens?:unknown})?.tokens;if(!Array.isArray(rows))throw Error('Invalid native token statistics');
 return NATIVE_ASSETS.map(([symbol,name])=>{
  const item:TerminalNativeAsset={symbol,name,price:null,issuedSupply:null,marketCap:null,at:null,url:APP+'/api/tokens/stats',image:'/metals/'+symbol+'.png'};
  const matches=rows.filter(r=>r&&typeof r==='object'&&r.symbol===symbol);if(matches.length!==1)return item;
  const row=matches[0];if(typeof row.name==='string'&&row.name.trim())item.name=row.name.trim().slice(0,80);try{const price=rawUnits(row.price),issuedSupply=rawUnits(row.totalSupply);if(price<=0)throw Error('Missing price');item.price=price;item.issuedSupply=issuedSupply;item.at=at}catch{return item}
  // Unlike price and totalSupply, marketCap is already a human-readable USD decimal.
  if(typeof row.marketCap==='string'&&/^\d+(?:\.\d+)?$/.test(row.marketCap)){const cap=Number(row.marketCap);if(Number.isFinite(cap)&&cap>=0&&cap<1e16)item.marketCap=cap}
  return item;
 });
}
async function nativeAssets(now:number,errors:string[]):Promise<TerminalNativeAsset[]>{
 const url=APP+'/api/tokens/stats';
 try{const raw=await read<unknown>(url);const at=(cache.get(url)?.until||now+60000)-60000;const assets=parseNativeAssets(raw,at);for(const a of assets)if(a.price===null||a.issuedSupply===null||a.marketCap===null)errors.push(a.symbol+' native token statistics unavailable');return assets}
 catch{errors.push('STRATO native token statistics unavailable');return NATIVE_ASSETS.map(([symbol,name])=>({symbol,name,price:null,issuedSupply:null,marketCap:null,at:null,url,image:'/metals/'+symbol+'.png'}))}
}
let snapshot:{at:number;value:TerminalSnapshot}|null=null;
let snapshotPending:Promise<TerminalSnapshot>|null=null;
export async function terminalSnapshot():Promise<TerminalSnapshot>{
 const now=Date.now();if(snapshot&&now-snapshot.at<60000&&now>=snapshot.at)return snapshot.value;
 if(snapshotPending)return snapshotPending;
 snapshotPending=(async()=>{const errors:string[]=[];const [quotes,network,markets,native]=await Promise.all([
  Promise.all([cryptoQuote('BTC',now,errors),cryptoQuote('ETH',now,errors),metalQuote('GOLDST',now,errors),metalQuote('SILVST',now,errors)]),
  networkMetrics(now,errors),oddsMarkets(now),nativeAssets(now,errors),
 ]);const value={asOf:now,quotes,network,markets,nativeAssets:native,errors};snapshot={at:now,value};return value})();
 try{return await snapshotPending}finally{snapshotPending=null}
}
