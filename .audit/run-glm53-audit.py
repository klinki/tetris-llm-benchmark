#!/usr/bin/env python3
"""Build/test/probe full GLM-5.3 low/high in disposable copies."""
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
PROJECTS = {"low": "glm-5.3-low", "high": "glm-5.3-high"}


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


def run(command, cwd, log):
    print("$ " + " ".join(map(str, command)), flush=True)
    process = subprocess.Popen(command, cwd=cwd, text=True, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, start_new_session=True)
    try:
        output, _ = process.communicate(timeout=180)
    finally:
        # Also close surviving descendants if the command's leader has exited.
        stop(process)
    log.write_text(output)
    if process.returncode:
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
    # Both unchanged own npm start commands honor PORT.
    log_path = temporary / f"{mode}-server.log"
    with log_path.open("w") as log:
        server = subprocess.Popen(["npm", "start"], cwd=copy,
                                  env={**os.environ, "PORT": str(port), "NO_UPDATE_NOTIFIER": "1"},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if server.poll() is not None:
                    raise RuntimeError("Server exited: " + log_path.read_text())
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=.1):
                        break
                except OSError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError("Server timeout: " + log_path.read_text())
                    time.sleep(.1)
            artifacts = temporary / "screenshots"
            artifacts.mkdir(exist_ok=True)
            output = run(["node", str(ROOT / ".audit/glm53-browser.cjs"),
                          f"http://localhost:{port}/", mode, str(artifacts)], ROOT, temporary / f"{mode}-browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            assert set(data["views"]) == {"desktop", "mobile"}
            (temporary / f"{mode}-browser.json").write_text(json.dumps(data, indent=2) + "\n")
            print(f"Chromium {data['browser']}: desktop/390×844 assertions passed", flush=True)
            print(json.dumps(data), flush=True)
        finally:
            stop(server)


def source_hashes(directory):
    return {str(p.relative_to(directory)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(directory.rglob('*')) if p.is_file()
            and not set(p.relative_to(directory).parts) & {'node_modules', 'dist', 'dist-test', 'build', '.git'}}


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
    with tempfile.TemporaryDirectory(prefix="tetris-glm53-audit-") as directory:
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
            own = run(["npm", "test"], copy, temporary / f"{mode}-own.log")
            assert ("11 passed, 0 failed" if mode == "low" else "57 checks passed, 0 failed") in own, own
            print(f"{mode}: unchanged own suite: {own.strip().splitlines()[-1]}", flush=True)
            engine = run(["node", str(ROOT / ".audit/glm53-audit.mjs"), str(copy), mode],
                         ROOT, temporary / f"{mode}-engine.log")
            assert "engine outcomes asserted" in engine
            print(engine.strip(), flush=True)
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
