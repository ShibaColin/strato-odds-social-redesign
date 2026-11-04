// Pure normalization for the public CLOB stream. The quote is a probability, never an asset USD price.
export function applyMarketEvent(message,assetId,currentBook={bids:[],asks:[]}){
 const data=message.payload||message,type=message.event_type||message.type;
 const book=structuredClone(currentBook||{bids:[],asks:[]});let price=null,changed=false;
 const mid=(bid,ask)=>{bid=Number(bid);ask=Number(ask);if(bid>0&&ask<1&&ask>=bid)price=(bid+ask)/2;};
 if(type==='book'&&data.asset_id===assetId){book.bids=data.bids||[];book.asks=data.asks||[];changed=true;}
 if(type==='price_change')for(const c of data.price_changes||[]){if(c.asset_id!==assetId)continue;const rows=c.side==='BUY'?book.bids:c.side==='SELL'?book.asks:null;if(rows&&Number.isFinite(+c.price)&&Number.isFinite(+c.size)){const i=rows.findIndex(r=>+r.price===+c.price);if(i>=0)rows.splice(i,1);if(+c.size>0)rows.push({price:c.price,size:c.size});changed=true;}mid(c.best_bid,c.best_ask);}
 if(type==='best_bid_ask'&&data.asset_id===assetId)mid(data.best_bid,data.best_ask);
 if(type==='last_trade_price'&&data.asset_id===assetId&&+data.price>0&&+data.price<1)price=+data.price;
 if(type==='book'&&changed){const bids=book.bids.map(r=>+r.price).filter(n=>n>0),asks=book.asks.map(r=>+r.price).filter(n=>n<1);if(bids.length&&asks.length)mid(Math.max(...bids),Math.min(...asks));}
 return {book,price,changed};
}
export function liveWindow(points,now=Date.now()/1000,seconds=900){
 const cutoff=now-seconds,recent=points.filter(p=>p.t>=cutoff),prior=points.filter(p=>p.t<cutoff).at(-1);
 // Do not invent a point at the window boundary. Preserve the last actual observation for continuity.
 return recent.length?(prior?[prior,...recent]:recent):prior?[prior]:[];
}
export function mergeObservations(historic,live){const rows=new Map();for(const p of [...historic,...live])if(Number.isFinite(p.t)&&Number.isFinite(p.p)&&p.p>0&&p.p<1)rows.set(p.t,p);return [...rows.values()].sort((a,b)=>a.t-b.t).slice(-6000);}
