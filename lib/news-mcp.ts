import {collectNews,cloudStatus,type NewsEnv} from './cloud-news';
export async function newsMcp(request:Request,env:NewsEnv){
 const rpc=await request.json() as {id?:string|number;method?:string;params?:{name?:string}};
 let result:unknown;
 if(rpc.method==='server/discover')result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};
 else if(rpc.method==='initialize')result={protocolVersion:'2025-11-25',capabilities:{tools:{}},serverInfo:{name:'STRATO Newsdesk',version:'1.0.0'}};
 else if(rpc.method==='tools/list')result={tools:[{name:'refresh_newsdesk',description:'Fetch market news, save new posts and send each new post to the owner’s configured private Telegram chat. Deduplicates deliveries. No action when nothing changed.',inputSchema:{type:'object',properties:{},additionalProperties:false}},{name:'newsdesk_status',description:'Read the last news update and Telegram delivery status.',inputSchema:{type:'object',properties:{},additionalProperties:false}}]};
 else if(rpc.method==='tools/call'){
  try{const value=rpc.params?.name==='refresh_newsdesk'?await collectNews(env):rpc.params?.name==='newsdesk_status'?await cloudStatus(env):null;if(!value)throw Error('Unknown tool');result={content:[{type:'text',text:JSON.stringify(value)}]}}
  catch{result={isError:true,content:[{type:'text',text:'Newsdesk update failed. Inspect private newsdesk status; no credentials are returned.'}]}}
 }
 else if(rpc.method?.startsWith('notifications/'))return new Response(null,{status:202});
 else return Response.json({jsonrpc:'2.0',id:rpc.id??null,error:{code:-32601,message:'Method not found'}});
 return Response.json({jsonrpc:'2.0',id:rpc.id??null,result});
}
