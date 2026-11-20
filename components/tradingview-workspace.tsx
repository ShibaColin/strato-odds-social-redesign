'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {NativeCryptoScreener,prefetchCryptoScreener} from './crypto-screener';
import {GlobalCalendar} from './global-calendar';
import {ArrowUpRight,RefreshCw} from 'lucide-react';

type ToolId='chart'|'overview'|'marketdata'|'movers'|'stockscreener'|'cryptoscreener'|'forexscreener'|'stockheatmap'|'cryptoheatmap'|'etfheatmap'|'crossrates'|'forexheatmap'|'technical'|'financials'|'profile'|'symbolinfo'|'symboloverview'|'calendar'|'news';
type Tool={id:ToolId;label:string;group:string;script:string;symbol?:boolean;height?:number};
const TOOLS:Tool[]=[
 {id:'chart',label:'Advanced chart',group:'Charts',script:'advanced-chart',symbol:true},
 {id:'symboloverview',label:'Symbol overview',group:'Charts',script:'symbol-overview',symbol:true},
 {id:'overview',label:'Market overview',group:'Markets',script:'market-overview'},
 {id:'marketdata',label:'Market data',group:'Markets',script:'market-quotes'},
 {id:'movers',label:'Stock market movers',group:'Markets',script:'hotlists'},
 {id:'stockscreener',label:'Stock screener',group:'Screeners',script:'screener'},
 {id:'cryptoscreener',label:'Crypto screener',group:'Screeners',script:'crypto-mkt-screener'},
 {id:'forexscreener',label:'Forex screener',group:'Screeners',script:'screener'},
 {id:'stockheatmap',label:'Stock heatmap',group:'Heatmaps',script:'stock-heatmap'},
 {id:'cryptoheatmap',label:'Crypto heatmap',group:'Heatmaps',script:'crypto-coins-heatmap'},
 {id:'etfheatmap',label:'ETF heatmap',group:'Heatmaps',script:'etf-heatmap'},
 {id:'crossrates',label:'Forex cross rates',group:'Forex',script:'forex-cross-rates'},
 {id:'forexheatmap',label:'Forex heatmap',group:'Forex',script:'forex-heat-map'},
 {id:'technical',label:'Technical analysis',group:'Symbol research',script:'technical-analysis',symbol:true},
 {id:'financials',label:'Fundamentals',group:'Symbol research',script:'financials',symbol:true},
 {id:'profile',label:'Company profile',group:'Symbol research',script:'symbol-profile',symbol:true},
 {id:'symbolinfo',label:'Symbol information',group:'Symbol research',script:'symbol-info',symbol:true},
 {id:'calendar',label:'Economic calendar',group:'Events & news',script:'events'},
 {id:'news',label:'Market news',group:'Events & news',script:'timeline'},
];
const GROUPS=Array.from(new Set(TOOLS.map(t=>t.group)));
const MARKET_GROUPS=[
 {name:'Indices',originalName:'Indices',symbols:[{name:'FOREXCOM:SPXUSD',displayName:'S&P 500'},{name:'FOREXCOM:NSXUSD',displayName:'Nasdaq 100'},{name:'FOREXCOM:DJI',displayName:'Dow Jones'},{name:'INDEX:DEU40',displayName:'DAX'},{name:'INDEX:NKY',displayName:'Nikkei 225'}]},
 {name:'Crypto',originalName:'Crypto',symbols:[{name:'COINBASE:BTCUSD',displayName:'Bitcoin'},{name:'COINBASE:ETHUSD',displayName:'Ethereum'},{name:'COINBASE:SOLUSD',displayName:'Solana'},{name:'COINBASE:XRPUSD',displayName:'XRP'}]},
 {name:'Commodities',originalName:'Commodities',symbols:[{name:'OANDA:XAUUSD',displayName:'Gold'},{name:'OANDA:XAGUSD',displayName:'Silver'},{name:'TVC:USOIL',displayName:'WTI oil'},{name:'TVC:UKOIL',displayName:'Brent oil'}]},
 {name:'Forex',originalName:'Forex',symbols:[{name:'FX:EURUSD',displayName:'EUR / USD'},{name:'FX:GBPUSD',displayName:'GBP / USD'},{name:'FX:USDJPY',displayName:'USD / JPY'}]},
];
const moduleLoads=new Map<string,Promise<void>>();
function loadWidgetModule(tag:string){
 if(customElements.get(tag))return Promise.resolve();
 const previous=moduleLoads.get(tag);if(previous)return previous;
 const work=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.type='module';script.src='https://widgets.tradingview-widget.com/w/en/'+tag+'.js';
  script.onload=()=>{customElements.whenDefined(tag).then(()=>resolve())};
  script.onerror=()=>{moduleLoads.delete(tag);script.remove();reject(Error('TradingView module unavailable'))};document.head.appendChild(script);
 });moduleLoads.set(tag,work);return work;
}
const ATTRIBUTION_URL='https://www.tradingview.com/';
const CURRENCIES=['USD','EUR','GBP','JPY','CHF','AUD','CAD','NZD','CNY'];
function widgetConfig(tool:Tool,light:boolean,symbol:string){
 const theme=light?'light':'dark';
 const common={width:'100%',height:'100%',locale:'en',colorTheme:theme,isTransparent:true};
 switch(tool.id){
  case 'chart':return {...common,autosize:true,symbol,interval:'15',timezone:'Etc/UTC',theme,style:'1',allow_symbol_change:true,hide_top_toolbar:false,hide_side_toolbar:false,withdateranges:true,save_image:true,calendar:false,details:false,hotlist:false,support_host:'https://www.tradingview.com',backgroundColor:light?'#ffffff':'#111111',gridColor:light?'#f0f0f0':'#1c1c1c'};
  case 'symboloverview':return {...common,symbols:[[symbol+'|1D']],chartOnly:false,showVolume:true,showMA:false,hideDateRanges:false,hideMarketStatus:false,hideSymbolLogo:false,scalePosition:'right',scaleMode:'Normal',fontFamily:'Inter, sans-serif',valuesTracking:'1',changeMode:'price-and-percent',chartType:'area',dateRanges:['1d|1','1m|30','3m|60','12m|1D','60m|1W','all|1M']};
  case 'overview':return {...common,showChart:true,dateRange:'1D',showSymbolLogo:true,showFloatingTooltip:true,tabs:MARKET_GROUPS.map(g=>({title:g.name,symbols:g.symbols}))};
  case 'marketdata':return {...common,showSymbolLogo:true,symbolsGroups:MARKET_GROUPS};
  case 'movers':return {...common,exchange:'US',showSymbolLogo:true,showChart:true,dateRange:'1D',showFloatingTooltip:true};
  case 'stockscreener':return {...common,market:'america',defaultColumn:'overview',defaultScreen:'most_capitalized',showToolbar:true};
  case 'cryptoscreener':return {...common,defaultColumn:'overview',market:'crypto',screener_type:'crypto_mkt',displayCurrency:'USD'};
  case 'forexscreener':return {...common,market:'forex',defaultColumn:'overview',defaultScreen:'general',showToolbar:true};
  case 'stockheatmap':return {...common,autosize:true,dataSource:'SPX500',exchanges:[],grouping:'sector',blockSize:'market_cap_basic',blockColor:'change',hasTopBar:true,isDataSetEnabled:true,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false};
  case 'cryptoheatmap':return {...common,autosize:true,dataSource:'Crypto',blockSize:'market_cap_calc',blockColor:'24h_close_change|5',hasTopBar:true,isDataSetEnabled:true,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false};
  case 'etfheatmap':return {...common,autosize:true,dataSource:'AllUSEtf',grouping:'asset_class',blockSize:'volume',blockColor:'change',hasTopBar:true,isDataSetEnabled:true,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false};
  case 'crossrates':case 'forexheatmap':return {...common,currencies:CURRENCIES};
  case 'technical':return {...common,symbol,interval:'15m',showIntervalTabs:true,displayMode:'multiple'};
  case 'financials':case 'profile':case 'symbolinfo':return {...common,symbol};
  // No country or currency restriction: the provider supplies its worldwide calendar.
  case 'calendar':return {...common,importanceFilter:'-1,0,1',hideImportanceIndicator:false};
  case 'news':return {...common,feedMode:'all_symbols',displayMode:'regular'};
 }
}

