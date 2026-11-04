#!/usr/bin/env python3
"""Copy this isolated reference into a verified application checkout; no overwrite/push."""
import argparse, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('target',type=Path);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
    target=args.target.expanduser().resolve()
    if target==ROOT or ROOT in target.parents or target in ROOT.parents:parser.error('Target must be a separate production checkout, outside the handoff tree.')
    try:checkout=Path(subprocess.check_output(['git','-C',str(target),'rev-parse','--show-toplevel'],text=True).strip()).resolve()
    except (subprocess.CalledProcessError,FileNotFoundError):parser.error('Target is not a Git checkout.')
    if checkout!=target:parser.error('Pass the root of the target checkout.')
    changes=subprocess.check_output(['git','-C',str(target),'status','--porcelain'],text=True)
    if changes.strip():parser.error('Target worktree is not clean. Preserve/review its changes before importing.')
    branch=subprocess.check_output(['git','-C',str(target),'branch','--show-current'],text=True).strip()
    if not branch or branch.lower() in ['main','master','develop','development','production','release']:parser.error('Create a feature branch in the target checkout first.')
    destination=target/'design-handoff/strato-odds-next'
    if destination.exists():parser.error('Destination already exists; no files will be overwritten.')
    print('Feature branch:',branch);print('Copy destination:',destination)
    print('No application files, Git config, refs, credentials or remotes will be changed.')
    if not args.apply:print('Dry run only. Add --apply to copy the isolated folder.');return
    subprocess.run(['python3',str(ROOT/'scripts/verify_reference.py')],check=True)
    shutil.copytree(ROOT,destination,ignore=shutil.ignore_patterns('.git','__pycache__','.DS_Store','*.bundle','*.zip','.env','.env.*'))
    print('Copied. Review git status/diff and commit deliberately. Nothing was committed or pushed.')
if __name__=='__main__':main()
