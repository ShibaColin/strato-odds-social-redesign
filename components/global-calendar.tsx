'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';

// Official, still-supported isolated calendar embed. Its smaller loader avoids
// the custom-element module/readiness chain that failed in embedded browsers.
const CALENDAR_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-events.js';
const PROVIDER='https://www.tradingview.com/economic-calendar/';
let warmed=false;
export function warmGlobalCalendar(){
 if(typeof document==='undefined'||warmed)return;warmed=true;
 for(const href of ['https://s3.tradingview.com','https://www.tradingview-widget.com']){
  const link=document.createElement('link');link.rel='preconnect';link.href=href;document.head.appendChild(link);
 }
 const script=document.createElement('link');script.rel='prefetch';script.as='script';script.href=CALENDAR_SCRIPT;document.head.appendChild(script);
}

/** Worldwide calendar, entirely usable in-desk. Keep this component mounted
 * when switching feed/calendar layouts; compact only changes its height. */
export function GlobalCalendar({light,compact=false}:{light:boolean;compact?:boolean}){
 const host=useRef<HTMLDivElement>(null);
 const [state,setState]=useState<'loading'|'ready'|'slow'>('loading'),[retry,setRetry]=useState(0);
 const config=useMemo(()=>JSON.stringify({colorTheme:light?'light':'dark',isTransparent:true,width:'100%',height:'100%',locale:'en',importanceFilter:'-1,0,1'}),[light]);
 useEffect(()=>{
  warmGlobalCalendar();const root=host.current;if(!root)return;let active=true;setState('loading');root.replaceChildren();
  const wrapper=document.createElement('div');wrapper.className='tradingview-widget-container';wrapper.style.cssText='width:100%;height:100%';
  const slot=document.createElement('div');slot.className='tradingview-widget-container__widget';slot.style.cssText='width:100%;height:100%';wrapper.appendChild(slot);
  const attached=new Set<HTMLIFrameElement>();
  let timeout:ReturnType<typeof setTimeout>;
  const ready=()=>{if(active){clearTimeout(timeout);setState('ready')}};
  const observe=()=>{wrapper.querySelectorAll('iframe').forEach(frame=>{if(attached.has(frame))return;attached.add(frame);frame.title='Worldwide economic calendar';frame.setAttribute('loading','eager');frame.addEventListener('load',ready)})};
  const observer=new MutationObserver(observe);observer.observe(wrapper,{childList:true,subtree:true});
  const script=document.createElement('script');script.src=CALENDAR_SCRIPT;script.async=true;script.type='text/javascript';script.textContent=config;script.onerror=()=>{if(active)setState('slow')};
  root.appendChild(wrapper);wrapper.appendChild(script);observe();timeout=setTimeout(()=>{if(active)setState(current=>current==='ready'?current:'slow')},12000);
  return()=>{active=false;clearTimeout(timeout);observer.disconnect();attached.forEach(frame=>frame.removeEventListener('load',ready));script.onerror=null;root.replaceChildren()};
 },[config,retry]);
 return <section className={'tv-embed global-calendar '+(compact?'tv-compact':'')} aria-label="Worldwide economic calendar" style={{minWidth:0,position:'relative'}}>
  <div className="global-calendar-status" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,minHeight:25,padding:'2px 10px 7px',fontSize:8,color:'var(--faint,#757b87)'}}>
   <span>{state==='loading'?'Connecting worldwide events…':state==='slow'?'Calendar reconnecting. Retry here.':'Worldwide · all countries and impact levels'}</span>
   <button aria-label="Refresh economic calendar" onClick={()=>setRetry(n=>n+1)} style={{padding:2,color:'var(--muted,#8d939e)',display:'inline-flex',alignItems:'center',gap:4,fontSize:8}}><RefreshCw size={10}/>{!compact&&'Refresh'}</button>
  </div>
  <div className="tv-widget-host" ref={host} style={{width:'100%',height:compact?570:760,minWidth:0,overflow:'hidden',background:light?'#ffffff':'#101113'}}/>
  <div className="tv-attribution" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,minHeight:25,padding:'4px 10px',fontSize:8,color:'var(--faint,#757b87)'}}>
   <a href={PROVIDER} target="_blank" rel="noreferrer">Economic Calendar by TradingView</a>
   {!compact&&<span>Country and importance filters are inside the calendar.</span>}
  </div>
 </section>
}
