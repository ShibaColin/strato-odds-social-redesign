import type { Story } from './news';
import {marketLine,type OddsMarket} from './odds-markets';
import {publishText} from './editorial';
import {COPY_VERSION,sourcePost,newsLabel} from './post-copy';
export const ODDS_URL = 'https://stratoodds.com/';
export const ODDS_LINE = 'Explore prediction markets on STRATO Odds: ' + ODDS_URL;
export type Post = {story:Story; text:string; mode:'source'|'ai'; promo:boolean; copied:boolean;copiedReply?:boolean; edited:boolean; error?:string;copyVersion?:number;updatedAt?:number; market?:OddsMarket|null;marketReply?:string|null; ready?:boolean};
export function eligible(s:Story){return /\b(bitcoin|ethereum|crypto|gold|silver|stocks?|shares|fed|inflation|interest rate|oil|election|president|tariff|sanction|prediction market)\b/i.test(s.title)}
export function sourceDraft(s:Story){return sourcePost(s);}
export function withPredictionMarket(text:string,_market?:OddsMarket|null|boolean){return publishText(text)}
export function ingest(current:Record<string,Post>, incoming:Story[], every:number, count:number){
 const posts=Object.fromEntries(Object.entries(current).map(([id,p])=>[id,p.mode==='source'&&!p.edited&&p.copyVersion!==COPY_VERSION?{...p,text:sourceDraft(p.story),copyVersion:COPY_VERSION}:p]));let since=count;
 for(const story of [...incoming].reverse()){
  if(posts[story.id]){const old=posts[story.id];const refreshCopy=old.mode==='source'&&!old.edited&&(old.copyVersion!==COPY_VERSION||old.story.title!==story.title||old.story.summary!==story.summary||(old.text.startsWith('BREAKING NEWS\n\n')?'BREAKING NEWS':old.text.startsWith('JUST IN:')?'JUST IN':null)!==newsLabel(story));posts[story.id]={...old,story,...(refreshCopy?{text:sourceDraft(story),copyVersion:COPY_VERSION}: {})};continue;}
  since++;
  const promo=every>0&&since>=every&&eligible(story);
  if(promo)since=0;
  posts[story.id]={story,text:sourceDraft(story),mode:'source',copyVersion:COPY_VERSION,promo,copied:false,edited:false};
 }
 return {posts,since};
}
export function stamp(p:Post){return p.story.title+'\n'+p.story.summary}
