#!/usr/bin/env python3
"""Build/test/probe the isolated Opus 5.5 medium rerun in one disposable root."""
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
PROJECT = "claude-opus-5-5-medium"


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


def browser(copy, temporary):
    port = free_port()
    log_path = temporary / "server.log"
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
            artifacts.mkdir()
            output = run(["node", str(ROOT / ".audit/opus55-medium-rerun-browser.cjs"),
                          f"http://localhost:{port}/", str(artifacts)], ROOT, temporary / "browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            assert set(data["views"]) == {"desktop", "mobile"}
            for view in data["views"].values():
                extra = view["round2"]
                assert extra["rotationOutcomes"] == {
                    "rotations": 672, "rejections": 125,
                    "acceptedCandidates": [309, 117, 58, 28, 35]}
                assert len(extra["spinFacings"]) == 8
                assert all(extra[key] for key in (
                    "heldRepeat", "latestDirection", "blurRelease", "repeatSuppression", "pauseKeys"))
            (temporary / "browser.json").write_text(json.dumps(data, indent=2) + "\n")
            print(f"Chromium {data['browser']}: desktop/390×844 assertions passed", flush=True)
            print(json.dumps(data), flush=True)
        finally:
            stop(server)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    parser.add_argument("--engine-only", action="store_true", help="Explicitly skip browser checks")
    parser.add_argument("--review", action="store_true", help="Wait for Enter before deleting evidence")
    args = parser.parse_args()

    def interrupted(signum, _frame):
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    with tempfile.TemporaryDirectory(prefix="tetris-opus55-medium-rerun-audit-") as directory:
        temporary = Path(directory)
        print(f"Disposable root: {temporary}", flush=True)
        copy = temporary / PROJECT
        shutil.copytree(ROOT / PROJECT, copy,
                        ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"))
        run(["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []),
            copy, temporary / "install.log")
        run(["npm", "run", "build"], copy, temporary / "build.log")
        own = run(["npm", "test"], copy, temporary / "own.log")
        assert "ℹ pass 13" in own and "ℹ fail 0" in own, own
        print("Unchanged own suite: 13 passed, 0 failed", flush=True)
        engine = run(["node", str(ROOT / ".audit/opus55-medium-rerun-audit.mjs"), str(copy)],
                     ROOT, temporary / "engine.log")
        assert "canonical engine, scoring, clocks and transitions asserted" in engine
        evidence = json.loads(engine.strip().splitlines()[0])
        assert evidence["rotationOutcomes"]["rotations"] == 672
        assert len(evidence["spinFacings"]) == 8
        print(engine.strip(), flush=True)
        if not args.engine_only:
            browser(copy, temporary)
        if args.review:
            input(f"Review evidence in {temporary}; press Enter to delete it: ")
    print("All disposable copies, evidence and owned server/browser groups removed.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