/** Official iframe widgets remain isolated and keep their own licensed data/branding. */
function TradingViewEmbed({tool,light,symbol='COINBASE:BTCUSD',compact=false}:{tool:Tool;light:boolean;symbol?:string;compact?:boolean}){
 const host=useRef<HTMLDivElement>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading'),[retry,setRetry]=useState(0);
 const config=useMemo(()=>JSON.stringify(widgetConfig(tool,light,symbol)),[tool,light,symbol]);
 useEffect(()=>{
  const root=host.current;if(!root)return;
  let active=true;setStatus('loading');root.replaceChildren();
  // Current global calendar and crypto screeners are official Web Components.
  if(tool.id==='calendar'||tool.id==='cryptoscreener'){
   const tag=tool.id==='calendar'?'tv-economic-calendar':'tv-screener';
   const element=document.createElement(tag);element.setAttribute('theme',light?'light':'dark');element.style.cssText='display:block;width:100%;height:100%';
   if(tool.id==='cryptoscreener'){element.setAttribute('screener-type','crypto-coins');element.setAttribute('columns','overview');element.setAttribute('display-currency','USD')}
   // TradingView emits these public widget lifecycle events after data readiness.
   // Registering the custom element alone does not mean its data connected.
   const onReady=()=>{if(active){clearTimeout(timeout);setStatus('ready')}};
   const onError=()=>{if(active){clearTimeout(timeout);setStatus('failed')}};
   element.addEventListener('tv-widget-ready',onReady);element.addEventListener('tv-widget-error',onError);
   const timeout=setTimeout(onError,30000);
   root.appendChild(element);
   loadWidgetModule(tag).catch(onError);
   return()=>{active=false;clearTimeout(timeout);element.removeEventListener('tv-widget-ready',onReady);element.removeEventListener('tv-widget-error',onError);root.replaceChildren()};
  }
  const wrapper=document.createElement('div');wrapper.className='tradingview-widget-container';wrapper.style.cssText='height:100%;width:100%';
  const slot=document.createElement('div');slot.className='tradingview-widget-container__widget';slot.style.cssText='height:100%;width:100%';wrapper.appendChild(slot);
  const script=document.createElement('script');script.src='https://s3.tradingview.com/external-embedding/embed-widget-'+tool.script+'.js';script.type='text/javascript';script.async=true;script.textContent=config;
  script.onerror=()=>{if(active)setStatus('failed')};
  const attached=new Set<HTMLIFrameElement>();
  const ready=()=>{if(active)setStatus('ready')};
  const observe=()=>{wrapper.querySelectorAll('iframe').forEach(frame=>{if(attached.has(frame))return;attached.add(frame);frame.title='TradingView · '+tool.label;frame.setAttribute('allowfullscreen','true');frame.addEventListener('load',ready)})};
  const observer=new MutationObserver(observe);observer.observe(wrapper,{childList:true,subtree:true});
  root.appendChild(wrapper);wrapper.appendChild(script);observe();
  const timeout=setTimeout(()=>{if(active)setStatus(current=>current==='ready'?current:'failed')},22000);
  return()=>{active=false;clearTimeout(timeout);observer.disconnect();attached.forEach(frame=>frame.removeEventListener('load',ready));script.onerror=null;root.replaceChildren()};
 },[tool,config,retry]);
 const height=compact?570:tool.height||680;
 const providerURL=tool.id==='calendar'?'https://www.tradingview.com/economic-calendar/':tool.id==='cryptoscreener'?'https://www.tradingview.com/markets/cryptocurrencies/prices-all/':tool.symbol?'https://www.tradingview.com/chart/?symbol='+encodeURIComponent(symbol):ATTRIBUTION_URL;
 return <div className={'tv-embed '+(compact?'tv-compact':'')} style={{position:'relative',minWidth:0}}>
  <div ref={host} className="tv-widget-host" style={{width:'100%',height,overflow:'hidden',borderRadius:6}} aria-label={'TradingView '+tool.label}/>
  {status!=='ready'&&<div className="tv-widget-state" role="status" style={{position:'absolute',inset:'0 0 29px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:12,background:light?'#ffffff':'#111111',color:light?'#687080':'#9398a3',padding:24,textAlign:'center',fontSize:12,pointerEvents:status==='failed'?'auto':'none'}}>
   <span>{status==='loading'?'Loading '+tool.label.toLowerCase()+'…':'TradingView is taking longer to connect.'}</span>
   {status==='failed'&&<div style={{display:'flex',gap:18,alignItems:'center'}}><button onClick={()=>setRetry(n=>n+1)} style={{display:'flex',alignItems:'center',gap:6,color:'inherit'}}><RefreshCw size={13}/>Retry</button><a href={providerURL} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:5}}>Open TradingView<ArrowUpRight size={13}/></a></div>}
  </div>}
  <div className="tv-attribution" style={{minHeight:29,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,fontSize:9,color:light?'#747b88':'#747b88'}}><a href={providerURL} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4}}>TradingView<ArrowUpRight size={10}/></a><button aria-label="Reload TradingView tool" onClick={()=>setRetry(n=>n+1)} style={{display:'inline-flex',alignItems:'center',gap:4,color:'inherit',fontSize:9,padding:0,marginLeft:'auto'}}><RefreshCw size={10}/>Reload</button>{!compact&&<span>Exchange delays vary.</span>}</div>
 </div>
}

