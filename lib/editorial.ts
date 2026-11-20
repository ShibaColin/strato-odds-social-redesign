import type {Story} from './news';
export const EDITORIAL_VERSION=2;
export function publishText(text:string){return text.replace(/^\s*View the related market on STRATO Odds:\s*https:\/\/stratoodds\.com\/markets\/[^\s]+\s*$/gmi,'').replace(/^\s*(?:Reported by|Source:)\s+[^\n]+\.?\s*$/gmi,'').replace(/^\s*Coinbase USD spot (?:prices|data) as of[^\n]*$/gmi,'').replace(/^\s*Explore prediction markets on STRATO Odds:\s*https:\/\/stratoodds\.com\/?\s*$/gmi,'').replace(/\n{3,}/g,'\n\n').trim()}
function quantities(s:string){const scale:Record<string,string>={b:'billion',m:'million',t:'trillion',k:'thousand',hr:'hour',hrs:'hour',hours:'hour',days:'day',weeks:'week',months:'month',years:'year',minutes:'minute',mins:'minute',min:'minute'};return Array.from(s.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand|hours?|hrs?|days?|weeks?|months?|years?|minutes?|mins?|[tbmk])\b/gi),m=>m[1].replace(/,/g,'')+':'+(scale[m[2].toLowerCase()]||m[2].toLowerCase()))}
function numbers(s:string){return s.match(/\d[\d,]*(?:\.\d+)?/g)?.map(n=>n.replace(/,/g,''))||[]}
export function validateRewrite(story:Story,raw:string){
 const text=publishText(raw).replace(/[—–]/g,'.').trim();
 if(text.length<18||text.length>850||/https?:\/\/|reported by|as an ai|the user|let me|here(?:'s| is) (?:the|a) (?:rewritten|post)|<think>|reasoning|```/i.test(text))throw Error('Invalid editorial output');
 const aliases:Record<string,string>={'Federal Reserve':'Federal Reserve|Fed|FOMC','SEC':'SEC|Securities and Exchange Commission','CFTC':'CFTC|Commodity Futures Trading Commission','Bank of Russia':"Bank of Russia|Russia.s central bank|Russian central bank",'China':'China|Chinese|Beijing','Russia':'Russia|Russian|Moscow','NVIDIA':'NVIDIA|NVDA','Microsoft':'Microsoft|MSFT'};
 for(const actor of ['administration','Congress','Senate','SEC','CFTC','Federal Reserve','White House','Bank of Russia','China','Russia','NVIDIA','Microsoft','BlackRock'])if(new RegExp('\\b'+actor+'\\b','i').test(text)&&!new RegExp('\\b(?:'+(aliases[actor]||actor)+')\\b','i').test(story.title+' '+story.summary))throw Error('Unsupported actor in rewrite');
 if(/pivotal|transformative potential|ongoing market strain|game.changer|underscores|evolving landscape|major milestone/i.test(text))throw Error('Editorial filler');
 if(/(?:bid|appeal|request) for.{0,60}access/i.test(story.title)&&/appeal against.{0,60}access/i.test(text))throw Error('Reversed claim');
 const source=story.title+' '+story.summary,units=new Set(quantities(source));if(quantities(text).some(q=>!units.has(q)))throw Error('Unsupported quantity or time window');for(const symbol of ['$','€','£'])if(text.includes(symbol)&&!source.includes(symbol))throw Error('Changed currency');
 const known=new Set(numbers(story.title+' '+story.summary));if(numbers(text).some(n=>!known.has(n)))throw Error('Unsupported number in rewrite');
 if(/\b(could|might|may|alleged|reportedly|propos(?:es|ed|al)|plans? to|considering)\b/i.test(story.title)&&!/\b(could|might|may|alleged|reportedly|propos(?:es|ed|al)|plans? to|considering|would|reported|expected)\b/i.test(text))throw Error('Uncertainty was removed');
 const normalized=(s:string)=>s.toLowerCase().replace(/^(just in|breaking news)[:\s]*/,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
 if(normalized(text)===normalized(story.title))throw Error('Unchanged source headline');
 const original=(story.title+' '+story.summary).toLowerCase().match(/[a-z0-9]+/g)||[],output=text.toLowerCase().match(/[a-z0-9]+/g)||[];
 for(let i=0;i+12<=output.length;i++)if(original.join(' ').includes(output.slice(i,i+12).join(' ')))throw Error('Copied source phrasing');
 return text;
}
