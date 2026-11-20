import type { Story } from './news';
export const COPY_VERSION = 7;

// Remove editorial divider punctuation, while preserving minus signs, ranges,
// hyphenated names, tickers and the wording of attributed claims.
export function cleanCopy(value:string){
 return value.replace(/\r/g,'').replace(/^\s*(?:#{1,6}\s+|[•*]\s+)/gm,'')
  .replace(/^\s*[-_]{3,}\s*$/gm,'').replace(/\*\*/g,'')
  .replace(/\s+[—–-]\s+/g,'. ').replace(/([A-Za-z”"'])\s*[—–]\s*(?=[A-Za-z“"'])/g,'$1. ')
  .replace(/([.!?]\s+)([a-z])(?![A-Z])/g,(_,gap,letter)=>gap+letter.toUpperCase()).replace(/[ \t]+/g,' ').replace(/\s+([,.!?])/g,'$1')
  .replace(/\.{2,}(?!\.)/g,'.').replace(/\n{3,}/g,'\n\n').trim();
}
function sentence(value:string){const text=cleanCopy(value);return /[.!?][”"']?$/.test(text)?text:text+'.'}
const stop=new Set('the a an and or of to in on for with is are was were its it as at by from that this be has have after says said now new'.split(' '));
function words(s:string){return s.toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>!stop.has(w))||[]}
function addsDetail(candidate:string,previous:string){const known=new Set(words(previous));const extra=words(candidate).filter(w=>!known.has(w));return extra.length>=4&&extra.length/Math.max(1,words(candidate).length)>.27}
export function newsLabel(story:Story,now=Date.now()):'JUST IN'|'BREAKING NEWS'|null{
 const age=now-Date.parse(story.publishedAt||'');
 if(!Number.isFinite(age)||age<0||age>60*60000)return null;
 const text=story.title;
 if(/here.?s what|what (?:typically )?happens next|what to know|history of/i.test(text))return null;
 if(/^(how|why|what|here|opinion|analysis|explained|morning minute|watch:)|\b(could|might|may|forecast|predicted|prediction|last week|yesterday|last month)\b/i.test(text))return null;
 if(age<=30*60000&&/\b(declares? war|emergency rate cut|emergency rate hike|ceasefire (agreed|announced)|fitch.{0,35}(lower|cut|downgrad)|central banks.{0,60}(gold buying|gold purchases)|sec approves.{0,30}etf|trading halt|exchange.{0,20}hack)\b/i.test(text))return 'BREAKING NEWS';
 return 'JUST IN';
}
function closing(story:Story){
 const evidence=story.title+' '+story.summary;
 if(/central banks/i.test(evidence)&&/gold/i.test(evidence)&&/buying|purchases|stockpil|accumulat/i.test(evidence))return 'They continue to stockpile.';
 if(/\b(fitch|moody|s&p)\b/i.test(evidence)&&/\b(france|sovereign|government)\b/i.test(evidence)&&/negative|downgrad/i.test(evidence))return 'A world in debt.';
 return '';
}
export function sourcePost(story:Story,now=Date.now()){
 if(story.dataPost)return story.dataPost;
 const label=newsLabel(story,now);
 let lead=sentence(story.title.replace(/^(?:JUST IN:\s*|BREAKING NEWS[:\s]*)/i,'').replace(/[.:]\s*(?:Here.?s what|What (?:typically )?happens next|What to know)[\s\S]*$/i,''));
 const summary=cleanCopy(story.summary);
 const details:string[]=[];
 // A complete RSS excerpt may add the numbers, scope or reaction behind a
 // headline. Never stretch a clipped fragment into a new factual assertion.
 const protectedSummary=summary.replace(/\b(?:[A-Z]\.){2,}|\b(?:Mr|Ms|Mrs|Dr|Prof|Inc|Ltd|Co|vs)\.(?=\s|$)/g,part=>part.replace(/\./g,'\uE000'));
 const sentences=protectedSummary.split(/(?<=[.!?])\s+(?=[A-Z0-9“"‘$])/u).map(part=>part.replace(/\uE000/g,'.'));
 for(const fragment of sentences){
  const candidate=fragment.trim();
  if(!candidate||/…|\.\.\.$/.test(candidate)||candidate.length<30||/here'?s what|read more|find out|in this article|need to know|every weekday|investing club/i.test(candidate))continue;
  if(candidate.length>550)continue;
  if(!/[.!?][”"']?$/.test(candidate)&&story.summary.length>=1400)continue;
  if(addsDetail(candidate,lead+' '+details.join(' ')))details.push(sentence(candidate));
  if(details.length===2)break;
 }
 if(label==='BREAKING NEWS')lead='BREAKING NEWS\n\n'+lead.toUpperCase();
 else if(label)lead='JUST IN: '+lead;
 const end=closing(story);
 return [lead,...details,end&&!details.some(d=>d.toLowerCase().includes(end.toLowerCase().replace(/\.$/,'')))?end:''].filter(Boolean).join('\n\n');
}
