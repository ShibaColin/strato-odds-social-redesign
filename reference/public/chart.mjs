const number=(n,d=0)=>Number(n).toFixed(d);
export function geometry(points,width=900,height=340,fullScale=false,live=false){
 const clean=points.filter(p=>Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>=0&&p.p<=1).sort((a,b)=>a.t-b.t);
 const left=12,right=60,top=22,bottom=30;
 let low=0,high=1;
 if(clean.length&&!fullScale){const min=Math.min(...clean.map(p=>p.p)),max=Math.max(...clean.map(p=>p.p));const gap=Math.max(live?.0025:.035,(max-min)*.22),step=live?1000:20,minSpan=live?.01:.1;low=Math.max(0,Math.floor((min-gap)*step)/step);high=Math.min(1,Math.ceil((max+gap)*step)/step);if(high-low<minSpan){low=Math.max(0,high-minSpan);high=Math.min(1,low+minSpan);}}
 const first=clean[0]?.t||Date.now()/1000-3600,last=clean.at(-1)?.t||Date.now()/1000;
 const x=t=>left+Math.max(0,Math.min(1,(t-first)/(last-first||1)))*(width-left-right);
 const y=p=>top+(high-p)/(high-low)*(height-top-bottom);
 const coords=clean.map(p=>({...p,x:x(p.t),y:y(p.p)}));
 return {coords,low,high,x,y,width,height,left,right,top,bottom,path:coords.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')};
}
export function chartSVG(points,markers=[],options={}){
 const g=geometry(points,options.width||900,options.height||340,options.fullScale,options.live),{width:W,height:H,left,right,top,bottom}=g;
 const grid=Array.from({length:5},(_,i)=>g.low+(g.high-g.low)*i/4);
 const dates=g.coords.length?[0,.25,.5,.75,1].map(f=>g.coords[Math.round((g.coords.length-1)*f)]):[];
 const fmt=t=>new Date(t*1000).toLocaleString('en-US',options.long?{month:'short',day:'numeric'}:{hour:'2-digit',minute:'2-digit'});
 return `<svg viewBox="0 0 ${W} ${H}" class="probability-chart" role="img" aria-label="Probability chart"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3452ff" stop-opacity=".14"/><stop offset="1" stop-color="#3452ff" stop-opacity="0"/></linearGradient></defs>${grid.map(p=>`<line x1="${left}" x2="${W-right}" y1="${g.y(p)}" y2="${g.y(p)}" stroke="#e8edf4" stroke-dasharray="3 5"/><text x="${W-right+14}" y="${g.y(p)+4}" fill="#8a95a9" font-size="11">${number(p*100,g.high-g.low<.15?1:0)}%</text>`).join('')}${g.coords.length?`<path d="${g.path}L${g.coords.at(-1).x},${H-bottom}L${left},${H-bottom}Z" fill="url(#chart-fill)"/><path d="${g.path}" fill="none" stroke="#3452ff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle class="chart-live-halo" cx="${g.coords.at(-1).x}" cy="${g.coords.at(-1).y}" r="8" fill="#3452ff" opacity=".12"/><circle cx="${g.coords.at(-1).x}" cy="${g.coords.at(-1).y}" r="4" fill="#3452ff" stroke="white" stroke-width="2"/>`:''}${markers.filter(m=>m.time/1000>=(g.coords[0]?.t||0)).slice(0,8).map(m=>{const x=g.x(m.time/1000),y=g.y(m.yes);return `<g class="chart-entry" data-action="entry" data-id="${m.id}" tabindex="0" role="button" aria-label="${m.name} entry"><line x1="${x}" x2="${x}" y1="${y+16}" y2="${H-bottom}" stroke="${m.color}" stroke-opacity=".2" stroke-dasharray="3 5"/><circle cx="${x}" cy="${y}" r="15" fill="white" stroke="${m.color}" stroke-width="2"/><text x="${x}" y="${y+3.6}" text-anchor="middle" fill="${m.color}" font-size="9" font-weight="650">${m.initials}</text></g>`;}).join('')}${dates.map(p=>`<text x="${p.x}" y="${H-6}" text-anchor="${p===dates[0]?'start':p===dates.at(-1)?'end':'middle'}" font-size="10" fill="#8a95a9">${fmt(p.t)}</text>`).join('')}<line id="crosshair" x1="0" x2="0" y1="${top}" y2="${H-bottom}" stroke="#9ba9c2" stroke-dasharray="3 4" opacity="0"/><circle id="crossdot" r="4" fill="#3452ff" stroke="white" stroke-width="2" opacity="0"/></svg>`;
}
export function sparkSVG(points){
 const g=geometry(points,500,130,false);
 return `<svg viewBox="0 0 500 130" aria-hidden="true"><path d="${g.path}" fill="none" stroke="#3452ff" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
