import {people as original} from './concepts.mjs';
export const people = [...original,
{id:'leo',name:'Leo Chen',handle:'@leoonchain',initials:'LC',color:'#375670',niche:'Crypto & market structure',bio:'Liquidity, positioning and what the order book is actually saying.'},
{id:'sophie',name:'Sophie Laurent',handle:'@sophiel',initials:'SO',color:'#ab6552',niche:'Politics',bio:'Election maps, turnout and the risks hiding behind a headline.'},
{id:'metals',name:'Metals Desk',handle:'@metalsdesk',initials:'Au',color:'#8d794a',niche:'HardFi & commodities',bio:'Gold, silver and the changing shape of onchain collateral.'},
{id:'james',name:'James Park',handle:'@jamesp',initials:'JP',color:'#456856',niche:'Sports',bio:'Team form, lineups and patient entries.'},
{id:'elena',name:'Elena Rossi',handle:'@elenar',initials:'ER',color:'#925b7d',niche:'Economy',bio:'Rates, inflation and the moments that change the consensus.'},
{id:'orbit',name:'Orbit Research',handle:'@orbitresearch',initials:'OR',color:'#001b71',niche:'HardFi & technology',bio:'Following the infrastructure behind the next wave of markets.'},
{id:'sam',name:'Sam Rivera',handle:'@samr',initials:'SR',color:'#537ca0',niche:'Culture',bio:'The stories people care about, with a price attached.'},
{id:'nina',name:'Nina Patel',handle:'@ninap',initials:'NP',color:'#876e97',niche:'Tech & AI',bio:'Separating a product launch from a product promise.'},
{id:'alex',name:'Alex Morgan',handle:'@alexmacro',initials:'AM',color:'#66734b',niche:'Geopolitics',bio:'A scenario is only useful when you know what would invalidate it.'},
{id:'ryan',name:'Ryan Wells',handle:'@ryanw',initials:'RW',color:'#a47855',niche:'Crypto',bio:'Less certainty. Better prices.'},
{id:'clare',name:'Clare Yu',handle:'@clarey',initials:'CY',color:'#477e7c',niche:'Weather & science',bio:'Forecast models, ranges and measured conviction.'},
{id:'max',name:'Max de Vries',handle:'@maxdv',initials:'MV',color:'#596b9e',niche:'Sports & esports',bio:'A good entry matters as much as picking the favorite.'}
].map((p,i)=>({...p,brier:p.brier??(.14+(i%7)*.013),sample:p.sample??(47+i*13),followers:p.followers??(480+i*173),index:i}));
export const person = id=>id==='you'?{id:'you',name:'You',handle:'@you',initials:'YO',color:'#001b71',bio:'Your perspective on the markets.',niche:'Your markets'}:people.find(p=>p.id===id)||people[0];
export function seedCommunity(events,now=Date.now()){
 const usable=events.filter(e=>e.markets.length&&e.source!=='STRATO concept');
 const posts=people.slice(0,12).map((p,i)=>{
  const e=usable.find(e=>p.niche.toLowerCase().includes(e.category.toLowerCase().split(' ')[0]))||usable[(i*7)%usable.length];
  const m=[...e.markets].sort((a,b)=>b.yes-a.yes).find(m=>m.yes>.1&&m.yes<.9)||e.markets[0];
  const probability=Math.round(m.yes*100);
  const views={
   Politics:[`At ${probability}%, the price leaves a very specific margin for error. For “${m.question||e.title}”, I’d compare the remaining vote or announcement calendar with the precise settlement deadline.`, 'My next update will focus on confirmed results and the remaining path for the other side.'],
   Crypto:[`Watching “${m.question||e.title}” at ${probability}%. I would separate spot price momentum from the actual closing or resolution condition before sizing this.`, 'A wick through a level is different from an official closing print. That distinction can decide the trade.'],
   Sports:[`My watchlist: “${m.question||e.title}” at ${probability}%. I’m waiting for the next confirmed lineup or match update before changing size.`, 'The favorite can be the right pick and still be a poor entry if the book is too thin.'],
   Economy:[`The market has “${m.question||e.title}” at ${probability}%. I’m building a base case and a surprise scenario around the next official release.`, 'I would reassess after the primary-source update rather than react to the first headline.'],
   HardFi:[`Looking at “${m.question||e.title}” at ${probability}%. My checklist is the reference asset, the measurement window and the exact issuer or data source.`, 'Tokenized exposure and the underlying market can diverge. The resolution rules need to say which one counts.'],
   'Tech & AI':[`“${m.question||e.title}” is priced at ${probability}%. The key question for me is what qualifies as a release or milestone under these rules.`, 'An announcement, a limited preview and a generally available product are three different catalysts.']
  };
  const pair=views[e.category]||[`Tracking “${m.question||e.title}” at ${probability}%. My entry depends on the next verifiable update and the time left before resolution.`, 'I’m keeping the position small until the primary source confirms the catalyst.'];
  const text=pair.join('\n\n');
  return {id:'seed-post-'+i,kind:i===8?'idea':'thesis',person:p.id,text,eventId:e.id,marketId:m.id,side:i%3===0?'No':'Yes',conviction:Math.round((i%3===0?1-m.yes:m.yes)*100),time:now-(i+1)*740000,likes:17+i*13,reposts:i%5,replies:[]};
 });
 return posts;
}
export const ideas=[
{id:'idea-energy',person:'metals',title:'Will tokenized energy assets reach $5B in 2027?',text:'A dedicated HardFi market with a fixed issuer universe and a transparent data source. I’d like a monthly update on what qualifies.',category:'HardFi',votes:148,time:Date.now()-7200000},
{id:'idea-ai',person:'nina',title:'Which AI model will lead the independent coding benchmarks in Q1 2027?',text:'Could we resolve against a frozen benchmark suite, instead of a broad claim about the “best” model?',category:'Tech & AI',votes:96,time:Date.now()-10800000},
{id:'idea-gold',person:'nova',title:'Will onchain gold volume overtake tokenized Treasuries in 2027?',text:'A relative adoption question. Needs an agreed source, wrapper exclusions and a clear volume window.',category:'HardFi',votes:83,time:Date.now()-16000000}
];
export function initialComments(m,now=Date.now()){
 return [
 {id:'discussion-1-'+m.id,person:'atlas',side:'Yes',text:'The exact resolution wording is the edge here. I’m pricing the defined outcome, rather than the broader narrative around it.',time:now-420000,likes:24,replies:[]},
 {id:'discussion-2-'+m.id,person:'nova',side:'No',text:'I’m on the other side at this price. A likely outcome can still be too expensive. What would you need to see to revise your probability?',time:now-960000,likes:18,replies:[{id:'r1',person:'leo',text:'For me, confirmation from the primary source. Until then I’d keep the size modest.',time:now-660000}]},
 {id:'discussion-3-'+m.id,person:'sophie',side:'Yes',text:'Added a small position. I’ll review after the next update; I’m not treating this as a set-and-forget trade.',time:now-1560000,likes:12,replies:[]},
 {id:'discussion-4-'+m.id,person:'elena',side:'No',text:'Worth checking the spread before entering. The headline percentage and the price you can actually buy at can be different.',time:now-2400000,likes:31,replies:[]},
 {id:'discussion-5-'+m.id,person:'sam',side:null,text:'Following this one. Does anyone have a primary-source update that would materially change the thesis?',time:now-3600000,likes:9,replies:[]}
 ];
}
export function rankPeople(period='month',metric='profit'){
 const factor={day:.045,month:1,all:5.4}[period];
 return people.map((p,i)=>({...p,profit:Math.round((14700-i*1170+(i%3)*935)*factor),volume:Math.round((225000-i*9300+(i%4)*37000)*factor),winrate:Math.round(72-i*.85+(i%3)*2),positions:18+(i*7)%61})).sort((a,b)=>b[metric]-a[metric]);
}
export const campaignFor=(e)=>({daily:80+((String(e.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0)%9)*40),baseLiquidity:30000+((String(e.id).length%7)*5000),maxSpread:6,minAmount:10});
