import type {Story} from './news';
export type Quote={symbol:'BTC'|'ETH';price:number;change24h:number;at:number};
type Point={at:number;price:number};
type Alert={at:number;direction:number;level:number};
export type MarketState={history:Partial<Record<Quote['symbol'],Point[]>>;alerts:Record<string,Alert>;slot?:string};
export const emptyMarketState=():MarketState=>({history:{},alerts:{}});
const price=(n:number)=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const direction=(n:number)=>n>=0?'up':'down';
const name=(s:Quote['symbol'])=>s==='BTC'?'Bitcoin':'Ethereum';
export function validateQuote(symbol:Quote['symbol'],stats:Record<string,unknown>,ticker:Record<string,unknown>,now:number):Quote{
 const open=Number(stats.open),last=Number(ticker.price),at=Date.parse(String(ticker.time));
 if(!Number.isFinite(open)||open<=0||!Number.isFinite(last)||last<=0||!Number.isFinite(at)||now-at>180000||at-now>30000)throw Error('Invalid or stale Coinbase quote');
 const change24h=(last/open-1)*100;
 if(!Number.isFinite(change24h)||Math.abs(change24h)>90)throw Error('Implausible market quote');
 return {symbol,price:last,change24h,at};
}
export async function fetchQuotes(now:number){
 const results=await Promise.allSettled((['BTC','ETH'] as const).map(async symbol=>{
  const get=async(path:string)=>{const r=await fetch(`https://api.exchange.coinbase.com/products/${symbol}-USD/${path}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Coinbase HTTP '+r.status);return await r.json() as Record<string,unknown>};
  const [stats,ticker]=await Promise.all([get('stats'),get('ticker')]);return validateQuote(symbol,stats,ticker,now);
 }));
 return {quotes:results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]),sources:results.map((r,i)=>({name:`Coinbase ${i?'ETH':'BTC'}/USD`,url:'https://www.coinbase.com/advanced-trade/spot/'+(i?'ETH':'BTC')+'-USD',category:'Crypto',ok:r.status==='fulfilled',count:r.status==='fulfilled'?1:0,...(r.status==='rejected'?{error:'Price data unavailable or stale'}:{})}))};
}
function story(id:string,title:string,body:string,now:number,importance:number):Story{return {id:'market:'+id,title,summary:'Coinbase USD spot market data.',url:'https://www.coinbase.com/advanced-trade/spot/BTC-USD',source:'Coinbase Exchange',publishedAt:new Date(now).toISOString(),category:'Crypto',priority:importance>=85,importance,angle:null,dataPost:body}}
export function marketStories(quotes:Quote[],previous:MarketState,now:number){
 const state:MarketState=structuredClone(previous),stories:Story[]=[];
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now)).map(p=>[p.type,p.value]));
 const slot=`${parts.year}-${parts.month}-${parts.day}-${parts.hour}`;
 // Fifteen-minute grace period; never replay missed summaries after downtime.
 if(['08','20'].includes(parts.hour)&&Number(parts.minute)<15&&state.slot!==slot&&quotes.length===2){
  const lines=quotes.map(q=>`${name(q.symbol)} is ${direction(q.change24h)} ${Math.abs(q.change24h).toFixed(2)}% over the past 24 hours, trading at ${price(q.price)}.`);
  const stamp=new Date(Math.min(...quotes.map(q=>q.at))).toISOString().slice(11,16);
  stories.push(story('snapshot:'+slot,'Bitcoin and Ethereum market update','MARKET UPDATE\n\n'+lines.join('\n\n')+`\n\nCoinbase USD spot prices as of ${stamp} UTC.`,now,70));state.slot=slot;
 }
 for(const q of quotes){
  const history=state.history[q.symbol]||[];
  // Use a measured one-hour baseline, with at most five minutes of tolerance.
  const baseline=history.filter(p=>now-p.at>=55*60000&&now-p.at<=65*60000).sort((a,b)=>Math.abs(now-a.at-3600000)-Math.abs(now-b.at-3600000))[0];
  const hour=baseline?(q.price/baseline.price-1)*100:null;
  for(const [window,change,threshold] of [['1h',hour,q.symbol==='BTC'?3:4],['24h',q.change24h,5]] as const){
   if(change===null)continue;
   const key=q.symbol+':'+window,level=Math.floor(Math.abs(change)/threshold),sign=Math.sign(change),old=state.alerts[key];
   // First observation establishes a baseline. Alert on a newly crossed band,
   // not a large 24h move that was already present when monitoring started.
   if(old&&level>0&&(sign!==old.direction||level>old.level)&&now-old.at>=3600000){
    const measured=window==='1h'?`${Math.round((now-baseline!.at)/60000)} minutes`:'24 hours';
    const headline=`${name(q.symbol)} ${change>0?'rises':'falls'} ${Math.abs(change).toFixed(2)}% over the past ${measured}, trading at ${price(q.price)}.`;
    const detail=window==='1h'?`${name(q.symbol)} is ${direction(q.change24h)} ${Math.abs(q.change24h).toFixed(2)}% over the past 24 hours.\n\n`:'';
    const body=`JUST IN: ${headline}\n\n${detail}Coinbase USD spot data as of ${new Date(q.at).toISOString().slice(11,16)} UTC.`;
    const item=story(`move:${q.symbol}:${window}:${now}`,headline,body,now,95);item.url='https://www.coinbase.com/advanced-trade/spot/'+q.symbol+'-USD';stories.push(item);
    state.alerts[key]={at:now,direction:sign,level};
   }else if(!old)state.alerts[key]={at:now-3600000,direction:sign,level};
   else if(level===0&&now-old.at>=3600000)state.alerts[key]={...old,direction:sign,level:0};
  }
  if(!history.length||now-history[history.length-1].at>=50000)history.push({at:now,price:q.price});
  state.history[q.symbol]=history.filter(p=>now-p.at<=70*60000).slice(-90);
 }
 // One price alert per asset per poll if both windows trigger together.
 const seen=new Set<string>();return {state,stories:stories.filter(s=>{const symbol=s.id.match(/move:(BTC|ETH):/)?.[1];if(!symbol)return true;if(seen.has(symbol))return false;seen.add(symbol);return true})};
}
