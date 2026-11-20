export type EconomicEvent={id:string;title:string;at:number;url:string;source:string;importance:'high'|'medium'};
export type EconomicCalendar={events:EconomicEvent[];asOf:number;available:boolean};
const SOURCES=[
 {name:'BLS',feed:'https://www.bls.gov/schedule/news_release/bls.ics',url:'https://www.bls.gov/schedule/',hosts:['bls.gov','www.bls.gov']},
 {name:'BEA',feed:'https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics',url:'https://www.bea.gov/news/schedule',hosts:['bea.gov','www.bea.gov']},
];
const EASTERN=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function unescapeText(value:string){return value.replace(/\\([nN,;\\])/g,(_,escaped:string)=>escaped.toLowerCase()==='n'?'\n':escaped).trim()}
function parts(at:number){return Object.fromEntries(EASTERN.formatToParts(new Date(at)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]))}
function calendarTime(value:string,zone:string|undefined):number|null{
 const m=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);if(!m)return null;
 const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number);if(year<1970||year>2200||month<1||month>12||day<1||hour>23||minute>59||second>59)return null;
 const wall=Date.UTC(year,month-1,day,hour,minute,second),date=new Date(wall);
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 const tz=zone?.replace(/^"|"$/g,'');
 if(m[7]==='Z')return !tz||['UTC','Etc/UTC','GMT'].includes(tz)?wall:null;
 if(tz==='UTC'||tz==='Etc/UTC'||tz==='GMT')return wall;
 if(tz!=='US/Eastern'&&tz!=='America/New_York')return null;
 // Match both real Eastern offsets through Intl. Nonexistent spring-forward
 // times and ambiguous fall-back times are rejected instead of guessed.
 const matches=[wall+4*3600000,wall+5*3600000].filter(at=>{const p=parts(at);return p.year===year&&p.month===month&&p.day===day&&p.hour===hour&&p.minute===minute&&p.second===second});
 return matches.length===1?matches[0]:null;
}

type Property={name:string;parameters:Record<string,string>;value:string};
function property(line:string):Property|null{
 const i=line.indexOf(':');if(i<1)return null;const head=line.slice(0,i).split(';'),name=head.shift()!.toUpperCase();const parameters:Record<string,string>={};
 for(const part of head){const split=part.indexOf('=');if(split>0)parameters[part.slice(0,split).toUpperCase()]=part.slice(split+1)}
 return {name,parameters,value:line.slice(i+1)};
}
/** Parse only explicitly dated official releases. No RRULE expansion or forecasts. */
export function parseEconomicCalendar(ics:string,source:'BLS'|'BEA',now=Date.now()):EconomicEvent[]{
 if(!ics.includes('BEGIN:VCALENDAR')||!ics.includes('END:VCALENDAR')||ics.length>1000000)throw Error('Invalid official calendar');
 const spec=SOURCES.find(s=>s.name===source)!;const lines=ics.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'').split('\n');
 let current:Property[]|null=null,calendarZone:string|undefined;const records=new Map<string,{event:EconomicEvent;sequence:number;cancelled:boolean}>();
 for(const raw of lines){const line=raw.trimEnd();if(line==='BEGIN:VEVENT'){current=[];continue}
  if(line==='END:VEVENT'){
   if(!current)continue;const fields=current;current=null;const get=(name:string)=>fields.find(f=>f.name===name);
   if(get('RRULE'))continue;const start=get('DTSTART'),summary=get('SUMMARY');if(!start||!summary||start.parameters.VALUE==='DATE')continue;
   const at=calendarTime(start.value,start.parameters.TZID||(!start.value.endsWith('Z')?calendarZone:undefined));if(at===null)continue;
   const title=unescapeText(summary.value).slice(0,500);if(!title)continue;
   const uid=unescapeText(get('UID')?.value||title+'|'+at);const id=source+':'+uid;let url=spec.url;
   try{const link=new URL(unescapeText(get('URL')?.value||''));if(link.protocol==='https:'&&spec.hosts.includes(link.hostname))url=link.href}catch{}
   const sequence=Number(get('SEQUENCE')?.value||0);if(!Number.isSafeInteger(sequence)||sequence<0)continue;
   const event:EconomicEvent={id,title,at,url,source,importance:/consumer price index|producer price index|employment situation|job openings|employment cost index|gross domestic product|\bGDP\b|personal income and outlays/i.test(title)?'high':'medium'};
   const prior=records.get(id);if(!prior||sequence>=prior.sequence)records.set(id,{event,sequence,cancelled:get('STATUS')?.value.toUpperCase()==='CANCELLED'});
   continue;
  }
  const p=property(line);if(!p)continue;if(current)current.push(p);else if(p.name==='X-WR-TIMEZONE')calendarZone=p.value;
 }
 return [...records.values()].filter(r=>!r.cancelled&&r.event.at>=now&&r.event.at<=now+30*86400000).map(r=>r.event).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)).slice(0,60);
}
let cached:{at:number;value:EconomicCalendar}|null=null;
let pending:Promise<EconomicCalendar>|null=null;
export async function economicCalendar():Promise<EconomicCalendar>{
 const now=Date.now();if(cached&&now>=cached.at&&now-cached.at<300000)return cached.value;if(pending)return pending;
 pending=(async()=>{const sources=await Promise.allSettled(SOURCES.map(async s=>{const r=await fetch(s.feed,{headers:{Accept:'text/calendar','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Official calendar unavailable');const ics=await r.text();return parseEconomicCalendar(ics,s.name as 'BLS'|'BEA',now)}));
  const events=sources.flatMap(s=>s.status==='fulfilled'?s.value:[]).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id)).slice(0,60);const value={events,asOf:now,available:sources.some(s=>s.status==='fulfilled')};cached={at:now,value};return value})();
 try{return await pending}finally{pending=null}
}
