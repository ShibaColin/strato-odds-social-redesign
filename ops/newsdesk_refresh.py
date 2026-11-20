#!/usr/bin/env python3
"""Minute updater for the private Newsdesk. No Telegram token lives here."""
import json
import os
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request

ORIGIN = os.environ.get('NEWSDESK_ORIGIN','http://127.0.0.1:5173').rstrip('/')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, 'Redirect refused', headers, fp)


def request(token, path, payload=None):
    if path not in ('/api/jobs/tick','/api/jobs/activate','/api/jobs/status','/api/jobs/ready'):
        raise RuntimeError('Unsupported newsdesk action')
    body = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(ORIGIN + path, data=body, headers={
        'OAI-Sites-Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'X-Newsdesk-Metals-Key': (Path(os.environ['CREDENTIALS_DIRECTORY']) / 'metals-ingest-key').read_text().strip(),
        'User-Agent': 'STRATO-Newsdesk-Server/1.0',
    }, method='GET' if payload is None else 'POST')
    with urllib.request.build_opener(NoRedirect()).open(req, timeout=165) as response:
        data = json.load(response)
    if data.get('error'):
        raise RuntimeError('Private newsdesk action rejected')
    return data


def main():
    credentials = Path(os.environ['CREDENTIALS_DIRECTORY']) / 'sites-service-token'
    token = credentials.read_text().strip()
    if not token:
        raise RuntimeError('Service credential unavailable')
    if '--status' in sys.argv:
        data = request(token, '/api/jobs/status')
        print(json.dumps({'schedule':data.get('schedule'),'last_tick':data.get('lastTick',{}).get('at'),'test':data.get('test',{}).get('state'),'confirmation':data.get('serverConfirmation')}))
        return
    if '--confirm' in sys.argv:
        print(json.dumps(request(token, '/api/jobs/ready', {})))
        return
    tick = request(token, '/api/jobs/tick', {})
    if tick.get('skipped'):
        print(json.dumps({'skipped':tick['skipped']}))
        return
    if not tick.get('at'):
        raise RuntimeError('No completed news update returned')
    request(token, '/api/jobs/activate', {'cadence':'Checks every minute'})
    result = {'at':tick['at'],'added':tick.get('added',0),'sent':tick.get('sent',0),'failed':tick.get('failed',0)}
    state = Path(os.environ.get('STATE_DIRECTORY','/var/lib/strato-newsdesk'))
    previous = {}
    try:
        previous = json.loads((state/'last_run.json').read_text())
    except (OSError,ValueError):
        pass
    result['successful_runs'] = previous.get('successful_runs',0)+1
    temporary = state/'last_run.tmp'
    temporary.write_text(json.dumps(result))
    temporary.replace(state/'last_run.json')
    print(json.dumps(result), flush=True)

if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as exc:
        print(json.dumps({'error':'Private Newsdesk HTTP request failed','status':exc.code}),flush=True)
        sys.exit(1)
    except Exception:
        # Credentials, request headers and tracebacks are never logged.
        print(json.dumps({'error':'Newsdesk update failed; next timer run will retry'}),flush=True)
        sys.exit(1)
