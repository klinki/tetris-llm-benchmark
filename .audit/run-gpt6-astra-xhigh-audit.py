#!/usr/bin/env python3
"""Fresh-copy audit; default mode reproduces pinned outcomes including defects."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import random
import shutil
import signal
import socket
import subprocess
import tempfile
import time
ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / '.audit/gpt6-astra-xhigh-evidence.json'

def hashes(folder):
    return {str(p.relative_to(folder)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(folder.rglob('*')) if p.is_file()
            and not set(p.relative_to(folder).parts) & {'node_modules', 'dist', '.git'}}

def stop(p):
    try: os.killpg(p.pid, signal.SIGTERM)
    except ProcessLookupError: pass
    try: p.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL)
        p.wait()

def run(cmd, cwd):
    print('$ '+' '.join(map(str, cmd)), flush=True)
    p = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, start_new_session=True)
    try: out, _ = p.communicate(timeout=180)
    finally: stop(p)
    if p.returncode: raise RuntimeError(out)
    return out

def free_port():
    for port in random.sample(range(41000,50000),9000):
        with socket.socket() as s:
            try: s.bind(('127.0.0.1',port)); return port
            except PermissionError: raise
            except OSError: pass
    raise RuntimeError('No free audit port')

def reviewer():
    sid=os.environ['CODEX_SESSION_ID']
    # Locate only this process's own rollout. Read metadata, never other sessions.
    paths=list((Path.home()/'.codex/sessions').glob('**/*'+sid+'.jsonl'))
    assert len(paths)==1
    for line in paths[0].open():
        obj=json.loads(line)
        if obj['type']=='turn_context':
            d=obj['payload']
            assert (d['model'],d['effort'])==('gpt-6.1-sol','xhigh')
            return {'model':d['model'],'effort':d['effort'],'native_session_id':sid,
                    'native_rollout':str(paths[0]),'turn_id':d['turn_id'],
                    'source':'own native Codex turn_context',
                    't3_thread_id':os.environ.get('T3CODE_THREAD_ID')}
    raise RuntimeError('Own native metadata absent')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline',action='store_true')
    parser.add_argument('--record',action='store_true')
    parser.add_argument('--engine-only',action='store_true')
    parser.add_argument('--review',action='store_true',help='Pause for PNG inspection before cleanup')
    parser.add_argument('--preview',action='store_true',help='Pause with server available to shared preview')
    args=parser.parse_args()
    def interrupted(signum,_): raise SystemExit(128+signum)
    signal.signal(signal.SIGINT,interrupted);signal.signal(signal.SIGTERM,interrupted)
    saved=json.loads(EVIDENCE.read_text()) if EVIDENCE.exists() else {}
    effort='xhigh';source=ROOT/'gpt-6-astra-xhigh';before=hashes(source);saved=saved.get('runs',{}).get(effort,{})
    with tempfile.TemporaryDirectory(prefix='tetris-gpt6-astra-xhigh-audit-') as directory:
        temp=Path(directory);copy=temp/source.name
        print('Disposable root: '+directory,flush=True)
        shutil.copytree(source,copy,ignore=shutil.ignore_patterns('node_modules','dist','.git'))
        try:
            ci=run(['npm','ci','--ignore-scripts']+(['--offline'] if args.offline else []),copy)
            build=run(['npm','run','build'],copy)
            own=run(['npm','test'],copy)
            assert ('pass '+str(28)) in own,own
            engine=json.loads(run(['node',str(ROOT/'.audit/gpt6-astra-xhigh-audit.mjs'),str(copy),effort],ROOT))
            data={'run_id':'gpt-6-astra-'+effort,'audited':'2026-11-19','hashes':before,
                  'workflow':{'install':ci,'build':build,'unchanged_npm_test':own},'engine':engine}
            if not args.engine_only:
                port=free_port()
                server=copy/'scripts/serve.mjs'
                log=(temp/'server.log').open('w')
                p=subprocess.Popen(['node',str(server)],cwd=copy,stdout=log,stderr=subprocess.STDOUT,start_new_session=True,env={**os.environ,'PORT':str(port)})
                try:
                    deadline=time.monotonic()+15
                    while True:
                        if p.poll() is not None: raise RuntimeError((temp/'server.log').read_text())
                        try:
                            with socket.create_connection(('127.0.0.1',port),timeout=.1): break
                        except OSError:
                            if time.monotonic()>deadline: raise RuntimeError('server timeout')
                            time.sleep(.05)
                    print(f'Server: http://127.0.0.1:{port}/',flush=True)
                    if args.preview: input('Shared preview ready; Enter proceeds: ')
                    screenshots=temp/'screenshots';screenshots.mkdir()
                    data['browser']=json.loads(run(['node',str(ROOT/'.audit/gpt6-astra-xhigh-browser.cjs'),f'http://127.0.0.1:{port}/',str(screenshots),effort],ROOT))
                    for view in data['browser']['views'].values(): assert view['engine']==engine,'Node/Chromium divergence'
                finally:
                    stop(p);log.close()
            assert hashes(copy)==before,'Copied delivery changed'
            if args.record:
                if args.engine_only and before==saved.get('hashes') and engine==saved.get('engine') and 'browser' in saved:
                    data['browser']=saved['browser']
                data['environment']={k:subprocess.check_output(v,text=True,cwd=ROOT).strip() for k,v in {'node':['node','--version'],'npm':['npm','--version'],'python':['python3','--version'],'playwright':['node','-p',"require('./node_modules/playwright/package.json').version"]}.items()}
                data['reviewer']=saved.get('reviewer') or reviewer()
                # Retain explicit human-reviewed annotations across numeric reruns.
                for key in ['review','preservation','screenshots_inspected','thread_link','validation']:
                    if key in saved: data[key]=saved[key]
                all_data=json.loads(EVIDENCE.read_text()) if EVIDENCE.exists() else {}
                all_data.setdefault('runs',{})[effort]=data
                EVIDENCE.write_text(json.dumps(all_data,indent=2)+'\n')
            else:
                assert before==saved['hashes'],'Delivery differs from pinned audit'
                assert engine==saved['engine'],'Engine outcome changed'
                if not args.engine_only: assert data['browser']==saved['browser'],'Browser outcome changed'
            print('Install/build/unchanged own suite/engine'+('/both Chromium views' if not args.engine_only else '')+' passed.',flush=True)
            if args.review: input(f'Inspect PNGs in {temp}/screenshots; Enter removes everything: ')
        finally:
            assert hashes(source)==before,'Delivered files changed'
    print('All temporary copies, screenshots, logs, owned servers and browsers removed; hashes unchanged.',flush=True)
if __name__=='__main__': main()
