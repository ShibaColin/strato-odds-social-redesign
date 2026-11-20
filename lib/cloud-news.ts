import {newsFeed,type Story} from './news';
import {fetchQuotes,marketStories,emptyMarketState,type MarketState} from './market-data';
import {eligible,withPredictionMarket,type Post} from './drafts';
import {oddsMarkets,matchMarket,marketReply} from './odds-markets';
import {validateRewrite,publishText,EDITORIAL_VERSION} from './editorial';
import {sourcePost,COPY_VERSION,newsLabel} from './post-copy';

export type NewsEnv={DB?:D1Database;TELEGRAM_BOT_TOKEN?:string;TELEGRAM_CHAT_ID?:string;TELEGRAM_BOT_USERNAME?:string;EDITORIAL_PIPELINE?:string};
type Row={id:string;event_key:string;story:string;body:string;mode:string;promo:number;created_at:number;updated_at:number;delivery:string;telegram_message_id:number|null;attempts:number;next_attempt:number;error:string|null};
const ORIGIN='https://strato-newsdesk-nvsa.blockapps-in-3549.chatgpt.site';
function dbOf(env:NewsEnv){if(!env.DB)throw Error('Cloud database unavailable');return env.DB}
async function meta<T>(db:D1Database,key:string,fallback:T):Promise<T>{const row=await db.prepare('SELECT value FROM news_meta WHERE key=?').bind(key).first<{value:string}>();try{return row?JSON.parse(row.value):fallback}catch{return fallback}}
function put(db:D1Database,key:string,value:unknown){return db.prepare('INSERT INTO news_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(value))}
function eventKey(story:Story){if(story.dataPost)return story.id;return story.title.toLowerCase().normalize('NFKC').replace(/[^a-z0-9]/g,'')}
export async function telegramRequest(env:NewsEnv,method:string,body:unknown){
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)throw Error('Telegram not configured');
 let response:Response;
 try{response=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:body instanceof FormData?undefined:{'Content-Type':'application/json'},body:body instanceof FormData?body:JSON.stringify(body),signal:AbortSignal.timeout(15000)})}catch{throw Error('TELEGRAM_UNCERTAIN')}
 let result:{ok?:boolean;result?:unknown;error_code?:number;parameters?:{retry_after?:number}};
 try{result=await response.json() as typeof result}catch{throw Error('TELEGRAM_UNCERTAIN')}
 if(!result.ok){if(result.error_code===429)throw Error('TELEGRAM_RATE_LIMIT:'+(result.parameters?.retry_after||60));throw Error('TELEGRAM_REJECTED:'+(result.error_code||response.status))}
 return result.result;
}
async function sendPost(env:NewsEnv,body:string,sourceURL?:string,image?:{data:string;type:string}){
 const buttons:Array<{text:string;url?:string;copy_text?:{text:string}}>=[];
 if(sourceURL)buttons.push({text:'Source',url:sourceURL});
 buttons.push({text:'Open Newsdesk',url:ORIGIN});
 if(body.length<=256)buttons.unshift({text:'Copy post',copy_text:{text:body}});
 if(image&&body.length<=1024){const bytes=Uint8Array.from(atob(image.data),c=>c.charCodeAt(0));const form=new FormData();form.set('chat_id',env.TELEGRAM_CHAT_ID!);form.set('caption',body);form.set('disable_notification','false');form.set('reply_markup',JSON.stringify({inline_keyboard:[buttons]}));form.set('photo',new Blob([bytes],{type:image.type}),image.type==='image/jpeg'?'news.jpg':'news.png');return await telegramRequest(env,'sendPhoto',form) as {message_id:number}}
 return await telegramRequest(env,'sendMessage',{chat_id:env.TELEGRAM_CHAT_ID,text:body,disable_notification:false,link_preview_options:{is_disabled:true},reply_markup:{inline_keyboard:[buttons]}}) as {message_id:number};
}
export async function cloudStatus(env:NewsEnv){
 const db=dbOf(env);
 const status=await meta<Record<string,unknown>>(db,'last_tick',{});
 const storedSchedule=await meta<{enabled:boolean;cadence:string;enabledAt:string;lastSeenAt?:string;verifiedRuns?:number}|null>(db,'schedule',null);
 const schedule=storedSchedule?{...storedSchedule,enabled:storedSchedule.enabled&&Date.now()-Date.parse(storedSchedule.lastSeenAt||storedSchedule.enabledAt)<180000}:null;
 const serverConfirmation=await meta<Record<string,unknown>|null>(db,'server_confirmation',null);
 const test=await meta<Record<string,unknown>|null>(db,'test',null);
 const counts=await db.prepare("SELECT delivery,count(*) AS count FROM news_posts GROUP BY delivery").all<{delivery:string;count:number}>();
 const editorial=await meta<Record<string,unknown>|null>(db,'editorial_status',null);
 return {editorial:{enabled:env.EDITORIAL_PIPELINE==='local',last:editorial},configured:!!(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID),bot:env.TELEGRAM_BOT_USERNAME||null,schedule,test,serverConfirmation,lastTick:status,counts:counts.results};
}
export async function cloudFeed(env:NewsEnv){
 const db=dbOf(env);
 const markets=await oddsMarkets();
 const rows=await db.prepare("SELECT * FROM news_posts ORDER BY json_extract(story,'$.publishedAt') DESC LIMIT 240").all<Row>();
 const mediaKeys=new Set((await db.prepare("SELECT key FROM news_meta WHERE key LIKE 'media:%'").all<{key:string}>()).results.map(x=>x.key));
 const posts=Object.fromEntries(rows.results.map(row=>{const story=JSON.parse(row.story) as Story;if(story.media&&((story.mediaVersion||0)<3||!mediaKeys.has('media:'+row.id)))delete story.media;const market=matchMarket(story,markets);const post:Post={story,text:publishText(row.mode==='source'?sourcePost(story):row.body),mode:row.mode==='ai'?'ai':'source',promo:!!row.promo,copied:false,edited:row.mode==='edited',copyVersion:COPY_VERSION,updatedAt:row.updated_at,market,marketReply:marketReply(market),ready:env.EDITORIAL_PIPELINE!=='local'||row.mode==='edited'||story.enrichedVersion===EDITORIAL_VERSION};return [row.id,post]}));
 const last=await meta<{sources?:unknown[];at?:string}>(db,'last_tick',{});
 return {stories:Object.values(posts).map(p=>p.story),cloudPosts:posts,sources:last.sources||[],fetchedAt:last.at||null,cloud:true};
}
export async function saveCloudPost(env:NewsEnv,id:string,body:string,promo:boolean){return dbOf(env).prepare("UPDATE news_posts SET body=?,promo=?,mode='edited',updated_at=? WHERE id=?").bind(body,promo?1:0,Date.now(),id).run()}
export async function setFrequency(env:NewsEnv,every:number){if(![0,5,8,10,20].includes(every))throw Error('Invalid frequency');await put(dbOf(env),'every',every).run()}
export async function cloudFrequency(env:NewsEnv){return meta(dbOf(env),'every',8)}
export async function activateSchedule(env:NewsEnv,cadence:string){const db=dbOf(env);const old=await meta<{enabledAt?:string;verifiedRuns?:number}>(db,'schedule',{});await put(db,'schedule',{enabled:true,engine:'systemd',cadence,enabledAt:old.enabledAt||new Date().toISOString(),lastSeenAt:new Date().toISOString(),verifiedRuns:(old.verifiedRuns||0)+1}).run();return cloudStatus(env)}
export async function testTelegram(env:NewsEnv){
 const db=dbOf(env);
 const existing=await meta<{state?:string;messageId?:number}>(db,'test',{});
 if(existing.state)return {alreadyAttempted:true,...existing};
 const bot=await telegramRequest(env,'getMe',{}) as {username?:string};
 if(bot.username?.toLowerCase()!=='stratonews_bot')throw Error('Unexpected Telegram bot');
 const chat=await telegramRequest(env,'getChat',{chat_id:env.TELEGRAM_CHAT_ID}) as {type?:string};
 if(chat.type!=='private')throw Error('Telegram destination is not a private chat');
 const claim=await db.prepare("INSERT OR IGNORE INTO news_meta(key,value) VALUES('test',?)").bind(JSON.stringify({state:'sending',at:new Date().toISOString()})).run();
 if(!claim.meta.changes)return {alreadyAttempted:true};
 try{const sent=await sendPost(env,'STRATO Newsdesk is gekoppeld aan jouw Telegram.\n\nDit is de testmelding. Nieuwsberichten worden naar deze privéchat gestuurd zodra de achtergrondcontrole is geactiveerd.');await put(db,'test',{state:'sent',messageId:sent.message_id,at:new Date().toISOString()}).run();return {state:'sent',messageId:sent.message_id}}
 catch(e){const error=e instanceof Error?e.message:'Telegram test failed';await put(db,'test',{state:'needs_review',at:new Date().toISOString(),error}).run();throw Error(error)}
}
export async function collectNews(env:NewsEnv,notify=true){
 const db=dbOf(env),now=Date.now();
 const lease=JSON.stringify({until:now+300000,owner:crypto.randomUUID()});
 const lock=await db.prepare("INSERT INTO news_meta(key,value) VALUES('tick_lock',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(json_extract(news_meta.value,'$.until') AS INTEGER)<?").bind(lease,now).run();
 if(!lock.meta.changes)return {skipped:'already_running'};
 try{
  const priorTick=await meta<{sources?:Awaited<ReturnType<typeof newsFeed>>['sources']}>(db,'last_tick',{});
  const [feed,market]=await Promise.all([newsFeed(priorTick.sources||[]),fetchQuotes(now)]);
  if(!feed.stories.length&&!market.quotes.length)throw Error('All news and price sources unavailable');
  const generated=marketStories(market.quotes,await meta<MarketState>(db,'market_state',emptyMarketState()),now);
  feed.stories=[...feed.stories,...generated.stories];
  feed.sources=[...feed.sources,...market.sources];
  const initialized=await meta<number|null>(db,'initialized_at',null);
  const baseline=!initialized;
  const sinceStart=initialized||now;
  const knownSources=new Set((priorTick.sources||[]).map(s=>s.name));
  let counter=await meta<number>(db,'counter',0);
  const every=await cloudFrequency(env);
  const previous=await db.prepare('SELECT id,event_key FROM news_posts').all<{id:string;event_key:string}>();
  const ids=new Set(previous.results.map(r=>r.id)),events=new Set(previous.results.map(r=>r.event_key));
  const inserts:D1PreparedStatement[]=[];let added=0,liveCatchup=0;
  for(const story of [...feed.stories].reverse()){
   const published=Date.parse(story.publishedAt||'');
   if(!Number.isFinite(published)||published>now+60000||now-published>86400000||ids.has(story.id)||events.has(eventKey(story)))continue;
   counter++;const promo=false;
   const catchup=story.source==='Watcher.Guru Live'&&!knownSources.has(story.source)&&(story.importance||0)>=90&&now-published<=1800000&&liveCatchup<3;
   if(catchup)liveCatchup++;
   const delivery=baseline||!notify||published<sinceStart-300000||(!knownSources.has(story.source)&&published<now-300000&&!catchup)?'baseline':'pending';
   inserts.push(db.prepare('INSERT OR IGNORE INTO news_posts(id,event_key,story,body,mode,promo,created_at,updated_at,delivery) VALUES(?,?,?,?,?,?,?,?,?)').bind(story.id,eventKey(story),JSON.stringify(story),sourcePost(story),'source',promo?1:0,now,now,delivery));
   ids.add(story.id);events.add(eventKey(story));added++;
  }
  inserts.push(put(db,'counter',counter),put(db,'initialized_at',sinceStart),put(db,'market_state',generated.state));
  await db.batch(inserts);
  // A timed-out send can have reached Telegram. Keep it for review rather than
  // automatically duplicating a delivery whose outcome is unknown.
  await db.prepare("UPDATE news_posts SET delivery='uncertain',error='Previous delivery outcome unknown' WHERE delivery='sending' AND updated_at<?").bind(now-300000).run();
  let sent=0,failed=0;
  if(notify&&!baseline&&env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID){
   const queue=await db.prepare("SELECT * FROM news_posts WHERE delivery IN ('pending','retry') AND next_attempt<=? AND attempts<3"+(env.EDITORIAL_PIPELINE==='local'?" AND json_extract(story,'$.enrichedVersion')=2":'')+" ORDER BY COALESCE(json_extract(story,'$.importance'),30) DESC,created_at,id LIMIT 8").bind(now).all<Row>();
   for(const row of queue.results){
    const claim=await db.prepare("UPDATE news_posts SET delivery='sending',attempts=attempts+1,updated_at=? WHERE id=? AND delivery IN ('pending','retry')").bind(Date.now(),row.id).run();
    if(!claim.meta.changes)continue;
    const story=JSON.parse(row.story) as Story;
    try{const market=matchMarket(story,await oddsMarkets());const image=await meta<{data:string;type:string}|null>(db,'media:'+row.id,null);const result=await sendPost(env,withPredictionMarket(row.mode==='source'?sourcePost(story):row.body,market),story.url,image||undefined);const saved=[db.prepare("UPDATE news_posts SET delivery='sent',telegram_message_id=?,updated_at=?,error=NULL WHERE id=?").bind(result.message_id,Date.now(),row.id)];if(market)saved.push(put(db,'market_reply:'+row.id,{state:'pending',storyId:row.id,parentId:result.message_id,at:Date.now(),updatedAt:Date.now(),attempts:0,nextAttempt:0}));await db.batch(saved);sent++}
    catch(e){const error=e instanceof Error?e.message:'TELEGRAM_UNCERTAIN';const retry=error.startsWith('TELEGRAM_RATE_LIMIT:');const wait=retry?Number(error.split(':')[1])*1000:60000;const state=error==='TELEGRAM_UNCERTAIN'?'uncertain':retry?'retry':'failed';await db.prepare('UPDATE news_posts SET delivery=?,next_attempt=?,updated_at=?,error=? WHERE id=?').bind(state,Date.now()+wait,Date.now(),error,row.id).run();failed++;if(retry)break}
   }
  }
  const replies=notify&&!baseline?await deliverMarketReplies(env):{sent:0,failed:0};
  const status={at:new Date().toISOString(),added,sent,failed,marketReplies:replies,baseline,sources:feed.sources};
  await put(db,'last_tick',status).run();await db.prepare("DELETE FROM news_meta WHERE key LIKE 'media:%' AND CAST(json_extract(value,'$.at') AS INTEGER)<?").bind(now-259200000).run();await db.prepare("DELETE FROM news_meta WHERE key LIKE 'media:%' AND key NOT IN (SELECT key FROM news_meta WHERE key LIKE 'media:%' ORDER BY CAST(json_extract(value,'$.at') AS INTEGER) DESC LIMIT 300)").run();return status;
 }finally{await db.prepare("DELETE FROM news_meta WHERE key='tick_lock' AND value=?").bind(lease).run()}
}

