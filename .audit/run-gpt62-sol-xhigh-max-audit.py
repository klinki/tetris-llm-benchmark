#!/usr/bin/env python3
"""Locked disposable GPT-6.2 Sol audit; recorded outcomes include known defects."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import tempfile
import time
ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / '.audit/gpt62-sol-xhigh-max-evidence.json'

def hashes(folder):
    return {str(p.relative_to(folder)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(folder.rglob('*')) if p.is_file()
            and not set(p.relative_to(folder).parts) & {'node_modules','dist','.git'}}

def stop(p):
    try: os.killpg(p.pid, signal.SIGTERM)
    except ProcessLookupError: pass
    try: p.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL)
        p.wait()

def run(cmd,cwd,log):
    print('$ '+' '.join(map(str,cmd)),flush=True)
    p=subprocess.Popen(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
    try: out,_=p.communicate(timeout=180)
    finally: stop(p)
    log.write_text(out)
    if p.returncode: raise RuntimeError(out)
    return out

def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1',0))
        return s.getsockname()[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline',action='store_true')
    parser.add_argument('--effort',choices=['xhigh','max'])
    parser.add_argument('--engine-only',action='store_true')
    parser.add_argument('--record',action='store_true',help='Update numeric evidence after reviewer inspection')
    parser.add_argument('--preview',action='store_true',help='Pause after server startup for shared-preview connection check')
    parser.add_argument('--review',action='store_true',help='Pause before cleanup for screenshot inspection (PTY)')
    args=parser.parse_args()
    def interrupted(signum,_): raise SystemExit(128+signum)
    signal.signal(signal.SIGINT,interrupted);signal.signal(signal.SIGTERM,interrupted)
    saved=json.loads(EVIDENCE.read_text()) if EVIDENCE.exists() else {'runs':{}}
    if args.record:
        saved['environment']={k:subprocess.check_output(v,text=True).strip() for k,v in {'node':['node','--version'],'npm':['npm','--version'],'python':['python3','--version'],'playwright':['node','-p',"require('./node_modules/playwright/package.json').version"]}.items()}
    with tempfile.TemporaryDirectory(prefix='tetris-gpt62-sol-xhigh-max-audit-') as directory:
        temp=Path(directory);print('Disposable root: '+directory,flush=True)
        for effort in ([args.effort] if args.effort else ['xhigh','max']):
            source=ROOT/('gpt-6.2-sol-'+effort);copy=temp/source.name;before=hashes(source)
            shutil.copytree(source,copy,ignore=shutil.ignore_patterns('node_modules','dist','.git'))
            ci=run(['npm','ci','--ignore-scripts']+(['--offline'] if args.offline else []),copy,temp/(effort+'-ci.log'))
            build=run(['npm','run','build'],copy,temp/(effort+'-build.log'))
            own=run(['npm','test'],copy,temp/(effort+'-own.log'))
            assert 'pass '+str({'xhigh':9,'max':11}[effort]) in own,own
            engine=json.loads(run(['node',str(ROOT/'.audit/gpt62-sol-xhigh-max-audit.mjs'),str(copy),effort]+(['--record'] if args.record else []),ROOT,temp/(effort+'-engine.log')))
            data={'hashes':before,'workflow':{'locked_install':ci,'explicit_build':build,'own_test_command':'npm test (unchanged)'},'own':own,'engine':engine}
            if not args.engine_only:
                port=free_port()
                log=(temp/(effort+'-server.log')).open('w')
                p=subprocess.Popen(['npm','start'],cwd=copy,env={**os.environ,'PORT':str(port)},stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
                try:
                    deadline=time.monotonic()+30
                    while True:
                        if p.poll() is not None: raise RuntimeError('server exited')
                        try:
                            with socket.create_connection(('127.0.0.1',port),timeout=.1): break
                        except OSError:
                            if time.monotonic()>deadline: raise RuntimeError('server timeout')
                            time.sleep(.1)
                    print(f'Server: http://127.0.0.1:{port}/',flush=True)
                    if args.preview: input('Preview server ready; Enter continues Chromium fixtures: ')
                    screenshots=temp/'screenshots';screenshots.mkdir(exist_ok=True)
                    data['browser']=json.loads(run(['node',str(ROOT/'.audit/gpt62-sol-xhigh-max-browser.cjs'),f'http://'+('127.0.0.1')+f':{port}/',effort,str(screenshots)]+(['--record'] if args.record else []),ROOT,temp/(effort+'-browser.log')))
                finally:
                    stop(p);log.close()
            assert hashes(source)==before,'delivered changed'
            assert hashes(copy)==before,'copied source changed'
            if args.record:
                saved['runs'][effort]=data;EVIDENCE.write_text(json.dumps(saved,indent=2)+'\n')
            else:
                assert before==saved['runs'][effort]['hashes']
            print(f'{effort}: locked install/build/own tests/engine'+('/Chromium' if not args.engine_only else '')+' passed; all hashes unchanged',flush=True)
        if args.review: input(f'Inspect {temp}/screenshots; Enter cleans all owned artifacts: ')
    print('All disposable copies, logs, screenshots and owned server/browser groups removed.',flush=True)
if __name__=='__main__':main()
