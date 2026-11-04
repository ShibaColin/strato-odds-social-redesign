#!/usr/bin/env python3
"""Local-only STRATO Odds prototype. Public read-only data; no trading credentials."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from datetime import datetime, timezone
import json, subprocess, time, threading, argparse, os, re
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
ROOT = Path(__file__).resolve().parent
CACHE = {}; LOCK = threading.Lock()
GAMMA='https://gamma-api.polymarket.com'
CATEGORIES=['Politics','Crypto','Sports','Economy','Tech & AI','Culture','Geopolitics','Weather','HardFi']
def fetch(url):
    r=subprocess.run(['curl','--proto','=https','-fsSL','--max-time','18','--retry','1',url],capture_output=True,timeout=42)
    if r.returncode: raise RuntimeError('Public data provider unavailable')
    return json.loads(r.stdout)
def arr(x):
    try: return json.loads(x) if isinstance(x,str) else (x or [])
    except (ValueError,TypeError): return []
def category(e):
    tags=' '.join(t.get('label','') for t in e.get('tags',[])).lower(); title=e.get('title','').lower(); s=tags+' '+title
    for words,c in [('gold silver precious metal hardfi','HardFi'),('crypto bitcoin ethereum solana','Crypto'),('tech ai artificial intelligence openai anthropic spacex','Tech & AI'),('sports soccer football nba nhl esports league of legends','Sports'),('culture music movies entertainment awards','Culture'),('weather temperature hurricane climate','Weather'),('economy economics fed inflation finance','Economy'),('geopolitics iran israel ukraine ceasefire','Geopolitics')]:
        if any(w in s for w in words.split() if w not in ['of','ai']): return c
    return 'Politics'
def normalize(e):
    ms=[]
    for m in e.get('markets',[]):
        outcomes=arr(m.get('outcomes')); prices=arr(m.get('outcomePrices')); tokens=arr(m.get('clobTokenIds'))
        if m.get('closed') or not m.get('active',True) or len(outcomes)!=2 or not prices: continue
        try: p=float(prices[0])
        except (ValueError,TypeError): continue
        if not 0 < p < 1: continue
        ms.append({'id':str(m['id']),'question':m.get('question',e['title']),'label':((m.get('groupItemTitle')+' · ' if m.get('groupItemTitle') else '')+outcomes[0]) if outcomes[0].lower() not in ['yes','up'] else (m.get('groupItemTitle') or outcomes[0]), 'yes':p,'outcomes':outcomes,'token':tokens[0] if tokens else '', 'condition':m.get('conditionId',''),'volume':float(m.get('volume') or 0),'liquidity':float(m.get('liquidity') or 0),'end':m.get('endDate') or e.get('endDate'),'rules':m.get('description') or e.get('description',''),'source':'Polymarket','url':'https://polymarket.com/event/'+e['slug'],'image':m.get('image') or e.get('image','')})
    if not ms: return None
    ms.sort(key=lambda m:m['volume'],reverse=True)
    return {'id':'poly-'+str(e['id']),'title':e['title'],'category':category(e),'image':e.get('image',''),'volume':float(e.get('volume') or 0),'volume24':float(e.get('volume24hr') or 0),'end':e.get('endDate'),'source':'Polymarket','url':'https://polymarket.com/event/'+e['slug'],'markets':ms[:12],'tags':[t['label'] for t in e.get('tags',[])][:8]}
def get_tag(slug):
    try:
        t=fetch(GAMMA+'/tags/slug/'+slug)
        return fetch(GAMMA+'/events?'+urlencode({'limit':20,'active':'true','closed':'false','order':'volume24hr','ascending':'false','tag_id':t['id']}))
    except Exception: return []
def kalshi_events():
    try:
        raw=fetch('https://api.elections.kalshi.com/trade-api/v2/events?limit=20&status=open&with_nested_markets=true')
        result=[]
        for e in raw.get('events',[]):
            cat={'Science and Technology':'Tech & AI','Climate and Weather':'Weather','Economics':'Economy','Financials':'Economy','Elections':'Politics','Politics':'Politics','Sports':'Sports'}.get(e.get('category'),'Culture')
            url='https://kalshi.com/markets/'+e.get('series_ticker','').lower()
            ms=[]
            for m in e.get('markets',[]):
                bid=float(m.get('yes_bid_dollars') or 0); ask=float(m.get('yes_ask_dollars') or 0)
                price=(bid+ask)/2 if 0<bid<=ask<1 else float(m.get('last_price_dollars') or 0)
                if not 0<price<1 or m.get('status')!='active': continue
                ms.append({'id':'k-'+m['ticker'],'question':m['title'],'label':m.get('yes_sub_title') or m.get('subtitle') or 'Yes','yes':price,'outcomes':['Yes','No'],'token':'','condition':'','volume':float(m.get('volume_fp') or 0),'liquidity':0,'end':m.get('close_time'),'rules':m.get('rules_primary','')+'\n\n'+m.get('rules_secondary',''),'source':'Kalshi','url':url,'image':''})
            if ms: result.append({'id':'kalshi-'+e['event_ticker'],'title':e['title'],'category':cat,'image':'','volume':sum(m['volume'] for m in ms),'volume24':sum(float(m.get('volume_24h_fp') or 0) for m in e.get('markets',[])),'end':ms[0]['end'],'source':'Kalshi','url':url,'markets':sorted(ms,key=lambda m:m['volume'],reverse=True)[:12],'tags':[cat,e.get('category','')]})
        return result
    except Exception: return []

def native_events():
    try:
        raw=fetch('https://stratoodds.com/api/v1/markets')
        opened=[m for m in raw if m.get('status')==1 and not m.get('tradingHalted')][:20]
        def convert(m):
            try:
                b=fetch('https://stratoodds.com/api/v1/markets/'+m['address']+'/book')
                p=float(b.get('mid') or (b.get('lastTrade') or {}).get('price') or 0)/1e18
                if not 0<p<1:return None
                symbol=m.get('assetSymbol','');cat='HardFi' if symbol in ['GOLDST','SILVST','OIL'] else 'Politics' if m.get('isEvent') else 'Crypto' if symbol in ['WBTC','ETH','DOGE','BOOE'] else 'Economy'
                end=datetime.fromtimestamp(int(m['expiry']),timezone.utc).isoformat();url='https://stratoodds.com/markets/'+m['address'];title=m['question'].split('?')[0]+'?'
                if not m.get('isEvent'):
                    names={'GOLDST':'Gold','SILVST':'Silver','OIL':'Brent crude oil','WBTC':'Bitcoin','ETH':'Ethereum','DOGE':'Dogecoin','BOOE':'Book of Ethereum','NVDA':'NVIDIA','SPY':'S&P 500'}
                    strike=format(float(m.get('strike') or 0)/1e18,',.8f').rstrip('0').rstrip('.')
                    stamp=datetime.fromtimestamp(int(m['expiry']),timezone.utc).strftime('%b %d, %H:%M UTC')
                    title=f"{names.get(symbol,symbol)} at or above ${strike} on {stamp}?"
                rules=m['question']+'\n\nResolution source: '+m.get('resolutionSource','')
                quote={'id':'s-'+m['address'],'native':m['address'],'question':title,'label':m.get('yesLabel') or 'Yes','yes':p,'outcomes':['Yes','No'],'token':'','condition':'','volume':None,'liquidity':None,'end':end,'rules':rules,'source':'STRATO Odds','url':url,'image':''}
                return {'id':'strato-'+m['address'],'title':title,'category':cat,'image':'','monogram':symbol[:3],'volume':None,'volume24':0,'end':end,'source':'STRATO Odds','url':url,'markets':[quote],'tags':[cat,symbol]}
            except Exception:return None
        with ThreadPoolExecutor(max_workers=5) as pool:return [e for e in pool.map(convert,opened) if e]
    except Exception:return []

def load_markets(force=False):
    with LOCK:
        if not force and CACHE.get('markets') and time.time()-CACHE['markets'][0]<45: return CACHE['markets'][1]
    events=fetch(GAMMA+'/events?limit=70&active=true&closed=false&order=volume24hr&ascending=false')
    with ThreadPoolExecutor(max_workers=7) as pool:
        for group in pool.map(get_tag,['crypto','sports','economy','tech','pop-culture','weather','geopolitics','gold','silver','5m','15m','hourly']): events.extend(group)
    unique={str(e['id']):e for e in events}; data=[n for e in unique.values() if (n:=normalize(e))]
    kalshi=kalshi_events(); data.extend(kalshi);native=native_events();data.extend(native)
    result={'events':data,'providers':{'Polymarket':'live','Kalshi':'live' if kalshi else 'unavailable','STRATO Odds':'live' if native else 'unavailable'},'fetchedAt':datetime.now(timezone.utc).isoformat(),'status':'live','provider':'Polymarket Gamma','refreshSeconds':60}
    with LOCK: CACHE['markets']=(time.time(),result)
    return result

def load_news():
    with LOCK: cached=CACHE.get('news')
    if cached and time.time()-cached[0]<300:return cached[1]
    feeds=[('CoinDesk','https://www.coindesk.com/arc/outboundfeeds/rss/','Crypto'),('BBC','https://feeds.bbci.co.uk/news/world/rss.xml','World'),('Federal Reserve','https://www.federalreserve.gov/feeds/press_all.xml','Economy'),('NASA','https://www.nasa.gov/rss/dyn/breaking_news.rss','Tech & AI')]
    def read(feed):
        name,url,category=feed
        try:
            r=subprocess.run(['curl','--proto','=https','-fsSL','--max-time','12',url],capture_output=True,timeout=15)
            root=ET.fromstring(r.stdout);rows=[]
            for item in root.findall('.//item')[:12]:
                title=item.findtext('title','').strip();link=item.findtext('link','').strip();desc=re.sub('<[^>]+>','',item.findtext('description','')).strip()
                stamp=item.findtext('pubDate','')
                try:timestamp=parsedate_to_datetime(stamp).timestamp()*1000
                except Exception:timestamp=time.time()*1000
                media=item.find('{http://search.yahoo.com/mrss/}content');thumb=item.find('{http://search.yahoo.com/mrss/}thumbnail')
                image=(media.attrib.get('url','') if media is not None else '') or (thumb.attrib.get('url','') if thumb is not None else '')
                if title and link.startswith('https://'):rows.append({'id':name.lower().replace(' ','-')+'-'+str(abs(sum(ord(c)*(i+1) for i,c in enumerate(link)))),'title':title,'url':link,'summary':desc[:230],'publisher':name,'category':category,'time':timestamp,'image':image})
            return rows
        except Exception:return []
    rows=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for group in pool.map(read,feeds):rows.extend(group)
    if not rows:
        saved=ROOT/'public/news-snapshot.json'
        if saved.exists():return json.loads(saved.read_text())
    rows.sort(key=lambda n:n['time'],reverse=True)
    result={'articles':rows,'fetchedAt':datetime.now(timezone.utc).isoformat()}
    with LOCK:CACHE['news']=(time.time(),result)
    return result

def kalshi_book(ticker):
    raw=fetch('https://api.elections.kalshi.com/trade-api/v2/markets/'+ticker+'/orderbook?depth=12')
    ob=raw.get('orderbook_fp') or raw.get('orderbook') or {}
    yes=ob.get('yes_dollars') or ob.get('yes') or [];no=ob.get('no_dollars') or ob.get('no') or []
    factor=1 if 'yes_dollars' in ob else 100
    return {'bids':[{'price':float(p)/factor,'size':float(n)} for p,n in yes],'asks':[{'price':1-float(p)/factor,'size':float(n)} for p,n in no]}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT/'public'),**kw)
    def log_message(self,fmt,*args): pass
    def end_headers(self):
        self.send_header("Cache-Control","no-store")
        super().end_headers()
    def send_json(self,data,status=200):
        b=json.dumps(data).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p=urlparse(self.path); q=parse_qs(p.query)
        if p.path=='/api/markets':
            try: self.send_json(load_markets())
            except Exception:
                snapshot=ROOT/'public/snapshot.json'
                if snapshot.exists():
                    d=json.loads(snapshot.read_text());d['status']='snapshot'; self.send_json(d)
                else: self.send_json({'error':'Market source temporarily unavailable','events':[]},503)
        elif p.path=='/api/event':
            event_id=q.get('id',[''])[0]
            if not re.fullmatch(r'poly-[0-9]{1,15}',event_id):return self.send_json({'error':'Unsupported market'},400)
            try:
                raw=fetch(GAMMA+'/events/'+event_id[5:]);event=normalize(raw)
                self.send_json({'event':event,'ended':bool(raw.get('closed')),'title':raw.get('title','')})
            except Exception:self.send_json({'error':'Market unavailable'},502)
        elif p.path in ['/api/history','/api/book','/api/trades']:
            token=q.get('token',[''])[0]; condition=q.get('condition',[''])[0]; interval=q.get('interval',['1d'])[0]
            if not token.isdigit() or len(token)>100: return self.send_json({'error':'Invalid token'},400)
            if interval not in ['1h','6h','1d','1w','1m','max']: interval='1d'
            if p.path=='/api/trades' and (not condition.startswith('0x') or len(condition)!=66): return self.send_json({'error':'Invalid condition'},400)
            key=(p.path,token,interval)
            try:
                with LOCK: entry=CACHE.get(key)
                if entry and time.time()-entry[0]<(3 if p.path=='/api/book' else 15): return self.send_json(entry[1])
                if p.path=='/api/history': url='https://clob.polymarket.com/prices-history?'+urlencode({'market':token,'interval':interval,'fidelity':1 if interval in ['1h','6h'] else 5 if interval=='1d' else 60})
                elif p.path=='/api/book': url='https://clob.polymarket.com/book?token_id='+token
                else: url='https://data-api.polymarket.com/v2/trades?'+urlencode({'condition':condition,'limit':20})
                d=fetch(url)
                if p.path=='/api/trades':
                    d=[{**t,'proxyWallet':t.get('proxy_wallet',''),'pseudonym':t.get('pseudonym','')} for t in d.get('data',[]) if t.get('condition_id')==condition]
                with LOCK: CACHE[key]=(time.time(),d)
                self.send_json(d)
            except Exception: self.send_json({'error':'Public data temporarily unavailable'},502)
        elif p.path in ['/api/asset-ticker','/api/asset-history']:
            product=q.get('product',[''])[0]
            if product not in ['BTC-USD','ETH-USD','SOL-USD','DOGE-USD','XRP-USD','ZEC-USD']:return self.send_json({'error':'Unsupported asset'},400)
            key=(p.path,product)
            try:
                with LOCK:entry=CACHE.get(key)
                if entry and time.time()-entry[0]<(2 if p.path=='/api/asset-ticker' else 30):return self.send_json(entry[1])
                if p.path=='/api/asset-history':
                    rows=fetch('https://api.exchange.coinbase.com/products/'+product+'/candles?'+urlencode({'granularity':60,'start':datetime.fromtimestamp(time.time()-3600,timezone.utc).isoformat(),'end':datetime.now(timezone.utc).isoformat()}))
                    d={'history':sorted([{'t':float(r[0]),'p':float(r[4])} for r in rows],key=lambda r:r['t'])}
                else:
                    raw=fetch('https://api.exchange.coinbase.com/products/'+product+'/ticker');d={'price':raw.get('price'),'time':raw.get('time')}
                with LOCK:CACHE[key]=(time.time(),d)
                self.send_json(d)
            except Exception:self.send_json({'error':'Asset feed temporarily unavailable'},502)
        elif p.path=='/api/news':
            self.send_json(load_news())
        elif p.path=='/api/social/config':
            self.send_json({'x':bool(os.environ.get('STRATO_X_USER_TOKEN')),'instagram':False})
        elif p.path=='/api/kalshi-book':
            ticker=q.get('market',[''])[0]
            if not re.fullmatch(r'[A-Za-z0-9.-]{1,100}',ticker):return self.send_json({'error':'Invalid market'},400)
            try:self.send_json(kalshi_book(ticker))
            except Exception:self.send_json({'error':'Order book unavailable'},502)
        elif p.path=='/api/kalshi-history':
            ticker=q.get('market',[''])[0];interval=q.get('interval',['1d'])[0]
            if not re.fullmatch(r'[A-Za-z0-9.-]{1,100}',ticker):return self.send_json({'error':'Invalid market'},400)
            span={'1h':3600,'6h':21600,'1d':86400,'1w':604800,'1m':2592000,'max':7776000}.get(interval,86400)
            end=int(time.time());series=ticker.split('-')[0];period=1 if span<=21600 else 60
            try:
                raw=fetch('https://api.elections.kalshi.com/trade-api/v2/series/'+series+'/markets/'+ticker+'/candlesticks?'+urlencode({'start_ts':end-span,'end_ts':end,'period_interval':period}))
                rows=[]
                for c in raw.get('candlesticks',[]):
                    close=(c.get('price') or {}).get('close_dollars')
                    if close is None:close=(c.get('yes_bid') or {}).get('close_dollars')
                    if close is not None:rows.append({'t':c.get('end_period_ts'),'p':float(close)})
                self.send_json({'history':rows})
            except Exception:self.send_json({'history':[]},200)
        elif p.path=='/api/native-book':
            address=q.get('market',[''])[0]
            if len(address)!=40 or any(c not in '0123456789abcdef' for c in address): return self.send_json({'error':'Invalid market'},400)
            try:
                b=fetch('https://stratoodds.com/api/v1/markets/'+address+'/book')
                self.send_json({k:[{'price':float(v['price'])/1e18,'size':float(v['size'])/1e18} for v in b.get(k,[])] for k in ['bids','asks']})
            except Exception:self.send_json({'error':'Native book unavailable'},502)
        elif p.path=='/api/health': self.send_json({'ok':True,'mode':'local-simulation'})
        else: super().do_GET()
    def do_POST(self):
        if urlparse(self.path).path!='/api/social/x':return self.send_json({'error':'Not found'},404)
        origin=self.headers.get('Origin','')
        if origin and origin not in ['http://127.0.0.1:'+str(self.server.server_port),'http://localhost:'+str(self.server.server_port)]:return self.send_json({'error':'Origin not allowed'},403)
        token=os.environ.get('STRATO_X_USER_TOKEN')
        if not token:return self.send_json({'status':'needs_connection'},409)
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<12000:return self.send_json({'error':'Invalid post'},400)
            data=json.loads(self.rfile.read(length));body=str(data.get('text','')).strip()
            if not body or len(body)>280:return self.send_json({'error':'X draft must contain 1–280 characters'},400)
            # Config travels through stdin, so the secret is never a process argument.
            config='url = "https://api.x.com/2/tweets"\nrequest = "POST"\nheader = "Authorization: Bearer '+token.replace('"','')+'"\nheader = "Content-Type: application/json"\ndata = '+json.dumps(json.dumps({'text':body}))+'\n'
            r=subprocess.run(['curl','--config','-','--fail-with-body','--silent','--show-error','--max-time','20'],input=config.encode(),capture_output=True,timeout=25)
            if r.returncode:return self.send_json({'error':'X could not publish this post. Check account permissions and retry.'},502)
            result=json.loads(r.stdout);post_id=(result.get('data') or {}).get('id')
            self.send_json({'status':'published','url':'https://x.com/i/status/'+post_id} if post_id else {'error':'Publication not confirmed'},200 if post_id else 502)
        except Exception:self.send_json({'error':'Publication could not be completed'},502)

def snapshot():
    d=load_markets(True);(ROOT/'public/snapshot.json').write_text(json.dumps(d,separators=(',',':'))); print('Saved',len(d['events']),'events',d['fetchedAt'])
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--snapshot',action='store_true');a.add_argument('--port',type=int,default=4173);args=a.parse_args()
    if args.snapshot: snapshot()
    else:
        snapshot_path=ROOT/'public/snapshot.json'
        if snapshot_path.exists():
            initial=json.loads(snapshot_path.read_text()); initial['status']='snapshot';CACHE['markets']=(time.time(),initial)
        def warm():
            try: load_markets(True)
            except Exception: pass
        threading.Thread(target=warm,daemon=True).start()
        print(f'STRATO Odds local demo: http://127.0.0.1:{args.port}',flush=True)
        try: ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
        except KeyboardInterrupt: print('Local demo stopped.',flush=True)
