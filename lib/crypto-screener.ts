/** Same-origin crypto screener snapshots. The authenticated server collector owns provider access. */
export type CryptoRow={id:string;symbol:string;name:string;image:string|null;price:number;change24h:number|null;change7d:number|null;marketCap:number;volume24h:number;supply:number|null;rank:number;at:number};
export type CryptoSnapshot={asOf:number|null;receivedAt:number|null;rows:CryptoRow[];source:string;stale:boolean;available:boolean;errors:string[]};
export type CryptoSort='rank'|'name'|'price'|'change24h'|'change7d'|'marketCap'|'volume24h'|'supply';
const KEY='crypto:snapshot:v1',MAX_AGE=3600000;
const SOURCE='CoinGecko market data';
function finite(value:unknown,min=0,max=1e17){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Invalid market number');return value}
function change(value:unknown){try{return value===null||value===undefined?null:finite(value,-100,1e6)}catch{return null}}
function safeImage(value:unknown){if(typeof value!=='string')return null;try{const u=new URL(value);return u.protocol==='https:'&&['coin-images.coingecko.com','assets.coingecko.com'].includes(u.hostname)?u.href:null}catch{return null}}
export function parseCryptoMarkets(input:unknown,now=Date.now()):CryptoRow[]{
 if(!Array.isArray(input)||input.length<20||input.length>250||JSON.stringify(input).length>1200000)throw Error('Invalid crypto snapshot size');
 const seen=new Set<string>(),rows:CryptoRow[]=[];
 for(const raw of input){
  if(!raw||typeof raw!=='object')continue;const r=raw as Record<string,unknown>;
  if(typeof r.id!=='string'||!/^[-a-z0-9]{1,100}$/.test(r.id)||seen.has(r.id))throw Error('Invalid or duplicate coin ID');seen.add(r.id);
  try{
   if(typeof r.symbol!=='string'||!/^[-a-z0-9.$+]{1,24}$/i.test(r.symbol)||typeof r.name!=='string'||!r.name.trim())throw Error('Invalid coin identity');
   const at=Date.parse(String(r.last_updated));if(!Number.isFinite(at)||at>now+30000||now-at>MAX_AGE)continue;
   rows.push({id:r.id,symbol:r.symbol.toUpperCase(),name:r.name.trim().slice(0,100),image:safeImage(r.image),price:finite(r.current_price,Number.MIN_VALUE),change24h:change(r.price_change_percentage_24h_in_currency??r.price_change_percentage_24h),change7d:change(r.price_change_percentage_7d_in_currency),marketCap:finite(r.market_cap),volume24h:finite(r.total_volume),supply:r.circulating_supply==null?null:finite(r.circulating_supply),rank:Math.max(1,Math.round(finite(r.market_cap_rank,1,100000))),at});
  }catch{}
 }
 if(rows.length<20||!['bitcoin','ethereum'].every(id=>rows.some(r=>r.id===id)))throw Error('Missing crypto baseline assets');
 return rows.sort((a,b)=>a.rank-b.rank||a.id.localeCompare(b.id));
}
export function screenCryptoRows(rows:CryptoRow[],query:string,sort:CryptoSort='marketCap',descending=true){
 const q=query.trim().toLowerCase();return rows.filter(r=>!q||r.name.toLowerCase().includes(q)||r.symbol.toLowerCase().includes(q)||r.id.includes(q)).sort((a,b)=>{
  const av=a[sort],bv=b[sort];if(av===null&&bv===null)return a.rank-b.rank;if(av===null)return 1;if(bv===null)return -1;
  const result=typeof av==='string'&&typeof bv==='string'?av.localeCompare(bv):Number(av)-Number(bv);return (descending?-result:result)||a.rank-b.rank;
 });
}
export function cryptoChartSymbol(row:Pick<CryptoRow,'id'|'symbol'>){
 const mapped:Record<string,string>={bitcoin:'COINBASE:BTCUSD',ethereum:'COINBASE:ETHUSD',solana:'COINBASE:SOLUSD',ripple:'COINBASE:XRPUSD',dogecoin:'COINBASE:DOGEUSD',cardano:'COINBASE:ADAUSD',chainlink:'COINBASE:LINKUSD',avalanche:'COINBASE:AVAXUSD',binancecoin:'BINANCE:BNBUSDT',tether:'CRYPTO:USDTUSD','usd-coin':'CRYPTO:USDCUSD'};
 return mapped[row.id]||'CRYPTO:'+row.symbol.replace(/[^A-Z0-9]/g,'')+'USD';
}
async function stored(db:D1Database){const row=await db.prepare('SELECT value FROM news_meta WHERE key=?').bind(KEY).first<{value:string}>();try{return row?JSON.parse(row.value) as {asOf:number;receivedAt:number;rows:CryptoRow[]}:null}catch{return null}}
export async function saveCryptoSnapshot(db:D1Database,input:{markets:unknown;observedAt:number}){
 const now=Date.now();if(!Number.isFinite(input?.observedAt)||input.observedAt>now+30000||now-input.observedAt>300000)throw Error('Invalid collector observation time');
 const rows=parseCryptoMarkets(input.markets,now),previous=await stored(db);if(previous&&previous.asOf>input.observedAt)throw Error('Outdated crypto collector sample');
 const value={asOf:input.observedAt,receivedAt:now,rows};await db.prepare('INSERT INTO news_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(json_extract(news_meta.value,\'$.asOf\') AS INTEGER)<=CAST(json_extract(excluded.value,\'$.asOf\') AS INTEGER)').bind(KEY,JSON.stringify(value)).run();return {saved:true,asOf:value.asOf,count:rows.length};
}
export async function cryptoSnapshot(db?:D1Database):Promise<CryptoSnapshot>{
 const empty:CryptoSnapshot={asOf:null,receivedAt:null,rows:[],source:SOURCE,stale:true,available:false,errors:['Crypto market data is reconnecting.']};if(!db)return empty;
 const value=await stored(db);const now=Date.now();if(!value||!Number.isFinite(value.asOf)||value.asOf>now+30000||now-value.asOf>MAX_AGE||!Array.isArray(value.rows))return empty;
 const rows=value.rows.filter(r=>r&&Number.isFinite(r.price)&&r.price>0&&Number.isFinite(r.at)&&now-r.at<=MAX_AGE&&r.at<=now+30000);if(!rows.length)return empty;
 const stale=now-value.asOf>180000;
 return {asOf:value.asOf,receivedAt:value.receivedAt,rows,source:SOURCE,stale,available:true,errors:stale?['Showing the latest stored market snapshot.']:[]};
}
