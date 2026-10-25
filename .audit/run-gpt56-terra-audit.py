#!/usr/bin/env python3
"""Build, test and assert Terra's audit findings in disposable copies."""
import argparse
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


def run(command, cwd, log):
    print('$ ' + ' '.join(map(str, command)), flush=True)
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, timeout=180)
    output = result.stdout + result.stderr
    log.write_text(output)
    if result.returncode:
        print(output, flush=True)
        raise RuntimeError(f'Command exited {result.returncode}')
    return output


def free_port():
    for candidate in range(41000, 50000):
        try:
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', candidate))
            return candidate
        except OSError:
            continue
    raise RuntimeError('No free audit port in 41000–49999')


def browser_audit(copy, effort, temporary, args, family):
    port = free_port()
    if family == 'terra':
        if effort == 'low':
            server = copy / 'server.js'
            text = server.read_text()
            assert '.listen(8321,' in text
            server.write_text(text.replace('.listen(8321,', '.listen(Number(process.env.PORT),'))
        elif effort == 'medium':
            package = copy / 'package.json'
            text = package.read_text()
            assert 'serve . -l 8321' in text
            package.write_text(text.replace('serve . -l 8321', f'serve . -l {port}'))
        elif effort == 'high':
            server = copy / 'tools/serve.mjs'
            text = server.read_text()
            assert '.listen(8321,' in text
            server.write_text(text.replace('.listen(8321,', '.listen(Number(process.env.PORT),'))
    else:
        server = copy / 'server.js'
        text = server.read_text()
        assert 'const PORT = 8321;' in text
        server.write_text(text.replace('const PORT = 8321;', 'const PORT = Number(process.env.PORT);'))
    log_path = temporary / f'{effort}-server.log'
    with log_path.open('w') as log:
        process = subprocess.Popen(['npm', 'start'], cwd=copy,
                                   env={**os.environ, 'PORT': str(port), 'NO_UPDATE_NOTIFIER': '1'},
                                   stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if process.poll() is not None:
                    raise RuntimeError('Server exited: ' + log_path.read_text())
                try:
                    with socket.create_connection(('127.0.0.1', port), timeout=0.1):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise RuntimeError('Server did not listen: ' + log_path.read_text())
                    time.sleep(0.1)
            prefix = 'gpt56-terra' if family == 'terra' else 'qwen38-max'
            command = ['node', str(ROOT / f'.audit/{prefix}-browser.cjs'), f'http://localhost:{port}/', effort]
            if args.artifacts_dir:
                args.artifacts_dir.mkdir(parents=True, exist_ok=True)
                command.append(str(args.artifacts_dir))
            output = run(command, ROOT, temporary / f'{effort}-browser.log')
            data = json.loads(output.strip().splitlines()[-1])
            assert data['family'] == family and data['mode'] == effort
            assert set(data['views']) == {'desktop', 'mobile'}
            print(f"{family} {effort}: Chromium {data['browser']}, desktop and 390×844 passed", flush=True)
            if args.artifacts_dir:
                (args.artifacts_dir / f'{prefix}-{effort}-browser.json').write_text(json.dumps(data, indent=2) + '\n')
        finally:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()


def main(family='terra'):
    efforts = ('low', 'medium', 'high', 'xhigh') if family == 'terra' else ('low', 'medium')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Use only cached npm dependencies')
    parser.add_argument('--engine-only', action='store_true', help='Explicitly skip browser findings')
    parser.add_argument('--effort', choices=efforts)
    parser.add_argument('--artifacts-dir', type=lambda p: Path(p).resolve(), help='Retain evidence outside the checkout')
    args = parser.parse_args()
    if args.artifacts_dir and args.artifacts_dir.is_relative_to(ROOT):
        parser.error('--artifacts-dir must be outside the checkout')
    prefix = 'gpt56-terra' if family == 'terra' else 'qwen38-max'
    project = 'gpt-5.6-terra' if family == 'terra' else 'qwen3.8-max'
    markers = {'low': 'Smoke tests passed', 'medium': 'Smoke tests passed: build contains core Tetris game logic.',
               'high': 'Tetris logic smoke tests passed', 'xhigh': 'All Tetris logic smoke tests passed.'}
    with tempfile.TemporaryDirectory(prefix=f'tetris-{prefix}-audit-') as directory:
        temporary = Path(directory)
        for effort in ((args.effort,) if args.effort else efforts):
            copy = temporary / f'{project}-{effort}'
            shutil.copytree(ROOT / f'{project}-{effort}', copy,
                            ignore=shutil.ignore_patterns('node_modules', 'dist', 'build', '.git'))
            run(['npm', 'ci', '--ignore-scripts'] + (['--offline'] if args.offline else []), copy, temporary / f'{effort}-install.log')
            run(['npm', 'run', 'build'], copy, temporary / f'{effort}-build.log')
            output = run(['npm', 'test'], copy, temporary / f'{effort}-test.log')
            if family == 'terra':
                assert markers[effort] in output, output
            elif effort == 'low':
                assert 'All 15 tests passed' in output and output.count('ok   ') == 15, output
            else:
                assert 'ℹ tests 13\n' in output and 'ℹ pass 13\n' in output and 'ℹ fail 0\n' in output, output
            print(f'{family} {effort}: unchanged own workflow passed', flush=True)
            output = run(['node', str(ROOT / f'.audit/{prefix}-audit.mjs'), str(copy), effort], ROOT, temporary / f'{effort}-engine.log')
            assert f'{family} {effort}: canonical engine, unchanged clock, scoring and transition findings asserted' in output
            print(f'{family} {effort}: all recorded engine findings asserted', flush=True)
            if args.artifacts_dir:
                args.artifacts_dir.mkdir(parents=True, exist_ok=True)
                (args.artifacts_dir / f'{prefix}-{effort}-engine.log').write_text(output)
            if not args.engine_only:
                browser_audit(copy, effort, temporary, args, family)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
