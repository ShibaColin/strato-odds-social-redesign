import type {Story} from './news';
export type OddsMarket={address:string;question:string;assetSymbol:string;expiry:number;isEvent:boolean;url:string};
const ORIGIN='https://stratoodds.com';
const ASSETS:Record<string,RegExp>={GOLDST:/\b(gold|goldst|xau)\b/i,SILVST:/\b(silver|silvst|xag)\b/i,ETH:/\b(ethereum|ether|eth)\b/i,WBTC:/\b(bitcoin|btc|wbtc)\b/i,NVDA:/\b(nvidia|nvda|jensen huang)\b/i,SPY:/\b(s&p\s?500|s&p|spy|us stock market|wall street)\b/i,OIL:/\b(oil|brent|crude|opec)\b/i,DOGE:/\b(dogecoin|doge)\b/i,BOOE:/\b(book of ethereum|booe)\b/i};
export function activeMarkets(data:unknown,now=Date.now()):OddsMarket[]{
 if(!Array.isArray(data))return [];
 return data.filter(m=>m&&typeof m==='object'&&/^[a-f0-9]{40}$/i.test(m.address)&&Number(m.status)===1&&!m.tradingHalted&&!m.hidden&&Number(m.expiry)*1000>now+60000).map(m=>({address:m.address,question:String(m.question||'').slice(0,1200),assetSymbol:String(m.assetSymbol||''),expiry:Number(m.expiry)*1000,isEvent:!!m.isEvent,url:ORIGIN+'/markets/'+m.address}));
}
let cache:{at:number;markets:OddsMarket[]}|null=null;
export async function oddsMarkets(now=Date.now()){
 if(cache&&now-cache.at>=0&&now-cache.at<45000)return cache.markets.filter(m=>m.expiry>now+60000);
 try{const results=await Promise.all(['/api/v1/markets','/api/v1/events'].map(async path=>{const r=await fetch(ORIGIN+path,{headers:{'User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Odds unavailable');return activeMarkets(await r.json(),now)}));const markets=Array.from(new Map(results.flat().map(m=>[m.address,m])).values());cache={at:now,markets};return markets}catch{return []}
}
function eventScore(story:Story,m:OddsMarket){
 const title=story.title.toLowerCase(),q=m.question.toLowerCase();
 if(/impeach/.test(q)&&!/impeach|removal from office/.test(title))return 0;
 if(/rejoin/.test(q)&&!/rejoin|return|chief executive|\bceo\b|resign|fired|step(?:s|ped)? down/.test(title))return 0;
 if(/\bipo\b/.test(q)&&!/\bipo\b|valuation|funding|raises?|listing|go(?:ing)? public|stock market debut/.test(title))return 0;
 if(/2028.*(?:election|president)|(?:election|president).*2028/.test(q)&&!/2028|election|presidential|campaign|nomination/.test(title))return 0;
 // Specific people/events outrank broad asset-price markets. Generic words
 // such as market, price, president and crypto never establish a match.
 const entities=[[/\bjensen huang\b/i,/\bjensen huang\b/i],[/\banthropic\b/i,/\banthropic\b/i],[/\bsatoshi\b/i,/\bsatoshi\b/i],[/\bjon ossoff\b/i,/\bjon ossoff\b/i],[/\bjd vance\b/i,/\bjd vance\b/i],[/\btrump\b/i,/\btrump\b/i],[/\bjames bond\b/i,/\bjames bond\b/i]];
 for(const [a,b] of entities)if(a.test(title)&&b.test(q))return 100;
 const stop=new Set('will the a an be by at in on of for to and or yes no than greater less between before after above below market price usd strato oracle january february march april may june july august september october november december'.split(' '));
 const terms=Array.from(new Set(q.match(/[a-z]{4,}/g)||[])).filter(t=>!stop.has(t));const hits=terms.filter(t=>new RegExp('\\b'+t+'\\b','i').test(title));return hits.length>=3&&hits.length/Math.max(1,terms.length)>=.6?60+hits.length:0;
}
export function matchMarket(story:Story,markets:OddsMarket[],now=Date.now()):OddsMarket|null{
 const ranked=markets.filter(m=>m.expiry>now+60000).map(m=>({m,score:m.isEvent?eventScore(story,m):(ASSETS[m.assetSymbol]?.test(story.title)?50:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.m.expiry-b.m.expiry);
 return ranked[0]?.m||null;
}
export function marketQuestion(m:OddsMarket){
 let q=m.question.split('?')[0].trim().replace(/\s+/g,' ');
 if(!m.isEvent)q=q.replace(/the STRATO oracle price of /i,'').replace(/\s*\([^)]*\)/g,'');
 q=q.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g,iso=>{const d=new Date(iso);return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(d)+' at '+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'UTC'}).format(d)+' UTC'}).replace(/ at (\d{1,2} [A-Z][a-z]{2} \d{4}) at /,' on $1 at ');
 return q.endsWith('?')?q:q+'?';
}
export function marketReply(m:OddsMarket|null|undefined){return m?marketQuestion(m)+'\n\n'+m.url:''}
export const marketLine=marketReply;
