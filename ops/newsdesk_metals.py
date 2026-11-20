#!/usr/bin/env python3
"""Read fixed public issuer data and deliver it to the private desk; no bot credentials."""
import json
import os
from pathlib import Path
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

ORIGIN=os.environ.get('NEWSDESK_ORIGIN','http://127.0.0.1:5173').rstrip('/')
IDS=('tether-gold','pax-gold','kinesis-gold','matrixdock-gold','gold-token-sa-dgld-tokenized-gold','comtech-gold','vnx-gold','goldzip-gold','pleasing-gold','streamex-gldy','kinesis-silver','ember-silver','token-teknoloji-a-s-ons-silver')
URL='https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+','.join(IDS)+'&sparkline=false'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        raise urllib.error.HTTPError(req.full_url,code,'Redirect refused',headers,fp)

BENCHMARK_IDS=('tether-gold','pax-gold','kinesis-gold','kinesis-silver')
def benchmark(opener):
    state=Path(os.environ.get('STATE_DIRECTORY','/var/lib/strato-newsdesk-metals'));state.mkdir(parents=True,exist_ok=True)
    file=state/'benchmark-refreshed.json'
    try:
        if time.time()-float(json.loads(file.read_text()).get('at',0))<86400:return None
    except (OSError,ValueError,TypeError):pass
    def read_history(coin):
        url='https://api.coingecko.com/api/v3/coins/'+coin+'/market_chart?vs_currency=usd&days=365&interval=daily'
        with opener.open(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)','Accept':'application/json'}),timeout=12) as r:body=r.read(200001)
        if len(body)>200000:raise ValueError('Oversized history')
        points=json.loads(body).get('market_caps')
        if not isinstance(points,list) or not 2<=len(points)<=370:raise ValueError('Invalid history')
        return {'id':coin,'market_caps':points}
    try:
        with ThreadPoolExecutor(max_workers=4) as pool:series=list(pool.map(read_history,BENCHMARK_IDS))
        return {'observedAt':int(time.time()*1000),'series':series}
    except Exception:return None

def main():
    opener=urllib.request.build_opener(NoRedirect())
    request=urllib.request.Request(URL,headers={'Accept':'application/json','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'})
    with opener.open(request,timeout=25) as response:
        raw=response.read(300001)
    if len(raw)>300000:raise ValueError('Issuer payload too large')
    rows=json.loads(raw)
    if not isinstance(rows,list) or not 3<=len(rows)<=30:raise ValueError('Issuer list unavailable')
    history=benchmark(opener)
    payload_data={'markets':rows,'observedAt':int(time.time()*1000)}
    if history:payload_data['benchmark']=history
    payload=json.dumps(payload_data).encode()
    token=(Path(os.environ['CREDENTIALS_DIRECTORY'])/'sites-service-token').read_text().strip()
    collector_key=(Path(os.environ['CREDENTIALS_DIRECTORY'])/'metals-ingest-key').read_text().strip()
    request=urllib.request.Request(ORIGIN+'/api/jobs/metals',data=payload,headers={'Content-Type':'application/json','X-Newsdesk-Metals-Key':collector_key,'OAI-Sites-Authorization':'Bearer '+token,'User-Agent':'STRATO-Newsdesk-Metals/1.0'},method='POST')
    with opener.open(request,timeout=45) as response:
        result=json.load(response)
    if not result.get('saved'):raise ValueError('Supply snapshot rejected')
    if history:(Path(os.environ.get('STATE_DIRECTORY','/var/lib/strato-newsdesk-metals'))/'benchmark-refreshed.json').write_text(json.dumps({'at':time.time()}))
    print(json.dumps({'saved':True,'issuers':len(rows),'at':result.get('asOf')}),flush=True)
if __name__=='__main__':
    try:main()
    except urllib.error.HTTPError as exc:
        print(json.dumps({'error':'Supply source or private update unavailable','status':exc.code}),flush=True);sys.exit(1)
    except Exception:
        print(json.dumps({'error':'Supply collector will retry; credentials not logged'}),flush=True);sys.exit(1)
