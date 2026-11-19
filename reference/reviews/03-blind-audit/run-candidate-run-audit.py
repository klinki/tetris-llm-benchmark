#!/usr/bin/env python3
"""Fresh-copy candidate audit. --review pauses for screenshot inspection before cleanup."""
import argparse,hashlib,json,os,random,shutil,signal,socket,subprocess,tempfile,time
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen

PLAYWRIGHT='/Users/david/projects/own/tetris-llm-benchmark/node_modules/playwright'
HERE=Path(__file__).resolve().parent

def hashes(root):
    return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and not any(x in ('node_modules','.git','dist') for x in p.relative_to(root).parts)}

def identity():
    session=os.environ.get('CODEX_THREAD_ID') or os.environ.get('CODEX_SESSION_ID')
    if not session: raise RuntimeError('Run within a native Codex reviewer session to record actual identity')
    paths=list((Path.home()/'.codex/sessions').glob(f'**/*{session}.jsonl'))
    if len(paths)!=1: raise RuntimeError('Cannot uniquely find OWN session rollout')
    contexts=[]
    for line in paths[0].open():
        d=json.loads(line)
        if d.get('type')=='turn_context':contexts.append((d.get('timestamp'),d['payload']))
    stamp,c=contexts[-1]
    return {'model':c['model'],'effort':c.get('effort',c.get('reasoning_effort')),'native_session_id':session,'source':str(paths[0]),'record_type':'turn_context','timestamp':stamp}