export async function confirmServerReady(env:NewsEnv){
 const db=dbOf(env),status=await cloudStatus(env);
 if(!status.schedule?.enabled||(status.schedule.verifiedRuns||0)<2)throw Error('Two successful server timer runs are required');
 const existing=await meta<Record<string,unknown>|null>(db,'server_confirmation',null);if(existing)return {alreadyAttempted:true,...existing};
 const claim=await db.prepare("INSERT OR IGNORE INTO news_meta(key,value) VALUES('server_confirmation',?)").bind(JSON.stringify({state:'sending',at:new Date().toISOString()})).run();if(!claim.meta.changes)return {alreadyAttempted:true};
 try{const result=await sendPost(env,'STRATO Newsdesk draait nu op de server.\n\nHet nieuws wordt iedere minuut gecontroleerd, ook als je computer uitstaat. Nieuwe posts ontvang je hier.\n\nDit is de bevestiging van de serverkoppeling.');const confirmation={state:'sent',messageId:result.message_id,at:new Date().toISOString()};await put(db,'server_confirmation',confirmation).run();return confirmation}
 catch{await put(db,'server_confirmation',{state:'needs_review',at:new Date().toISOString()}).run();throw Error('Confirmation delivery needs review')}
}

export async function testNotification(env:NewsEnv){
 const db=dbOf(env),now=Date.now();
 const claim=await db.prepare("INSERT INTO news_meta(key,value) VALUES('notification_test',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(json_extract(news_meta.value,'$.at') AS INTEGER)<?").bind(JSON.stringify({at:now,state:'sending'}),now-60000).run();
 if(!claim.meta.changes)return {cooldown:true};
 try{const row=await db.prepare("SELECT value FROM news_meta WHERE key LIKE 'media:%' ORDER BY CAST(json_extract(value,'$.at') AS INTEGER) DESC LIMIT 1").first<{value:string}>();const image=row?JSON.parse(row.value):null;const result=await sendPost(env,image?'STRATO Newsdesk · Beeldtest\n\nDit is een test van de nieuwe afbeeldingbijlagen. Je hoeft dit bericht niet te posten.':'STRATO Newsdesk · Testmelding\n\nDit bericht is met meldingen ingeschakeld verstuurd.',undefined,image||undefined);await put(db,'notification_test',{at:now,state:'sent',messageId:result.message_id}).run();return {sent:true,messageId:result.message_id,withImage:!!image}}
 catch{await put(db,'notification_test',{at:now,state:'needs_review'}).run();throw Error('Notification test delivery needs review')}
}

