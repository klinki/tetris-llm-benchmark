#!/usr/bin/env python3
"""Build, test and probe GPT-6.1 Sol (max) in a disposable copy, including Chromium."""
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
PROJECT = "gpt-6.1-sol-max"
OWN_TESTS = 42
# The agent's own git-ignored QA output is not part of the delivered source.
IGNORED = ("node_modules", "dist", ".git", "output", ".playwright-cli")


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


def run(command, cwd, log, timeout=300):
    print("$ " + " ".join(map(str, command)), flush=True)
    process = subprocess.Popen(command, cwd=cwd, text=True, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, start_new_session=True)
    try:
        output, _ = process.communicate(timeout=timeout)
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


def hashes(directory):
    return {str(p.relative_to(directory)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(directory.rglob("*"))
            if p.is_file() and not set(p.relative_to(directory).parts) & set(IGNORED)}


def browser(copy, temporary):
    port = free_port()
    log_path = temporary / "server.log"
    with log_path.open("w") as log:
        # The delivered server already honours PORT; nothing in the copy is adapted.
        server = subprocess.Popen(["npm", "start"], cwd=copy,
                                  env={**os.environ, "PORT": str(port), "NO_UPDATE_NOTIFIER": "1"},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 60
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
            output = run(["node", str(ROOT / ".audit/gpt61-sol-max-browser.cjs"), f"http://127.0.0.1:{port}/",
                          str(artifacts)], ROOT, temporary / "browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            assert set(data["views"]) == {"desktop", "mobile"}
            (temporary / "browser.json").write_text(json.dumps(data, indent=2) + "\n")
            print(f"Chromium {data['browser']}: 1280×800 and 390×844 assertions passed", flush=True)
            print(json.dumps({name: {**{k: view[k] for k in ("das", "exhausted", "gameOver", "ghost", "previewCells")},
                                     "board": next(c for c in view["layout"]["canvases"] if c["id"] == "board"),
                                     "documentWidth": view["layout"]["scrollWidth"]}
                              for name, view in data["views"].items()}), flush=True)
        finally:
            stop(server)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    parser.add_argument("--engine-only", action="store_true", help="Explicitly skip browser checks")
    parser.add_argument("--review", action="store_true", help="Wait for Enter before deleting evidence")
    parser.add_argument("--archive", type=Path, help="Also compare delivered files with the archived workspace")
    args = parser.parse_args()

    def interrupted(signum, _frame):
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    source = ROOT / PROJECT
    delivered = hashes(source)
    if args.archive:
        archived = hashes(args.archive)
        generated = {"STATISTICS.md"}
        assert {k: v for k, v in delivered.items() if k not in generated} == archived, "Archive differs"
        print(f"All {len(archived)} authored files match the archived workspace", flush=True)
    with tempfile.TemporaryDirectory(prefix="tetris-gpt61-sol-max-audit-") as directory:
        temporary = Path(directory)
        print(f"Disposable root: {temporary}", flush=True)
        copy = temporary / PROJECT
        shutil.copytree(source, copy, ignore=shutil.ignore_patterns(*IGNORED))
        run(["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []), copy, temporary / "install.log")
        run(["npm", "run", "build"], copy, temporary / "build.log")
        own = run(["npm", "test"], copy, temporary / "own.log")
        for line in (f"ℹ tests {OWN_TESTS}\n", f"ℹ pass {OWN_TESTS}\n", "ℹ fail 0\n"):
            assert line in own, own
        print(f"Unchanged own suite: {OWN_TESTS}/{OWN_TESTS} pass", flush=True)
        engine = run(["node", str(ROOT / ".audit/gpt61-sol-max-audit.mjs"), str(copy)], ROOT, temporary / "engine.log")
        assert "engine outcomes asserted" in engine
        print(engine.strip().splitlines()[-1], flush=True)
        if not args.engine_only:
            browser(copy, temporary)
        assert hashes(source) == delivered, "Delivered source changed"
        assert hashes(copy) == delivered, "Own workflow changed source"
        print(f"All {len(delivered)} delivered file hashes unchanged", flush=True)
        if args.review:
            try:
                input(f"Review evidence in {temporary}; press Enter to delete it: ")
            except EOFError:
                print("\nNo reviewer input; deleting evidence", flush=True)
    print("All disposable copies, evidence and owned server/browser groups removed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
