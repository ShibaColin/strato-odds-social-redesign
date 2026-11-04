export const initialState=()=>({version:1,balance:10000,positions:[],orders:[],liquidity:[],trades:[],predictions:0,spinsUsed:0,xp:0,rewards:[],claims:[],watchlist:[],following:[],comments:{},alerts:[],sound:false,stream:true,referrals:[]});
const round=n=>Math.round(n*1e8)/1e8;
const valid=n=>Number.isFinite(n)&&n>0;
export function quote(amount,price){if(!valid(amount)||!valid(price)||price>=1)throw Error('Enter a valid amount and price.');return {shares:amount/price,cost:amount,payout:amount/price,profit:amount/price-amount};}
export function transact(state,action){
 const s=structuredClone(state);const a=action; const now=a.time??Date.now();const id=a.id??`${now}-${s.trades.length}`;
 if(['buy','limit','lp'].includes(a.type)&&(!valid(a.amount)||a.amount>s.balance))throw Error('Enter an amount within your available demo balance.');
 if(a.type==='buy'){
  const q=quote(a.amount,a.price);s.balance=round(s.balance-a.amount);let p=s.positions.find(p=>p.key===a.key);
  if(p){p.shares+=q.shares;p.cost+=a.amount;}else{s.positions.push({key:a.key,eventId:a.eventId,marketId:a.marketId,title:a.title,side:a.side,shares:q.shares,cost:a.amount});}
  s.predictions++;s.xp+=20;s.trades.unshift({id,type:'buy',time:now,...a,shares:q.shares});
 }else if(a.type==='sell'){
  const p=s.positions.find(p=>p.key===a.key);if(!p||!valid(a.shares)||a.shares>p.shares+1e-7||!valid(a.price)||a.price>=1)throw Error('You do not own enough shares.');
  const proportion=Math.min(1,a.shares/p.shares);const cost=p.cost*proportion;p.shares=round(Math.max(0,p.shares-a.shares));p.cost=round(p.cost-cost);s.balance=round(s.balance+a.shares*a.price);s.positions=s.positions.filter(p=>p.shares>1e-7);s.trades.unshift({id,...a,time:now,proceeds:a.shares*a.price,amount:a.shares*a.price,realized:a.shares*a.price-cost});
 }else if(a.type==='limit'){
  quote(a.amount,a.price);s.balance=round(s.balance-a.amount);s.orders.unshift({id,...a,time:now,status:'open'});
 }else if(a.type==='cancel'){
  const o=s.orders.find(o=>o.id===a.orderId);if(!o)throw Error('Order is no longer open.');s.balance=round(s.balance+o.amount);s.orders=s.orders.filter(x=>x.id!==a.orderId);
 }else if(a.type==='lp'){
  s.balance=round(s.balance-a.amount);let p=s.liquidity.find(p=>p.marketId===a.marketId);if(p)p.amount+=a.amount;else s.liquidity.push({id,eventId:a.eventId,marketId:a.marketId,title:a.title,amount:a.amount,time:now});s.trades.unshift({id,...a,time:now});s.xp+=15;
 }else if(a.type==='withdrawLP'){
  const p=s.liquidity.find(p=>p.marketId===a.marketId);if(!p)throw Error('No liquidity position found.');s.balance=round(s.balance+p.amount);s.liquidity=s.liquidity.filter(x=>x.marketId!==a.marketId);s.trades.unshift({id,type:'withdrawLP',amount:p.amount,title:p.title,time:now});
 }else if(a.type==='spin'){
  if(Math.floor(s.predictions/10)-s.spinsUsed<1)throw Error('Complete 10 predictions to earn a spin.');
  if(!Number.isInteger(a.segment)||a.segment<0||a.segment>5)throw Error('Invalid reward.');
  const prizes=[{label:'100 XP',xp:100},{label:'25 demo USDST',cash:25},{label:'250 XP',xp:250},{label:'50 demo USDST',cash:50},{label:'500 XP',xp:500},{label:'100 demo USDST',cash:100}];const prize=prizes[a.segment];s.spinsUsed++;s.balance=round(s.balance+(prize.cash||0));s.xp+=prize.xp||0;s.rewards.unshift({id,time:now,...prize});
 }else if(a.type==='settle'){
  if(!['Yes','No'].includes(a.winning))throw Error('Choose a valid winning outcome.');
  const ps=s.positions.filter(p=>p.marketId===a.marketId),os=s.orders.filter(o=>o.marketId===a.marketId);
  if(!ps.length&&!os.length)throw Error('No open paper positions to settle.');
  const payout=ps.reduce((n,p)=>n+(p.side===a.winning?p.shares:0),0);s.balance=round(s.balance+payout+os.reduce((n,o)=>n+o.amount,0));s.positions=s.positions.filter(p=>p.marketId!==a.marketId);s.orders=s.orders.filter(o=>o.marketId!==a.marketId);s.trades.unshift({id,type:'settlement',time:now,title:ps[0]?.title||os[0]?.title||a.marketId,marketId:a.marketId,eventId:ps[0]?.eventId||os[0]?.eventId,side:a.winning,amount:payout});
 }else if(a.type==='lpReward'){
  const deposit=s.liquidity.reduce((n,p)=>n+p.amount,0);if(deposit<=0||s.claims.includes('lp-fee-day'))throw Error('Open a liquidity position to try this one-time model.');
  const cash=Math.round(250*deposit/(50000+deposit)*100)/100;s.balance=round(s.balance+cash);s.claims.push('lp-fee-day');s.rewards.unshift({id,time:now,label:cash.toFixed(2)+' demo USDST · model LP fees',cash});
 }else if(a.type==='referral'){
  s.referrals??=[];if(s.referrals.length>=3)throw Error('All three demo referral slots have been tested.');
  const name=String(a.name||'').trim().slice(0,32);if(!name||s.referrals.some(r=>r.name.toLowerCase()===name.toLowerCase()))throw Error('Choose a new demo friend name.');
  s.referrals.push({name,time:now,status:'sample-qualified'});s.balance=round(s.balance+50);s.rewards.unshift({id,time:now,label:'50 demo USDST · sample referral',cash:50});
 }else if(a.type==='creatorReward'){
  if(!Object.values(s.comments).some(c=>c.length)||s.claims.includes('creator-thesis'))throw Error('Post a market thesis to unlock this mission.');s.claims.push('creator-thesis');s.xp+=150;
 }else if(a.type==='claim'){
  const requirements={first:s.predictions>=1,watch:s.watchlist.length>=3,follow:s.following.length>=2,lp:s.liquidity.length>=1,learn:s.claims.includes('read-rules')};
  if(!requirements[a.quest]||s.claims.includes(a.quest))throw Error('Complete this mission before claiming it.');s.claims.push(a.quest);s.xp+=100;
 }else throw Error('Unsupported action');
 return s;
}
export function cancelOrder(state,id){const s=structuredClone(state);const o=s.orders.find(o=>o.id===id);if(!o)throw Error('Order is no longer open.');s.balance=round(s.balance+o.amount);s.orders=s.orders.filter(o=>o.id!==id);return s;}
export function matchOrders(state,prices){let s=structuredClone(state);for(const o of [...s.orders]){const p=prices[o.key];if(valid(p)&&p<=o.price){s=cancelOrder(s,o.id);s=transact(s,{...o,type:'buy',price:p,id:`fill-${o.id}`});}}return s;}
export function portfolioValue(s,prices){return s.balance+s.orders.reduce((a,o)=>a+o.amount,0)+s.liquidity.reduce((a,p)=>a+p.amount,0)+s.positions.reduce((a,p)=>a+p.shares*(prices[p.key]??p.cost/p.shares),0);}
