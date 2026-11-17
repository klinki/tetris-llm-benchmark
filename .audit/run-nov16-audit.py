#!/usr/bin/env python3
"""Reproduce the Nov 16 source/build/own-test/engine/Chromium audit in temporary copies."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parents[1]
ARTIFACTS=ROOT/'output/playwright/nov16'
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
PROJECTS=['hy4-flash-free-high','hy4-flash-free-none','qwen4-max-high','qwen4-max-low','qwen4-max-xhigh']

def hashes(root):
    return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(root.rglob('*')) if p.is_file() and p.name!='STATISTICS.md'
            and not set(p.relative_to(root).parts)&{'node_modules','dist','.git'}}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline',action='store_true')
    args=parser.parse_args()
    ARTIFACTS.mkdir(parents=True,exist_ok=True)
    original={name:hashes(ROOT/name) for name in PROJECTS}
    executable=sorted((Path.home()/'Library/Caches/ms-playwright').glob('chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'))[-1]
    config=ARTIFACTS/'cli.config.json'
    config.write_text(json.dumps({'browser':{'browserName':'chromium','isolated':True,'launchOptions':{'headless':True,'executablePath':str(executable)}}}))
    def run(cmd,label,**kwargs):
        p=subprocess.run(cmd,text=True,capture_output=True,timeout=240,**kwargs)
        (ARTIFACTS/(label+'.log')).write_text(p.stdout+p.stderr)
        if p.returncode:raise RuntimeError(p.stdout+p.stderr)
        print(label+': passed',flush=True)
        return p.stdout
    with tempfile.TemporaryDirectory(prefix='tetris-nov16-audit-') as temp:
        temporary=Path(temp)
        for name in PROJECTS:
            copy=temporary/name
            shutil.copytree(ROOT/name,copy,ignore=shutil.ignore_patterns('node_modules','dist','.git'))
            run(['npm','ci','--ignore-scripts']+(['--offline'] if args.offline else []),name+'-install',cwd=copy)
            run(['npm','run','build'],name+'-build',cwd=copy)
            run(['npm','test'],name+'-own',cwd=copy)
        run(['node',str(ROOT/'.audit/run-nov16-engine.mjs'),str(temporary)],'engine-run',cwd=ROOT)
        run(['node',str(ROOT/'.audit/nov16-reviewer-extra.mjs'),str(temporary)],'reviewer-extra',cwd=ROOT)
        run([str(CLI),'--session','nov16','open','about:blank','--config',str(config)],'browser-open',cwd=ROOT)
        try:
            run(['python3',str(ROOT/'.audit/run-nov16-browser.py')],'browser-run',cwd=ROOT,
                env={**os.environ,'TETRIS_NOV16_AUDIT_ROOT':str(temporary)})
        finally:
            subprocess.run([str(CLI),'--session','nov16','close'],cwd=ROOT,text=True,capture_output=True)
        for name in PROJECTS:
            assert hashes(ROOT/name)==original[name],name+' delivered source changed'
            assert hashes(temporary/name)==original[name],name+' copied source changed'
            engine=json.loads((ARTIFACTS/(name+'-engine.json')).read_text())
            browser=json.loads((ARTIFACTS/(name+'-browser.json')).read_text())
            failures=[x for x in engine['checks'] if not x['pass']]
            if name=='hy4-flash-free-none':continue
            for view in browser['views'].values():assert view['engine']['failures']==failures,'Node/Chromium disagreement'
    (ARTIFACTS/'source-hashes.json').write_text(json.dumps(original,indent=2)+'\n')
    print('All source hashes match; four Node/Chromium comparisons agree; none delivery failure recorded; temporary copies and browser closed.')
    return 0

if __name__=='__main__':raise SystemExit(main())
