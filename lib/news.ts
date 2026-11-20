export type Category = 'Crypto' | 'Stocks' | 'Commodities' | 'Geopolitics';
export type Story = { id:string; title:string; summary:string; url:string; source:string; publishedAt:string|null; category:Category; priority:boolean; angle:string|null; relatedSources?:string[]; dataPost?:string; importance?:number; mediaVersion?:number; enrichedVersion?:number; editorialRetryAt?:number; media?:{credit:string;kind:string;alt:string;asOf?:string;type?:string}; reportedBy?:string };
export const SOURCES = [
 {name:'Cointelegraph',url:'https://cointelegraph.com/rss',category:'Crypto'},
 {name:'Decrypt',url:'https://decrypt.co/feed',category:'Crypto'},
 {name:'CNBC Markets',url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',category:'Stocks'},
 {name:'CNBC Finance',url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',category:'Stocks'},
 {name:'BBC World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',category:'Geopolitics'},
 {name:'CNBC Politics',url:'https://www.cnbc.com/id/10000113/device/rss/rss.html',category:'Geopolitics'},
 {name:'BBC US & Canada',url:'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',category:'Geopolitics'},
 {name:'BBC Europe',url:'https://feeds.bbci.co.uk/news/world/europe/rss.xml',category:'Geopolitics'},
 {name:'The Block Markets',url:'https://www.theblock.co/rss.xml',category:'Crypto'},
 {name:'CryptoSlate Markets',url:'https://cryptoslate.com/feed/',category:'Crypto'},
 {name:'Watcher.Guru Markets',url:'https://watcher.guru/news/feed/',category:'Stocks'},
 {name:'Watcher.Guru Live',url:'https://t.me/s/WatcherGuru',category:'Geopolitics'},
 {name:'CoinDesk',url:'https://www.coindesk.com/arc/outboundfeeds/rss',category:'Crypto'},
 {name:'SEC',url:'https://www.sec.gov/news/pressreleases.rss',category:'Stocks'},
 {name:'ECB',url:'https://www.ecb.europa.eu/rss/press.html',category:'Stocks'},
 {name:'Bank of England',url:'https://www.bankofengland.co.uk/rss/news',category:'Stocks'},
 {name:'EIA',url:'https://www.eia.gov/rss/press_rss.xml',category:'Commodities'},
 {name:'Federal Reserve',url:'https://www.federalreserve.gov/feeds/press_all.xml',category:'Stocks'},
] as const;
export function clean(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):+v;return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>(({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[v]||'')).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):+v;return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/\s+/g,' ').replace(/\s+([.,;:!?])/g,'$1').trim()}
function tag(xml:string,name:string){return clean(xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'')}
export function safeURL(raw:string){try{const u=new URL(raw);if(u.protocol!=='https:'&&u.protocol!=='http:')return '';u.hash='';for(const k of [...u.searchParams.keys()])if(k.startsWith('utm_'))u.searchParams.delete(k);return u.href}catch{return ''}}
export function classify(title:string,fallback:Category):Category {if(/\b(gold|silver|brent|crude|copper|opec|metals)\b|(?<!olive )\boil\b/i.test(title))return 'Commodities';if(/\b(bitcoin|ethereum|crypto|stablecoin|tokeniz|blockchain|btc|eth|defi|usdc)\b/i.test(title))return 'Crypto';if(/\b(stocks?|shares|nasdaq|earnings|s&p|ipo|wall street|treasury|bonds?)\b/i.test(title))return 'Stocks';if(/\b(president|minister|war|sanctions|tariffs?|election|ceasefire|geopolit)\b/i.test(title))return 'Geopolitics';return fallback}
export function angleFor(title:string){if(/\b(gold|silver|metals)\b/i.test(title))return 'Hard assets / tokenization';if(/tokeniz|real.world assets|\brwa\b/i.test(title))return 'Hard assets onchain';if(/\b(stablecoin|usdc|defi|lending)\b/i.test(title))return 'Onchain finance';return null}
export function isMarketReport(title:string,summary=''){
 if(/^(how|why|should|opinion|analysis)|\b(price prediction|price target|could|might|may|forecast|would|if bitcoin|if ethereum)\b/i.test(title))return false;
 return /liquidat(?:ion|ions|ed)|\bmarket cap(?:italization)?\b|\bwip(?:e|es|ed|ing)\b|\b(?:selloff|sell-off|plunges?|tumbles?|surges?|rall(?:y|ies)|crash(?:es)?|slumps?|sinks?|soars?)\b|(?:bitcoin|ethereum|nasdaq|s&p|wall street|stocks?|gold|silver|oil).{0,65}\b(?:rises?|falls?|drops?|gains?|loses?)\b/i.test(title+' '+summary);
}
export function isPolicyReport(title:string,summary=''){
 const text=title+' '+summary;
 return /\b(bitcoin|ethereum|crypto(?:currency|currencies)?|stablecoins?|usdt|digital assets?|tokeniz\w*)\b/i.test(text)&&/\b(central bank|regulator|government|senate|congress|sec|cftc|ministry|treasury|president|bank|parliament|court)\b/i.test(text)&&/\b(approves?|approved|approval|authorizes?|authorized|bans?|banned|adopts?|adopted|legalizes?|legalized|regulat\w*|launches?|launched|introduces?|introduced|opens?|opened|licens\w*|rejects?|rejected)\b/i.test(text);
}
const marketPublishers:Record<string,string>={'The Block Markets':'The Block','CryptoSlate Markets':'CryptoSlate','Watcher.Guru Markets':'Watcher.Guru'};
export function marketRelevant(title:string,summary:string,source:string){if(source==='SEC')return /crypto|etf|securities|trading|fraud|enforcement|exchange|disclosure|market structure/i.test(title+' '+summary);if(source==='ECB'||source==='Bank of England')return /interest rate|monetary policy|inflation|financial stability|liquidity|digital euro|digital pound|tokeniz|bank stress|rate cut|rate hike/i.test(title+' '+summary);if(marketPublishers[source])return isMarketReport(title,summary)||isPolicyReport(title,summary);if(!source.startsWith('BBC') && source!=='Decrypt' && source!=='CNBC Politics')return true;if(importanceFor(title)>=85)return true;return /bitcoin|crypto|ethereum|blockchain|stablecoin|tokeniz|\betf|\bdefi|\bsec\b|binance|solana|zcash|prediction market|polymarket|kalshi|\bstocks?\b|shares|nasdaq|wall street|trade|tariff|sanction|war\b|ceasefire|nuclear|econom|inflation|central bank|interest rate|treasury|\boil\b|\bgas\b|\bgold\b|\bsilver\b|\benergy\b|shipping|supply chain|election|president|minister|government|bank collapse/i.test(title+' '+summary)}
export function importanceFor(title:string){
 if(isPolicyReport(title))return 95;
 if(/emergency rate|declares? war|ceasefire|nuclear|trading halt|bank collapse|invasion/i.test(title))return 100;
 if(/\b(fed|federal reserve|cpi|inflation|payrolls?|tariffs?|sanctions|liquidations?|liquidated|nasdaq|s&p|wall street)\b/i.test(title))return 85;
 if(/\b(trump|russia|ukraine|putin|nato)\b/i.test(title)&&/\b(war|attack|missile|peace|military|trade|econom|oil|energy|market|china|deal|policy|sanction|tariff)/i.test(title))return 90;
 if(/\b(bitcoin|ethereum|gold|silver|oil|opec|treasury|central banks?)\b/i.test(title))return 65;
 return 30;
}
export function parseFeed(xml:string,source:typeof SOURCES[number]):Story[]{const out:Story[]=[];for(const m of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)){const x=m[1],title=tag(x,'title'),url=safeURL(tag(x,'link'));if(!title||!url)continue;if(!marketRelevant(title,tag(x,'description'),source.name))continue;const raw=tag(x,'pubDate')||tag(x,'dc:date');const t=Date.parse(raw);out.push({id:url,title,summary:tag(x,'description').slice(0,1400),url,source:source.name,...(marketPublishers[source.name]?{reportedBy:marketPublishers[source.name]}:{}),publishedAt:Number.isFinite(t)?new Date(t).toISOString():null,category:classify(title,source.category),importance:importanceFor(title),priority:/\b(fed|federal reserve|interest rate|inflation|cpi|sec approves|war|sanctions|tariff|opec|central banks?|etf approval|attack|ceasefire)\b/i.test(title),angle:angleFor(title)})}return out.slice(0,35)}
// Public channel preview only. No Telegram account, private API or login.
export function parseTelegramPreview(html:string):Story[]{
 const stories:Story[]=[];
 for(const block of html.split(/<div class="tgme_widget_message_wrap[^"\n]*"[^>]*>/i)){
  const post=block.match(/data-post="(WatcherGuru\/\d+)"/)?.[1];
  const raw=block.match(/<div\b[^>]*class="[^"]*\btgme_widget_message_text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
  const date=block.match(/<time\b[^>]*datetime="([^"]+)"/)?.[1];
  if(!post||!raw||!date||!Number.isFinite(Date.parse(date)))continue;
  const parts=raw.replace(/<br\s*\/?>/gi,'\n').split(/\n\s*\n/).map(clean).filter(t=>t&&!/^@WatcherGuru$/i.test(t));
  const title=(parts.shift()||'').replace(/^(?:JUST IN|BREAKING(?: NEWS)?|UPDATE)[:\s]+/i,'').trim();
  if(!title||title.length>600||/^(?:ad:|sponsored|subscribe|join our)/i.test(title))continue;
  const url='https://t.me/'+post;
  stories.push({id:url,title,summary:parts.join(' ').slice(0,1400),url,source:'Watcher.Guru Live',reportedBy:'Watcher.Guru (public Telegram)',publishedAt:new Date(date).toISOString(),category:classify(title,'Geopolitics'),priority:true,importance:Math.max(80,importanceFor(title)),angle:angleFor(title)});
 }
 return dedupe(stories);
}
export function dedupe(stories:Story[]){const urls=new Set<string>(),titles=new Map<string,Story>();const out:Story[]=[];for(const s of stories){if(urls.has(s.url))continue;urls.add(s.url);const key=s.title.toLowerCase().replace(/[^a-z0-9]/g,'');const prior=titles.get(key);if(prior){prior.relatedSources=Array.from(new Set([...(prior.relatedSources||[]),s.source]));continue}titles.set(key,s);out.push(s)}return out}
export type SourceStatus={name:string;url:string;category:string;ok:boolean;count:number;error?:string;latency?:number;nextPollAt?:number};
type Feed={stories:Story[];sources:SourceStatus[];fetchedAt:string};
let cache:{at:number,data:Feed}|null=null;
export async function newsFeed(previousSources:SourceStatus[]=[]){
 if(cache&&Date.now()>=cache.at&&Date.now()-cache.at<25000)return cache.data;
 const results=await Promise.all(SOURCES.map(async source=>{
  const started=Date.now(),previous=previousSources.find(s=>s.url===source.url);
  // Persisted collector status honours Retry-After across Worker restarts.
  if(previous?.nextPollAt&&previous.nextPollAt>started)return {stories:[] as Story[],status:previous};
  const base={name:source.name,url:source.url,category:source.category};let nextPollAt=source.name==='Bank of England'?started+3600000:['CoinDesk','ECB','SEC','EIA'].includes(source.name)?started+300000:source.name==='Watcher.Guru Live'?started+60000:marketPublishers[source.name]?started+120000:undefined;
  try{
   const r=await fetch(source.url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)','Accept':'application/rss+xml,application/xml,text/xml'},signal:AbortSignal.timeout(12000)});
   if(r.status===429||r.status===503){const raw=r.headers.get('Retry-After');const retry=raw?(/^\d+$/.test(raw)?started+Number(raw)*1000:Date.parse(raw)):0;nextPollAt=Math.max(started+300000,Number.isFinite(retry)?retry:0)}
   if(!r.ok)throw Error('HTTP '+r.status);
   const xml=(await r.text()).slice(0,1500000),stories=source.name==='Watcher.Guru Live'?parseTelegramPreview(xml):parseFeed(xml,source);
   if(!stories.length&&!/<item(?:\s|>)|data-post="WatcherGuru\//i.test(xml))throw Error('No readable articles');
   return {stories,status:{...base,ok:true,count:stories.length,latency:Date.now()-started,...(nextPollAt?{nextPollAt}:{})}};
  }catch(e){return {stories:[] as Story[],status:{...base,ok:false,count:0,error:e instanceof Error?e.message:'Source unavailable',...(nextPollAt?{nextPollAt}:{})}}}
 }));
 const stories=dedupe(results.flatMap(r=>r.stories)).sort((a,b)=>(Date.parse(b.publishedAt||'')||0)-(Date.parse(a.publishedAt||'')||0));
 const data={stories,sources:results.map(r=>r.status),fetchedAt:new Date().toISOString()};cache={at:Date.now(),data};return data;
}
