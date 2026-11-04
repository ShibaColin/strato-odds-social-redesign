#!/usr/bin/env python3
"""Verify the frozen reference bytes, syntax and optional meaningful tests."""
import argparse, ast, hashlib, json, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def verify(run_tests=False):
    manifest=json.loads((ROOT/'REFERENCE_MANIFEST.json').read_text())
    ref=ROOT/'reference'
    expected={row['path']:row for row in manifest['files']}
    actual={p.relative_to(ref).as_posix():p for p in ref.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name!='.DS_Store'}
    assert actual.keys()==expected.keys(), f'Reference file set changed: missing={set(expected)-set(actual)}, added={set(actual)-set(expected)}'
    for name,p in actual.items():
        data=p.read_bytes();row=expected[name]
        assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'], 'Changed reference file: '+name
    ast.parse((ref/'server.py').read_text())
    for required in ['public/app.mjs','public/style.css','public/market-feed.mjs','public/asset-feed.mjs','public/audio/strato-win.wav','public/assets/odds.png']:
        assert required in actual, 'Missing required component: '+required
    if shutil.which('node'):
        for module in sorted((ref/'public').glob('*.mjs')):subprocess.run(['node','--check',str(module)],check=True)
    elif run_tests:raise RuntimeError('Node.js 18+ is required for --run-tests')
    if run_tests:
        tests=sorted((ref/'tests').glob('*.test.mjs'))
        subprocess.run(['node','--test',*[str(p) for p in tests]],cwd=ref,check=True)
    print(f'Exact reference verified: {len(actual)} files; SHA-256, Python and available JS syntax checks passed.')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--run-tests',action='store_true');args=parser.parse_args();verify(args.run_tests)
