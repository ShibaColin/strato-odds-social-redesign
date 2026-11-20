/** Confirmed Treasury records and Bitcoin block observations. Projections are explicitly separate. */
export type MacroPoint={at:number;value:number};
export type MacroEstimate={anchorAt:number;anchorValue:number;perSecond:number;method:string;sampleStartDate:string};
export type MacroDebt={total:number|null;publicDebt:number|null;intragovernmental:number|null;date:string|null;history:MacroPoint[];source:string;url:string;previousChange:number|null;estimate:MacroEstimate|null};
export type MacroSpending={total:number|null;date:string|null;fiscalYear:number|null;history:MacroPoint[];source:string;url:string;estimate:MacroEstimate|null};
export type MacroBitcoin={height:number|null;halvingHeight:number|null;blocksRemaining:number|null;reward:number|null;nextReward:number|null;estimatedAt:number|null;progress:number|null;observedAt:number|null;lastBlockAt:number|null;averageBlockSeconds:number|null;sampledBlocks:number|null;blocks:{height:number;at:number}[];history:{height:number;at:number}[];source:string;url:string;estimateMethod:string};
export type MacroSnapshot={asOf:number;debt:MacroDebt;spending:MacroSpending;bitcoin:MacroBitcoin;errors:string[]};
const TREASURY='https://api.fiscaldata.treasury.gov/services/api/fiscal_service/';
const DEBT_URL='https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny';
const SPENDING_URL='https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/';
const HEADERS={Accept:'application/json','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'};
const cache=new Map<string,{until:number;value:unknown}>(),pending=new Map<string,Promise<unknown>>();
async function read<T>(url:string,ttl:number,text=false):Promise<T>{
 const hit=cache.get(url);if(hit&&hit.until>Date.now())return hit.value as T;
 const waiting=pending.get(url);if(waiting)return waiting as Promise<T>;
 const work=(async()=>{const r=await fetch(url,{headers:HEADERS,signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Source unavailable');const v=text?await r.text():await r.json();cache.set(url,{until:Date.now()+ttl,value:v});return v})();pending.set(url,work);try{return await work as T}finally{pending.delete(url)}
}
function amount(v:unknown){if(typeof v!=='string'||!/^\d+(?:\.\d+)?$/.test(v))throw Error('Invalid Treasury amount');const n=Number(v);if(!Number.isFinite(n)||n<0||n>1e16)throw Error('Implausible Treasury amount');return n}
function day(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Invalid Treasury date');const at=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==v)throw Error('Invalid Treasury date');return at}
function debtEmpty():MacroDebt{return {total:null,publicDebt:null,intragovernmental:null,date:null,history:[],source:'U.S. Treasury · Debt to the Penny',url:DEBT_URL,previousChange:null,estimate:null}}
function spendingEmpty():MacroSpending{return {total:null,date:null,fiscalYear:null,history:[],source:'U.S. Treasury · Monthly Treasury Statement',url:SPENDING_URL,estimate:null}}
type DebtRow={record_date:string;tot_pub_debt_out_amt:string;debt_held_public_amt?:string;intragov_hold_amt?:string};
export function parseDebt(latestData:unknown,historyData:unknown,now=Date.now()):MacroDebt{
 const current=(latestData as {data?:DebtRow[]})?.data,history=(historyData as {data?:DebtRow[]})?.data;
 if(!Array.isArray(current)||current.length<2||!Array.isArray(history))throw Error('Missing Treasury records');
 const valid=current.map(r=>({...r,at:day(r.record_date),value:amount(r.tot_pub_debt_out_amt)})).sort((a,b)=>b.at-a.at);const latest=valid[0];
 if(latest.at>now||now-latest.at>14*86400000)throw Error('Treasury debt records are stale');
 const publicDebt=amount(latest.debt_held_public_amt),intragovernmental=amount(latest.intragov_hold_amt);
 if(Math.abs(publicDebt+intragovernmental-latest.value)>2)throw Error('Treasury totals do not reconcile');
 const seen=new Map<number,MacroPoint>();for(const r of history){try{const at=day(r.record_date),value=amount(r.tot_pub_debt_out_amt);if(at<=latest.at)seen.set(at,{at,value})}catch{}}
 for(const r of valid)seen.set(r.at,{at:r.at,value:r.value});const full=[...seen.values()].sort((a,b)=>a.at-b.at);
 // Keep genuine month-end observations before the last year and daily observations in the last year.
 const monthly=new Map<string,MacroPoint>();for(const p of full)monthly.set(new Date(p.at).toISOString().slice(0,7),p);
 const compact=[...new Map([...monthly.values(),...full.filter(p=>latest.at-p.at<=366*86400000)].map(p=>[p.at,p])).values()].sort((a,b)=>a.at-b.at);
 const target=latest.at-365*86400000;const baseline=full.filter(p=>Math.abs(p.at-target)<=7*86400000).sort((a,b)=>Math.abs(a.at-target)-Math.abs(b.at-target))[0];
 const estimate=baseline?{anchorAt:latest.at,anchorValue:latest.value,perSecond:(latest.value-baseline.value)/((latest.at-baseline.at)/1000),method:'Linear projection using the change between the latest official debt record and the nearest record one year earlier. Not an official intraday debt measurement.',sampleStartDate:new Date(baseline.at).toISOString().slice(0,10)}:null;
 return {...debtEmpty(),total:latest.value,publicDebt,intragovernmental,date:latest.record_date,history:compact,previousChange:latest.value-valid[1].value,estimate};
}
async function debt(now:number){
 const [latest,history]=await Promise.all([
  read<unknown>(TREASURY+'v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=365&fields=record_date,tot_pub_debt_out_amt,debt_held_public_amt,intragov_hold_amt',900000),
  read<unknown>(TREASURY+'v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=10000&fields=record_date,tot_pub_debt_out_amt',21600000),
 ]);return parseDebt(latest,history,now);
}
type SpendingRow={record_date:string;parent_id:string;classification_id:string;classification_desc:string;current_month_gross_outly_amt:string;record_fiscal_year:string;record_type_cd:string};
export function parseSpending(raw:unknown,now=Date.now()):MacroSpending{
 const rows=(raw as {data?:SpendingRow[]})?.data;if(!Array.isArray(rows)||!rows.length)throw Error('Missing spending records');
 const dates=[...new Set(rows.map(r=>r.record_date))].sort().reverse();const date=dates[0],at=day(date);if(at>now||now-at>70*86400000)throw Error('Treasury spending records are stale');
 const group=rows.filter(r=>r.record_date===date),fiscalYear=Number(group[0].record_fiscal_year);if(!Number.isSafeInteger(fiscalYear)||fiscalYear<2000||fiscalYear>2200)throw Error('Invalid fiscal year');
 const valueAt=(recordRows:SpendingRow[],fy:number)=>{const parent=recordRows.find(r=>r.classification_desc==='FY '+fy);if(!parent)return null;const ytd=recordRows.find(r=>r.parent_id===parent.classification_id&&r.classification_desc==='Year-to-Date');return ytd?amount(ytd.current_month_gross_outly_amt):null};
 // FiscalData API CURRENCY fields are dollar amounts ($10.20), unlike the published MTS report's millions display.
 const total=valueAt(group,fiscalYear);if(total===null)throw Error('Missing fiscal-year total');
 const history:MacroPoint[]=[];for(const d of dates){try{const rs=rows.filter(r=>r.record_date===d),value=valueAt(rs,fiscalYear);if(value!==null)history.push({at:day(d),value})}catch{}}
 history.sort((a,b)=>a.at-b.at);const previousYear=valueAt(group,fiscalYear-1);const start=Date.UTC(fiscalYear-2,9,1),end=Date.UTC(fiscalYear-1,9,1);
 const estimate=previousYear===null?null:{anchorAt:at+86400000,anchorValue:total,perSecond:previousYear/((end-start)/1000),method:'Linear projection from the latest reported fiscal-year-to-date outlays using the previous completed fiscal year’s average spending rate. Not a measured intraday Treasury outlay.',sampleStartDate:new Date(start).toISOString().slice(0,10)};
 return {...spendingEmpty(),total,date,fiscalYear,history,estimate};
}
async function spending(now:number){return parseSpending(await read<unknown>(TREASURY+'v1/accounting/mts/mts_table_1?sort=-record_date&page[size]=400&fields=record_date,parent_id,classification_id,classification_desc,current_month_gross_outly_amt,record_fiscal_year,record_type_cd',3600000),now)}
function bitcoinEmpty():MacroBitcoin{return {height:null,halvingHeight:null,blocksRemaining:null,reward:null,nextReward:null,estimatedAt:null,progress:null,observedAt:null,lastBlockAt:null,averageBlockSeconds:null,sampledBlocks:null,blocks:[],history:[],source:'Bitcoin blockchain · mempool.space',url:'https://mempool.space/',estimateMethod:'Average time over the last 50,000 observed blocks. Future block timing is estimated.'}}
export function parseBitcoin(raw:unknown,baseline:unknown,now=Date.now(),provider='https://mempool.space'):MacroBitcoin{
 if(!Array.isArray(raw)||!raw.length)throw Error('Missing Bitcoin blocks');
 const blocks=raw.map(r=>({height:Number(r.height),at:Number(r.timestamp)*1000})).filter(r=>Number.isSafeInteger(r.height)&&r.height>=210000&&r.height<10000000&&Number.isFinite(r.at)&&r.at>1231006505000&&r.at<=now+120000).sort((a,b)=>b.height-a.height);
 if(!blocks.length||now-blocks[0].at>3*3600000)throw Error('Stale Bitcoin tip');const latest=blocks[0],base=baseline as {height?:number;timestamp?:number};
 if(!Number.isSafeInteger(base.height)||base.height!==latest.height-50000||!Number.isFinite(base.timestamp))throw Error('Invalid block interval baseline');
 const seconds=(latest.at/1000-Number(base.timestamp))/50000;if(seconds<120||seconds>3600)throw Error('Implausible measured block interval');
 const era=Math.floor(latest.height/210000),halvingHeight=(era+1)*210000,remaining=halvingHeight-latest.height;const reward=Math.floor(5000000000/2**era)/1e8,nextReward=Math.floor(5000000000/2**(era+1))/1e8;
 return {...bitcoinEmpty(),height:latest.height,halvingHeight,blocksRemaining:remaining,reward,nextReward,estimatedAt:latest.at+remaining*seconds*1000,progress:(latest.height-era*210000)/210000*100,observedAt:now,lastBlockAt:latest.at,averageBlockSeconds:seconds,sampledBlocks:50000,blocks:blocks.slice(0,25),history:blocks.slice(0,25).reverse(),source:'Bitcoin blockchain · '+(provider.includes('mempool')?'mempool.space':'Blockstream'),url:provider+'/'};
}
async function bitcoin(now:number){
 for(const provider of ['https://mempool.space','https://blockstream.info']){
  try{const blocks=await read<{height:number;timestamp:number}[]>(provider+'/api/blocks',15000);if(!Array.isArray(blocks)||!Number.isSafeInteger(blocks[0]?.height))throw Error('Invalid block response');const baselineHeight=blocks[0].height-50000;
   const hash=(await read<string>(provider+'/api/block-height/'+baselineHeight,3600000,true)).trim();if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid baseline block hash');
   const base=await read<unknown>(provider+'/api/block/'+hash,86400000);return parseBitcoin(blocks,base,now,provider);
  }catch{}
 }throw Error('Bitcoin chain sources unavailable');
}
let snapshot:{at:number;value:MacroSnapshot}|null=null,snapshotPending:Promise<MacroSnapshot>|null=null;
export async function macroSnapshot():Promise<MacroSnapshot>{
 const now=Date.now();if(snapshot&&now>=snapshot.at&&now-snapshot.at<15000)return snapshot.value;if(snapshotPending)return snapshotPending;
 snapshotPending=(async()=>{const out:MacroSnapshot={asOf:now,debt:debtEmpty(),spending:spendingEmpty(),bitcoin:bitcoinEmpty(),errors:[]};const results=await Promise.allSettled([debt(now),spending(now),bitcoin(now)]);
  if(results[0].status==='fulfilled')out.debt=results[0].value;else out.errors.push('U.S. Treasury debt data unavailable or stale');
  if(results[1].status==='fulfilled')out.spending=results[1].value;else out.errors.push('U.S. Treasury spending data unavailable or stale');
  if(results[2].status==='fulfilled')out.bitcoin=results[2].value;else out.errors.push('Bitcoin chain data unavailable or stale');snapshot={at:now,value:out};return out})();try{return await snapshotPending}finally{snapshotPending=null}
}