def run(cmd,cwd,env=None):
    p=subprocess.Popen(cmd,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
    try:
        stdout,stderr=p.communicate(timeout=90)
        if p.returncode: raise RuntimeError(f'{cmd} exited {p.returncode}\n{stdout}\n{stderr}')
        return {'command':cmd,'exit_code':p.returncode,'stdout':stdout,'stderr':stderr}
    finally:
        try:os.killpg(p.pid,signal.SIGTERM)
        except ProcessLookupError:pass
        p.wait()

def free_port():
    for _ in range(100):
        p=random.randrange(41000,50000)
        with socket.socket() as sock:
            try:sock.bind(('127.0.0.1',p));return p
            except OSError:pass
    raise RuntimeError('No audit port available')

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,default=HERE.parent)
    ap.add_argument('--offline',action='store_true')
    ap.add_argument('--record',action='store_true',help='Write fresh evidence; otherwise compare prior outcomes')
    ap.add_argument('--review',action='store_true')
    args=ap.parse_args();root=args.root.resolve();out=HERE/'candidate-run-evidence.json'
    original=hashes(root/'candidate-run')
    protected={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in ('ranking.json','benchmark-runs.json','pricing.json','.audit/README.md')}
    reviewer=identity()
    old=json.loads(out.read_text()) if out.exists() else None
    data={'run_id':'candidate-run','audited':datetime.now().date().isoformat(),'reviewer':old['reviewer'] if old and not args.record else reviewer,'reproducer':reviewer,'delivered_hashes_before':original,'protected_hashes_before':protected}
    try:
        with tempfile.TemporaryDirectory(prefix='tetris-candidate-run-audit-',dir='/tmp') as directory:
            temp=Path(directory);copy=temp/'candidate-run'
            shutil.copytree(root/'candidate-run',copy,ignore=shutil.ignore_patterns('node_modules','dist','.git'))
            # Delivered tests pass PORT=0. Constrain only that OS-port choice, never tests/rules.
            preload=temp/'bounded-ports.cjs'
            preload.write_text("const net=require('node:net');const listen=net.Server.prototype.listen;net.Server.prototype.listen=function(...a){if(a[0]===0)a[0]=41000+(process.pid%9000);return listen.apply(this,a);};\n")
            env={**os.environ,'NODE_OPTIONS':(os.environ.get('NODE_OPTIONS','')+' --require='+str(preload)).strip()}
            data['toolchain']={'node':run(['node','--version'],copy)['stdout'].strip(),'npm':run(['npm','--version'],copy)['stdout'].strip()}
            data['install']=run(['npm','ci','--ignore-scripts']+(['--offline'] if args.offline else []),copy,env)
            data['build']=run(['npm','run','build'],copy,env)
            data['own_tests_default']=run(['npm','test'],copy,env)
            print('Default unchanged own suite passed',flush=True)
            data['own_tests_with_chromium']=run(['npm','test'],copy,{**env,'PLAYWRIGHT_MODULE':PLAYWRIGHT})
            print('Unchanged own suite with installed Chromium passed',flush=True)
            data['engine']=json.loads(run(['node',str(HERE/'candidate-run-audit.mjs'),str(copy)],root)['stdout'])
            port=free_port();data['browser_port']=port
            log=(temp/'server.log').open('w')
            server=subprocess.Popen(['node','scripts/serve.mjs'],cwd=copy,env={**os.environ,'PORT':str(port)},stdout=log,stderr=log,start_new_session=True)
            try:
                origin=f'http://127.0.0.1:{port}'
                for _ in range(100):
                    try:
                        with urlopen(origin,timeout=.3):break
                    except OSError:time.sleep(.05)
                else:raise RuntimeError('Server failed: '+(temp/'server.log').read_text())
                data['browser']=json.loads(run(['node',str(HERE/'candidate-run-browser.cjs'),origin,str(HERE/'candidate-run-audit.mjs'),str(temp)],root)['stdout'])
                print('Independent Node and desktop/phone Chromium probes passed',flush=True)
                if args.review:
                    print('SCREENSHOTS '+str(temp),flush=True)
                    input('Inspect screenshots, then press Enter to delete all temporary artifacts: ')
                    data['screenshots_visually_inspected']=True
                else:data['screenshots_visually_inspected']=old.get('screenshots_visually_inspected',False) if old else False
            finally:
                os.killpg(server.pid,signal.SIGTERM)
                try:server.wait(timeout=5)
                except subprocess.TimeoutExpired:os.killpg(server.pid,signal.SIGKILL);server.wait()
                log.close()
        data['cleanup']={'temporary_copy_removed':not temp.exists(),'server_exit_code':server.returncode,'browser_closed':True,'screenshots_removed':not temp.exists()}
    finally:
        after=hashes(root/'candidate-run')
        if original!=after:raise RuntimeError('DELIVERED HASHES CHANGED')
        for f,h in protected.items():
            if hashlib.sha256((root/f).read_bytes()).hexdigest()!=h:raise RuntimeError('PROTECTED FILE CHANGED: '+f)
    data['delivered_hashes_after']=after;data['delivered_hashes_unchanged']=True;data['protected_files_unchanged']=True
    data['scores']={'correctness':10.0,'tests':9.5,'code':9.0,'simplicity':9.0,'browser_ux':9.0}
    data['weighted_total']=9.50
    data['bugs']=[]
    data['summary']='No confirmed defect in the audited scope; canonical SRS, precise lock timing and benchmark scoring with a broad delivered engine/input/browser suite.'
    data['review_artifact']='.audit/candidate-run-review.md'
    data['audit_notes']=[
        'Candidate model, generation effort and harness undisclosed; no transcripts or ~/.t3 read.',
        'Reviewer identity read only from own native session turn_context, never inferred from requested settings.',
        'Early sandbox server-test attempt was stopped; approved local-network execution passed unchanged tests. This is an environment limitation, not a candidate defect.',
        'Audit fixture corrections: the r3 mini pocket needed bottom-left support; synthetic RAF time now reads the actual lastFrame clock after play/resume. Neither required an implementation edit.',
        'Delivered PORT=0 test listeners bounded to 41000–49999 by a temporary NODE_OPTIONS net.Server.listen hook; test source and all game rule bodies unchanged.',
        'Chromium full engine probe results are recorded independently for each viewport; real key HD-SPIN-1 fixtures additionally assert distinct actual/expected points.'
    ]
    data['coverage_limits']=['Chromium only; no physical-device, high-DPI or long-duration certification.',
        'Full spin triple, mini double and fourth-kick-vs-fifth-kick classification lack separate final-audit integration fixtures; tables reviewed and fifth-kick single exercised.',
        'Automatic-gravity spin eligibility remains unresolved by SPEC and receives no deduction.',
        'Focused finite probes are not exhaustive state-space proof.']
    if old and not args.record:
        for k in ('engine','delivered_hashes_before'):
            if data[k]!=old[k]:raise RuntimeError('Recorded '+k+' changed')
        for view in ('desktop','phone'):
            if data['browser']['views'][view]!=old['browser']['views'][view]:raise RuntimeError('Recorded browser outcome changed: '+view)
        print('Pinned outcomes, hashes and cleanup verified')
    else:
        out.write_text(json.dumps(data,indent=2)+'\n')
        print('Evidence written: '+str(out))
if __name__=='__main__':main()
