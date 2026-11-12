#!/usr/bin/env python3
"""Build/test/probe MiniMax M3.1 Flash efforts in disposable copies."""
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
PROJECTS = {e: "minimax-m3.1-flash-free-" + e for e in ["max", "xhigh", "high", "medium", "low"]}


def stop(process):
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()


def run(command, cwd, log, *, allow_failure=False, env=None):
    print("$ " + " ".join(map(str, command)), flush=True)
    process = subprocess.Popen(command, cwd=cwd, text=True, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, start_new_session=True, env=env)
    try:
        output, _ = process.communicate(timeout=180)
    finally:
        # Also close surviving descendants if the command's leader has exited.
        stop(process)
    log.write_text(output)
    if process.returncode and not allow_failure:
        print(output, flush=True)
        raise RuntimeError(f"Command failed: {process.returncode}")
    return output


def free_port():
    for port in range(41000, 50000):
        try:
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", port))
            return port
        except OSError:
            continue
    raise RuntimeError("No free port in 41000–49999")


def browser(copy, mode, temporary):
    port = free_port()
    server_file = copy / ("tools/serve.js" if mode == "max" else "scripts/serve.js")
    original = server_file.read_text() if mode in ("max", "xhigh") else None
    if original is not None:
        literal = "const port = 8321;" if mode == "max" else "const PORT = 8321;"
        assert original.count(literal) == 1
        server_file.write_text(original.replace(literal, literal.replace("8321", "Number(process.env.PORT || 8321)")))
    # Added observation handles, RAF/clock capture and audit module only in dist.
    run(["node", "-e", "const b=require(process.argv[1]);b.instrument(process.argv[2],process.argv[3],process.argv[4]);",
         str(ROOT / ".audit/minimax-m31-flash-browser.cjs"), str(copy), mode, str(ROOT)], ROOT, temporary / f"{mode}-instrument.log")
    log_path = temporary / f"{mode}-server.log"
    with log_path.open("w") as log:
        server_command = {"max": "tools/serve.js", "xhigh": "scripts/serve.js", "high": "scripts/serve.mjs", "medium": "dist/server.js", "low": "scripts/serve.js"}[mode]
        server = subprocess.Popen(["node", server_command], cwd=copy,
                                  env={**os.environ, "PORT": str(port), "NO_UPDATE_NOTIFIER": "1"},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if server.poll() is not None:
                    raise RuntimeError("Server exited: " + log_path.read_text())
                try:
                    with socket.create_connection(("localhost", port), timeout=.1):
                        break
                except OSError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError("Server timeout: " + log_path.read_text())
                    time.sleep(.1)
            artifacts = temporary / "screenshots"
            artifacts.mkdir(exist_ok=True)
            output = run(["node", str(ROOT / ".audit/minimax-m31-flash-browser.cjs"),
                          f"http://localhost:{port}/", mode, str(artifacts)], ROOT, temporary / f"{mode}-browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            assert set(data["views"]) == {"desktop", "mobile"}
            (temporary / f"{mode}-browser.json").write_text(json.dumps(data, indent=2) + "\n")
            print(f"Chromium {data['browser']}: desktop/390×844 assertions passed", flush=True)
            print(json.dumps({k: {"scrollWidth": v["layout"]["scrollWidth"], "spins": v["spins"]} for k, v in data["views"].items()}), flush=True)
        finally:
            stop(server)
            if original is not None:
                server_file.write_text(original)


def source_hashes(directory):
    return {str(p.relative_to(directory)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(directory.rglob('*')) if p.is_file()
            and not set(p.relative_to(directory).parts) & {'node_modules', 'dist', 'dist-test', 'build', 'build-test', '.git'}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    parser.add_argument("--effort", choices=PROJECTS)
    parser.add_argument("--engine-only", action="store_true", help="Explicitly skip browser checks")
    parser.add_argument("--review", action="store_true", help="Wait for Enter before deleting evidence")
    args = parser.parse_args()

    def interrupted(signum, _frame):
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    with tempfile.TemporaryDirectory(prefix="tetris-minimax-m31-audit-") as directory:
        temporary = Path(directory)
        print(f"Disposable root: {temporary}", flush=True)
        for mode in ([args.effort] if args.effort else PROJECTS):
            copy = temporary / PROJECTS[mode]
            shutil.copytree(ROOT / PROJECTS[mode], copy,
                            ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", "build", ".git"))
            original_hashes = source_hashes(ROOT / PROJECTS[mode])
            run(["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []),
                copy, temporary / f"{mode}-install.log")
            run(["npm", "run", "build"], copy, temporary / f"{mode}-build.log")
            own = run(["npm", "test"], copy, temporary / f"{mode}-own.log", allow_failure=mode == "low")
            expected = {"max": "All 65 checks passed.", "xhigh": "All 17 tests passed.", "high": "7 passed, 0 failed", "medium": "pass 18", "low": "All 16 tests passed."}[mode]
            if mode == "low":
                from urllib.parse import quote
                def seeded_env(seed):
                    js = f"let seed={seed};Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);"
                    return {**os.environ, "NODE_OPTIONS": "--import=data:text/javascript," + quote(js, safe="")}
                failure = "top out happens when the spawn area is blocked"
                assert expected in own or ("1 test(s) failed:" in own and failure in own), own
                passing = run(["npm", "test"], copy, temporary / "low-own-seed1.log", env=seeded_env(1))
                assert expected in passing
                failing = run(["npm", "test"], copy, temporary / "low-own-seed4.log", allow_failure=True, env=seeded_env(4))
                assert "1 test(s) failed:" in failing and failure in failing and "true !== false" in failing, failing
                print("low: unchanged own suite: seed1 16 pass; seed4 15 pass / 1 fail (blocked-spawn fixture)", flush=True)
            else:
                assert expected in own, own
            print(f"{mode}: unchanged own suite: {own.strip().splitlines()[-1]}", flush=True)
            engine = run(["node", str(ROOT / ".audit/minimax-m31-flash-audit.mjs"), str(copy), mode],
                         ROOT, temporary / f"{mode}-engine.log")
            assert "engine outcomes asserted" in engine
            print(f"{mode}: independent engine outcomes asserted", flush=True)
            if not args.engine_only:
                browser(copy, mode, temporary)
            assert source_hashes(ROOT / PROJECTS[mode]) == original_hashes, "Delivered source changed"
            assert source_hashes(copy) == original_hashes, "Own workflow changed source"
            print(f"{mode}: all {len(original_hashes)} delivered file hashes unchanged", flush=True)
        if args.review:
            input(f"Review evidence in {temporary}; press Enter to delete it: ")
    print("All disposable copies, evidence and owned server/browser groups removed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
