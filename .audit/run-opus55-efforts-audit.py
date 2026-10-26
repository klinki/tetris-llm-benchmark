#!/usr/bin/env python3
"""Build, test and probe the three Opus 5.5 efforts in disposable copies, including Chromium."""

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
EFFORTS = ("low", "high", "xhigh")
# Unchanged fixed-random/sequence suites; assertion counts are not case counts.
OWN_TESTS = {"low": "11 tests passed", "high": "ℹ pass 12", "xhigh": "16/16 tests passed"}


def free_port() -> int:
    for candidate in range(41000, 50000):
        try:
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", candidate))
            return candidate
        except OSError:
            continue
    raise RuntimeError("No free audit port in 41000–49999")


def run(command, cwd: Path, log: Path) -> str:
    print(f"$ {' '.join(command)}", flush=True)
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=180)
    output = result.stdout + result.stderr
    log.write_text(output)
    if result.returncode:
        print(output, flush=True)
        raise SystemExit(result.returncode)
    return output


def browser_audit(copy: Path, effort: str, temporary: Path, args) -> None:
    port = free_port()
    log_path = temporary / f"{effort}-server.log"
    with log_path.open("w") as log:
        server = subprocess.Popen(["npm", "start"], cwd=copy, env={**os.environ, "PORT": str(port)},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if server.poll() is not None:
                    raise RuntimeError("Audit server exited: " + log_path.read_text())
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=0.1):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise RuntimeError("Audit server did not listen within 30 seconds")
                    time.sleep(0.1)
            command = ["node", str(ROOT / ".audit/opus55-efforts-browser.cjs"), f"http://localhost:{port}/", effort]
            if args.artifacts_dir:
                args.artifacts_dir.mkdir(parents=True, exist_ok=True)
                command.append(str(args.artifacts_dir))
            output = run(command, ROOT, temporary / f"{effort}-browser.log")
            data = json.loads(output.strip().splitlines()[-1])
            if data.get("mode") != effort or set(data["views"]) != {"desktop", "mobile"}:
                raise RuntimeError("Browser assertions did not complete: " + output)
            print(f"{effort} Chromium {data['browser']}: desktop/390×844 assertions passed", flush=True)
            if args.artifacts_dir:
                (args.artifacts_dir / f"opus55-efforts-{effort}.json").write_text(json.dumps(data, indent=2) + "\n")
        finally:
            try:
                os.killpg(server.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(server.pid, signal.SIGKILL)
                server.wait()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    parser.add_argument("--engine-only", action="store_true", help="Explicitly skip browser checks")
    parser.add_argument("--artifacts-dir", type=lambda p: Path(p).resolve(),
                        help="Optionally retain screenshots and browser JSON outside the checkout")
    parser.add_argument("--effort", choices=EFFORTS, help="Audit one effort while rechecking probes")
    args = parser.parse_args()
    if args.artifacts_dir and args.artifacts_dir.is_relative_to(ROOT):
        parser.error("--artifacts-dir must be outside the checkout")
    with tempfile.TemporaryDirectory(prefix="tetris-opus55-efforts-audit-") as directory:
        temporary = Path(directory)
        for effort in ((args.effort,) if args.effort else EFFORTS):
            project = f"claude-opus-5-5-{effort}"
            copy = temporary / project
            shutil.copytree(ROOT / project, copy, ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"))
            run(["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []), copy,
                temporary / f"{effort}-install.log")
            run(["npm", "run", "build"], copy, temporary / f"{effort}-build.log")
            output = run(["npm", "test"], copy, temporary / f"{effort}-test.log")
            expected = OWN_TESTS[effort]
            if expected not in output or (effort == "high" and "ℹ fail 0" not in output):
                raise RuntimeError(f"{effort}: expected own-test marker {expected!r}\n{output}")
            print(f"{effort}: own suite passed ({expected})", flush=True)
            engine = run(["node", str(ROOT / ".audit/opus55-efforts-audit.mjs"), str(copy), effort], ROOT,
                         temporary / f"{effort}-engine.log")
            if "canonical engine, scoring, clocks and transitions asserted" not in engine:
                raise RuntimeError("Engine assertions did not complete")
            print(engine.strip().splitlines()[-1], flush=True)
            if args.artifacts_dir:
                args.artifacts_dir.mkdir(parents=True, exist_ok=True)
                (args.artifacts_dir / f"{effort}-engine.log").write_text(engine)
            if not args.engine_only:
                browser_audit(copy, effort, temporary, args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
