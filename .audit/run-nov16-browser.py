#!/usr/bin/env python3
"""Audit served disposable builds through the Playwright skill CLI."""
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import time

ROOT=Path(__file__).resolve().parents[1]
COPIES=Path(os.environ.get('TETRIS_NOV16_AUDIT_ROOT','/private/tmp/tetris-nov16-audit'))
ARTIFACTS=ROOT/'output/playwright/nov16'
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
PROJECTS={'hy4':'hy4-flash-free-high','none':'hy4-flash-free-none','high':'qwen4-max-high','low':'qwen4-max-low','xhigh':'qwen4-max-xhigh'}

def stop(p):
    try: os.killpg(p.pid,signal.SIGTERM)
    except ProcessLookupError: pass
    try:p.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid,signal.SIGKILL);p.wait()

def main():
    for index,(mode,name) in enumerate(PROJECTS.items()):
        copy=COPIES/name
        server=copy/('server.mjs' if mode=='xhigh' else 'server.js')
        original=server.read_text()
        port=41831+index
        # Only the copied server's listen constant is changed.
        if 'const PORT = 8321;' in original:
            server.write_text(original.replace('const PORT = 8321;',f'const PORT = {port};'))
        log=(ARTIFACTS/(name+'-server.log')).open('w')
        process=subprocess.Popen(['node',server.name],cwd=copy,env={**os.environ,'PORT':str(port)},stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
        try:
            deadline=time.monotonic()+15
            while True:
                try:
                    with socket.create_connection(('127.0.0.1',port),timeout=.1):break
                except OSError:
                    if process.poll() is not None or time.monotonic()>deadline:raise RuntimeError('Server startup failed')
                    time.sleep(.1)
            code=(ROOT/('.audit/nov16-none-browser.template.js' if mode=='none' else '.audit/nov16-browser.template.js')).read_text()
            replacements={'MODE':mode,'NAME':name,'URL':f'http://localhost:{port}/','FIXTURE':(ROOT/'.audit/nov16-engine.mjs').read_text(),
                          'ORACLE':json.loads((ARTIFACTS/'oracle.json').read_text()),'ARTIFACTS':str(ARTIFACTS)}
            for key,value in replacements.items():code=code.replace('__'+key+'__',json.dumps(value))
            script=ARTIFACTS/(name+'-browser-code.js');script.write_text(code)
            result=subprocess.run([str(CLI),'--session','nov16','run-code','--filename',str(script)],cwd=ROOT,text=True,capture_output=True,timeout=120)
            (ARTIFACTS/(name+'-browser.log')).write_text(result.stdout+result.stderr)
            text=result.stdout
            if result.returncode or '### Error' in text:raise RuntimeError(text[-5000:]+result.stderr)
            start=text.index('### Result\n')+len('### Result\n')
            data=json.JSONDecoder().raw_decode(text[start:].lstrip())[0]
            (ARTIFACTS/(name+'-browser.json')).write_text(json.dumps(data,indent=2)+'\n')
            print(name,json.dumps({view:{'controls':len(v.get('controls',[])),'width':v['layout']['width'],'scrollWidth':v['layout']['scrollWidth'],'spins':{k:x['score'] for k,x in v.get('spins',{}).items()}} for view,v in data['views'].items()}),flush=True)
        finally:
            stop(process);log.close();server.write_text(original)
    return 0

if __name__=='__main__':raise SystemExit(main())
