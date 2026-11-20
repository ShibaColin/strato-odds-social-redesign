#!/usr/bin/env python3
"""Refresh the in-desk crypto table from a fixed public market-data endpoint."""
import json,os,sys,time,urllib.request,urllib.error
from pathlib import Path
ORIGIN=os.environ.get('NEWSDESK_ORIGIN','http://127.0.0.1:5173').rstrip('/')
URL='https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):raise urllib.error.HTTPError(req.full_url,code,'Redirect refused',headers,fp)
def main():
 opener=urllib.request.build_opener(NoRedirect())
 with opener.open(urllib.request.Request(URL,headers={'Accept':'application/json','User-Agent':'Mozilla/5.0 (compatible; STRATO-Newsdesk/1.0)'}),timeout=20) as r:raw=r.read(1200001)
 if len(raw)>1200000:raise ValueError('Oversized source')
 rows=json.loads(raw)
 if not isinstance(rows,list) or not 20<=len(rows)<=250:raise ValueError('Invalid source')
 credentials=Path(os.environ['CREDENTIALS_DIRECTORY']);token=(credentials/'sites-service-token').read_text().strip();key=(credentials/'metals-ingest-key').read_text().strip()
 request=urllib.request.Request(ORIGIN+'/api/jobs/crypto',data=json.dumps({'markets':rows,'observedAt':int(time.time()*1000)}).encode(),headers={'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+token,'X-Newsdesk-Metals-Key':key},method='POST')
 with opener.open(request,timeout=35) as r:result=json.load(r)
 if not result.get('saved'):raise ValueError('Snapshot rejected')
 print(json.dumps({'saved':True,'assets':result.get('count'),'at':result.get('asOf')}),flush=True)
if __name__=='__main__':
 try:main()
 except urllib.error.HTTPError as e:print(json.dumps({'error':'Crypto source or private update unavailable','status':e.code}),flush=True);sys.exit(1)
 except Exception:print(json.dumps({'error':'Crypto collector will retry; credentials not logged'}),flush=True);sys.exit(1)
