#!/usr/bin/env python3
"""Build/test/probe Beam low/medium and MiMo default in disposable copies."""
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
PROJECTS = {"low": "beam-free-low", "medium": "beam-free-medium", "mimo": "mimo-v2.6-flash-default"}


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
        if process.poll() is None:
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


def browser(copy, mode, temporary, args):
    port = free_port()
    # Preserve each declared npm start command. Only its fixed port literal
    # changes in copies, exactly as in the Terra/Sol audit runners.
    if mode == "low":
        package = copy / "package.json"
        text = package.read_text()
        assert "http-server . -p 8321" in text
        package.write_text(text.replace("http-server . -p 8321", f"http-server . -p {port}"))
    elif mode == "medium":
        server = copy / "server.js"
        text = server.read_text()
        assert "const PORT = 8321;" in text
        server.write_text(text.replace("const PORT = 8321;", "const PORT = Number(process.env.PORT);"))
    log_path = temporary / f"{mode}-server.log"
    with log_path.open("w") as log:
        process = subprocess.Popen(["npm", "start"], cwd=copy,
                                   env={**os.environ, "PORT": str(port), "NO_UPDATE_NOTIFIER": "1"},
                                   stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if process.poll() is not None:
                    raise RuntimeError("Server exited: " + log_path.read_text())
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=.1):
                        break
                except OSError:
                    if time.monotonic() >= deadline:
                        raise RuntimeError("Server timeout: " + log_path.read_text())
                    time.sleep(.1)
            command = ["node", str(ROOT / ".audit/beam-mimo-browser.cjs"), f"http://localhost:{port}/", mode]
            artifacts = temporary / "screenshots"
            artifacts.mkdir(exist_ok=True)
            command.append(str(artifacts))
            output = run(command, ROOT, temporary / f"{mode}-browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            assert data["mode"] == mode and set(data["views"]) == {"desktop", "mobile"}
            print(f"{mode}: Chromium {data['browser']}, desktop/390×844 assertions passed", flush=True)
            (temporary / f"{mode}-browser.json").write_text(json.dumps(data, indent=2) + "\n")
        finally:
            stop(process)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--engine-only", action="store_true")
    parser.add_argument("--effort", choices=PROJECTS)
    args = parser.parse_args()
    def interrupted(signum, _frame):
        raise SystemExit(128 + signum)
    signal.signal(signal.SIGTERM, interrupted)
    with tempfile.TemporaryDirectory(prefix="tetris-beam-mimo-audit-") as directory:
        temporary = Path(directory)
        print(f"Disposable root: {temporary}", flush=True)
        for mode in ([args.effort] if args.effort else PROJECTS):
            copy = temporary / PROJECTS[mode]
            shutil.copytree(ROOT / PROJECTS[mode], copy,
                            ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"))
            run(["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []), copy, temporary / f"{mode}-install.log")
            run(["npm", "run", "build"], copy, temporary / f"{mode}-build.log")
            own = run(["npm", "test"], copy, temporary / f"{mode}-own.log")
            marker = {"low": "ok", "medium": "ALL TESTS PASS", "mimo": "76 passed, 0 failed"}[mode]
            assert marker in own, own
            print(f"{mode}: unchanged own workflow passed ({own.strip().splitlines()[-1]})", flush=True)
            engine = run(["node", str(ROOT / ".audit/beam-mimo-audit.mjs"), str(copy), mode], ROOT, temporary / f"{mode}-engine.log")
            assert f"{mode}: canonical engine, scoring, clocks and findings asserted" in engine
            print(engine.strip(), flush=True)
            if not args.engine_only:
                browser(copy, mode, temporary, args)
    print("All disposable copies and owned server groups removed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
