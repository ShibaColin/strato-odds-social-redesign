'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
export type ChartPoint={at:number;value:number};
/** Keep actual points and local extrema while bounding SVG/path work. */
function drawingPoints(rows:ChartPoint[],maximum=1000){
 if(rows.length<=maximum)return rows;
 const result=[rows[0]],size=Math.ceil((rows.length-2)/((maximum-2)/2));
 for(let start=1;start<rows.length-1;start+=size){const bucket=rows.slice(start,Math.min(rows.length-1,start+size));let low=bucket[0],high=bucket[0];for(const p of bucket){if(p.value<low.value)low=p;if(p.value>high.value)high=p}if(low.at===high.at)result.push(low);else result.push(...[low,high].sort((a,b)=>a.at-b.at))}
 result.push(rows.at(-1)!);return result;
}
export function DataChart({points,unit='USD',color='blue',height=280,empty='Collecting history'}:{points:ChartPoint[];unit?:string;color?:string;height?:number;empty?:string}){
 const [hover,setHover]=useState<number|null>(null),[width,setWidth]=useState(900);
 const container=useRef<HTMLDivElement>(null),queued=useRef<number|null>(null),pendingHover=useRef<number|null>(null);
 useEffect(()=>{const element=container.current;if(!element)return;const observe=new ResizeObserver(entries=>{const w=entries[0]?.contentRect.width;if(w)setWidth(Math.max(280,Math.min(1400,w)))});observe.observe(element);return()=>observe.disconnect()},[]);
 useEffect(()=>()=>{if(queued.current!==null)cancelAnimationFrame(queued.current)},[]);
 const rows=useMemo(()=>{const unique=new Map<number,ChartPoint>();for(const p of points)if(Number.isFinite(p.at)&&Number.isFinite(p.value))unique.set(p.at,p);return [...unique.values()].sort((a,b)=>a.at-b.at)},[points]);
 const plotted=useMemo(()=>drawingPoints(rows),[rows]);
 const pad=18,right=90,bottom=30,h=height;
 const formatAxis=useMemo(()=>new Intl.NumberFormat('en-US',{...(unit==='USD'?{style:'currency' as const,currency:'USD'}:{}),notation:'compact',maximumFractionDigits:2}),[unit]);
 const formatValue=useMemo(()=>new Intl.NumberFormat('en-US',{...(unit==='USD'?{style:'currency' as const,currency:'USD'}:{}),maximumFractionDigits:unit==='blocks'?0:2}),[unit]);
 const axis=(v:number)=>formatAxis.format(v)+(unit==='oz'?' oz':'');
 const value=(v:number)=>formatValue.format(v)+(unit==='oz'?' oz':'');
 const geometry=useMemo(()=>{
  if(rows.length<2)return null;
  let lo=Infinity,hi=-Infinity;for(const p of rows){lo=Math.min(lo,p.value);hi=Math.max(hi,p.value)}
  const padding=Math.max((hi-lo)*.1,Math.abs(hi)*.00001,1e-7),min=lo-padding,max=hi+padding,start=rows[0].at,end=rows.at(-1)!.at;
  const x=(at:number)=>pad+(at-start)/(end-start||1)*(width-right-pad),y=(v:number)=>pad+(max-v)/(max-min)*(h-bottom-pad);
  const line=plotted.map((p,i)=>(i?'L':'M')+x(p.at).toFixed(2)+','+y(p.value).toFixed(2)).join(' ');
  return {min,max,start,end,x,y,line};
 },[rows,plotted,width,h]);
 const inspect=(clientX:number,element:SVGSVGElement)=>{
  if(!geometry)return;const r=element.getBoundingClientRect(),at=geometry.start+Math.max(0,Math.min(1,((clientX-r.left)/r.width*width-pad)/(width-right-pad)))*(geometry.end-geometry.start);
  let low=0,high=rows.length-1;while(low<high){const middle=Math.floor((low+high)/2);if(rows[middle].at<at)low=middle+1;else high=middle}
  const index=low>0&&Math.abs(rows[low-1].at-at)<Math.abs(rows[low].at-at)?low-1:low;
  pendingHover.current=index;if(queued.current===null)queued.current=requestAnimationFrame(()=>{queued.current=null;setHover(pendingHover.current)});
 };
 if(!geometry)return <div ref={container} className="collecting-chart" style={{minHeight:height}}><span className="collecting-dot"/><p>{rows.length?empty:'Data temporarily unavailable'}</p>{rows[0]&&<small>First observation {new Date(rows[0].at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})} UTC</small>}</div>;
 const {min,max,start,end,x,y,line}=geometry,current=hover===null?rows.at(-1)!:rows[Math.min(rows.length-1,Math.max(0,hover))];
 return <div ref={container} className={'data-chart '+color}><div className="chart-tooltip"><span>{new Date(current.at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})} UTC</span><strong>{value(current.value)}</strong></div><svg viewBox={'0 0 '+width+' '+h} role="img" tabIndex={0} aria-label={unit+' history from source observations. Use left and right arrow keys or touch to inspect values.'} style={{touchAction:'pan-y'}} onPointerLeave={e=>{if(e.pointerType!=='touch'){if(queued.current!==null){cancelAnimationFrame(queued.current);queued.current=null}pendingHover.current=null;setHover(null)}}} onPointerDown={e=>inspect(e.clientX,e.currentTarget)} onPointerMove={e=>inspect(e.clientX,e.currentTarget)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key))return;e.preventDefault();setHover(e.key==='Escape'?null:e.key==='Home'?0:e.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,(hover??rows.length-1)+(e.key==='ArrowRight'?1:-1))))}}>{[0,.25,.5,.75,1].map(k=><g key={k}><line x1={pad} x2={width-right} y1={pad+k*(h-bottom-pad)} y2={pad+k*(h-bottom-pad)} className="chart-grid"/><text x={width-right+12} y={pad+k*(h-bottom-pad)+4} className="axis-label">{axis(max-k*(max-min))}</text></g>)}<path d={line+' L'+x(end)+','+(h-bottom)+' L'+x(start)+','+(h-bottom)+' Z'} fill="currentColor" opacity=".06"/><path d={line} stroke="currentColor" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke"/>{hover!==null&&<g><line x1={x(current.at)} x2={x(current.at)} y1={pad} y2={h-bottom} className="crosshair"/><circle cx={x(current.at)} cy={y(current.value)} r="3" fill="currentColor"/></g>}{[start,(start+end)/2,end].map((at,i)=><text key={i} x={x(at)} y={h-5} textAnchor={i===0?'start':i===2?'end':'middle'} className="axis-label">{end-start<2*86400000?new Date(at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):new Date(at).toLocaleDateString('en-GB',{month:'short',year:'numeric',...(end-start<7*86400000?{day:'numeric'}:{}),timeZone:'UTC'})}</text>)}</svg></div>
}