export function TradingViewCalendar({light,compact=false}:{light:boolean;compact?:boolean}){
 return <GlobalCalendar light={light} compact={compact}/>;
}

export function TradingViewWorkspace({light,onCalendar}:{light:boolean;onCalendar?:()=>void}){
 const [toolId,setToolId]=useState<ToolId>('chart'),[symbol,setSymbol]=useState('COINBASE:BTCUSD'),[draft,setDraft]=useState('COINBASE:BTCUSD');
 const tool=TOOLS.find(t=>t.id===toolId)!;
 useEffect(()=>{prefetchCryptoScreener()},[]);
 function choose(id:ToolId){if(id==='calendar'&&onCalendar){onCalendar();return}setToolId(id);if(['financials','profile','symbolinfo'].includes(id)&&!symbol.startsWith('NASDAQ:')&&!symbol.startsWith('NYSE:')){setSymbol('NASDAQ:NVDA');setDraft('NASDAQ:NVDA')}}
 return <section className="tradingview-workspace" aria-label="TradingView market tools">
  <div className="tv-toolbar" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,padding:'0 0 17px'}}>
   <label style={{display:'flex',alignItems:'center',gap:10,fontSize:11,color:'var(--muted,#858a94)'}}>View<select aria-label="TradingView tool" value={toolId} onChange={e=>choose(e.target.value as ToolId)} style={{padding:'8px 28px 8px 10px',border:'1px solid var(--line,#282828)',borderRadius:5,background:'var(--panel,#151515)',color:'var(--ink,#e8e8e8)',fontSize:12,minWidth:185}}>{GROUPS.map(group=><optgroup key={group} label={group}>{TOOLS.filter(t=>t.group===group).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>)}</select></label>
   {tool.symbol&&<form onSubmit={e=>{e.preventDefault();const next=draft.trim().toUpperCase();if(/^[A-Z0-9_:.!/-]{2,50}$/.test(next))setSymbol(next)}} style={{display:'flex',gap:7,alignItems:'center'}}><input aria-label="TradingView symbol" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="EXCHANGE:SYMBOL" maxLength={50} style={{width:165,minWidth:0,padding:'8px 10px',border:'1px solid var(--line,#282828)',borderRadius:5,background:'var(--panel,#151515)',color:'var(--ink,#e8e8e8)',fontSize:11}}/><button type="submit" style={{padding:'8px 10px',fontSize:11,color:'var(--blue,#8e9fff)'}}>Go</button></form>}
  </div>
  <div className={toolId==='chart'?'tv-chart-kept':'tv-chart-kept tv-offscreen'} aria-hidden={toolId!=='chart'}><TradingViewEmbed tool={TOOLS[0]} light={light} symbol={symbol}/></div>
  {toolId==='cryptoscreener'?<NativeCryptoScreener onSelectSymbol={next=>{setSymbol(next);setDraft(next);setToolId('chart')}}/>:toolId==='calendar'?<GlobalCalendar light={light}/>:toolId!=='chart'?<TradingViewEmbed tool={tool} light={light} symbol={symbol}/>:null}
 </section>
}