export async function enrichmentTasks(env:NewsEnv){
 const rows=await dbOf(env).prepare("SELECT * FROM news_posts WHERE ((mode!='edited' AND COALESCE(json_extract(story,'$.enrichedVersion'),0)<2) OR COALESCE(json_extract(story,'$.mediaVersion'),0)<4) AND COALESCE(json_extract(story,'$.editorialRetryAt'),0)<=? AND json_extract(story,'$.publishedAt')>? ORDER BY CASE WHEN delivery IN ('pending','retry') THEN 0 ELSE 1 END,COALESCE(json_extract(story,'$.importance'),30) DESC,json_extract(story,'$.publishedAt') DESC LIMIT 8").bind(Date.now(),new Date(Date.now()-86400000).toISOString()).all<Row>();
 return {tasks:rows.results.map(row=>({id:row.id,story:JSON.parse(row.story),text:row.body,mode:row.mode,mediaOnly:row.mode==='edited'||(JSON.parse(row.story).enrichedVersion||0)>=2,label:newsLabel(JSON.parse(row.story))})),version:EDITORIAL_VERSION};
}
export async function saveEnrichment(env:NewsEnv,input:{id:string;text?:string;error?:boolean;mediaOnly?:boolean;image?:{data:string;type:string;credit:string;kind:string;alt:string;asOf?:string}}){
 const db=dbOf(env),row=await db.prepare('SELECT * FROM news_posts WHERE id=?').bind(input.id).first<Row>();if(!row)throw Error('Unknown post');if(row.mode==='edited'&&!input.mediaOnly)return {skipped:'edited'};
 const story=JSON.parse(row.story) as Story;
 if(input.error){story.editorialRetryAt=Date.now()+180000;await db.prepare('UPDATE news_posts SET story=? WHERE id=?').bind(JSON.stringify(story),row.id).run();return {retry:true}}
 const text=input.mediaOnly?row.body:story.dataPost?publishText(story.dataPost):validateRewrite(story,input.text||'');story.mediaVersion=4;story.enrichedVersion=EDITORIAL_VERSION;delete story.editorialRetryAt;
 const statements:D1PreparedStatement[]=[];
 if(input.image){const i=input.image;if(!['image/png','image/jpeg'].includes(i.type)||i.data.length>900000||!/^[A-Za-z0-9+/=]+$/.test(i.data))throw Error('Invalid media');const bytes=atob(i.data);if(!(bytes.startsWith('\x89PNG\r\n\x1a\n')||bytes.startsWith('\xff\xd8')))throw Error('Invalid image signature');story.media={credit:i.credit.slice(0,500),kind:i.kind.slice(0,80),alt:i.alt.slice(0,500),asOf:i.asOf,type:i.type};statements.push(put(db,'media:'+row.id,{data:i.data,type:i.type,at:Date.now()}))}
 if(!input.image){delete story.media;statements.push(db.prepare('DELETE FROM news_meta WHERE key=?').bind('media:'+row.id))}
 statements.push(db.prepare("UPDATE news_posts SET story=?,body=?,mode=?,promo=0,updated_at=? WHERE id=?").bind(JSON.stringify(story),text,input.mediaOnly?row.mode:story.dataPost?'source':'ai',Date.now(),row.id),put(db,'editorial_status',{at:new Date().toISOString(),model:'qwen3:8b',local:true}));await db.batch(statements);return {saved:true,hasImage:!!input.image};
}
export async function postMedia(env:NewsEnv,id:string){const item=await meta<{data:string;type:string}|null>(dbOf(env),'media:'+id,null);if(!item)return new Response('Image expired',{status:404});return new Response(Uint8Array.from(atob(item.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':item.type,'Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="strato-news.'+(item.type==='image/jpeg'?'jpg':'png')+'"'}})}
export async function composePost(env:NewsEnv,id:string){const row=await dbOf(env).prepare('SELECT * FROM news_posts WHERE id=?').bind(id).first<Row>();if(!row)throw Error('Unknown post');const story=JSON.parse(row.story) as Story;if(env.EDITORIAL_PIPELINE==='local'&&row.mode!=='edited'&&story.enrichedVersion!==EDITORIAL_VERSION)throw Error('Post is still being written');const market=matchMarket(story,await oddsMarkets());return {text:withPredictionMarket(row.mode==='source'?sourcePost(story):row.body),reply:marketReply(market),market}}

type ReplyOutbox={state:string;storyId:string;parentId:number;at:number;updatedAt:number;attempts:number;nextAttempt:number;messageId?:number;error?:string};
export async function deliverMarketReplies(env:NewsEnv){
 const db=dbOf(env);if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)return {sent:0,failed:0};
 await db.prepare("UPDATE news_meta SET value=json_set(value,'$.state','uncertain') WHERE key LIKE 'market_reply:%' AND json_extract(value,'$.state')='sending' AND CAST(json_extract(value,'$.updatedAt') AS INTEGER)<?").bind(Date.now()-300000).run();
 const pending=await db.prepare("SELECT key,value FROM news_meta WHERE key LIKE 'market_reply:%' AND json_extract(value,'$.state') IN ('pending','retry') AND CAST(json_extract(value,'$.nextAttempt') AS INTEGER)<=? AND CAST(json_extract(value,'$.attempts') AS INTEGER)<3 ORDER BY json_extract(value,'$.at') LIMIT 8").bind(Date.now()).all<{key:string;value:string}>();
 let sent=0,failed=0;
 for(const entry of pending.results){
  const item=JSON.parse(entry.value) as ReplyOutbox;
  const row=await db.prepare('SELECT * FROM news_posts WHERE id=?').bind(item.storyId).first<Row>();
  const market=row&&Date.now()-item.at<3600000?matchMarket(JSON.parse(row.story),await oddsMarkets()):null;
  if(!market){await put(db,entry.key,{...item,state:'skipped',updatedAt:Date.now()}).run();continue}
  const claim={...item,state:'sending',attempts:item.attempts+1,updatedAt:Date.now()};
  const locked=await db.prepare('UPDATE news_meta SET value=? WHERE key=? AND value=?').bind(JSON.stringify(claim),entry.key,entry.value).run();if(!locked.meta.changes)continue;
  const text=marketReply(market);
  try{const result=await telegramRequest(env,'sendMessage',{chat_id:env.TELEGRAM_CHAT_ID,text,disable_notification:true,reply_parameters:{message_id:item.parentId},link_preview_options:{is_disabled:true},reply_markup:{inline_keyboard:[[{text:'Open market',url:market.url}],...(text.length<=256?[[{text:'Copy reply',copy_text:{text}}]]:[])]}}) as {message_id:number};await put(db,entry.key,{...claim,state:'sent',messageId:result.message_id,text,updatedAt:Date.now()}).run();sent++}
  catch(e){const error=e instanceof Error?e.message:'TELEGRAM_UNCERTAIN';const rate=error.startsWith('TELEGRAM_RATE_LIMIT:');await put(db,entry.key,{...claim,state:error==='TELEGRAM_UNCERTAIN'?'uncertain':rate?'retry':'failed',nextAttempt:rate?Date.now()+Number(error.split(':')[1])*1000:0,error,updatedAt:Date.now()}).run();failed++;if(rate)break}
 }
 await db.prepare("DELETE FROM news_meta WHERE key LIKE 'market_reply:%' AND CAST(json_extract(value,'$.at') AS INTEGER)<? AND json_extract(value,'$.state') NOT IN ('pending','retry','sending')").bind(Date.now()-259200000).run();return {sent,failed};
}
