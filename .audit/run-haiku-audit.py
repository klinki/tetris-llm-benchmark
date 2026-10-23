#!/usr/bin/env python3
"""Build/test/probe all three Haiku runs in disposable isolated copies."""

import argparse
import json
import os
from pathlib import Path
import signal
import shutil
import socket
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
EFFORTS = ("high", "xhigh", "max")


def browser_audit(copy: Path, effort: str, temporary: Path, args) -> None:
    """Use the supplied server behavior, changing only max's hard-coded port."""
    port = None
    for candidate in range(41000, 50000):
        try:
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", candidate))
            port = candidate
            break
        except OSError:
            continue
    if port is None:
        raise RuntimeError("No free audit port in 41000–49999")
    if effort == "max":
        server_file = copy / "scripts/serve.mjs"
        source = server_file.read_text()
        if "const PORT = 8321;" not in source:
            raise RuntimeError("Max server changed; review the temporary port substitution")
        server_file.write_text(source.replace("const PORT = 8321;", f"const PORT = {port};"))
    session = f"haiku-{effort}-{temporary.name}"

    def cli(*arguments):
        command = [args.playwright_cli, f"--session={session}", *arguments]
        result = subprocess.run(command, cwd=temporary, text=True, capture_output=True, timeout=60)
        with (temporary / f"{effort}-browser.log").open("a") as browser_log:
            browser_log.write(result.stdout + result.stderr)
        if result.returncode or "### Error" in result.stdout:
            raise RuntimeError(result.stdout + result.stderr)
        return result.stdout

    with (temporary / f"{effort}-server.log").open("w") as log:
        server = subprocess.Popen(["npm", "start"], cwd=copy,
                                  env={**os.environ, "PORT": str(port)},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if server.poll() is not None:
                    raise RuntimeError("Audit server exited; inspect its temporary log")
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=0.1):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise RuntimeError("Audit server did not listen within 30 seconds")
                    time.sleep(0.1)
            opening = ["open", f"http://localhost:{port}/?audit={effort}"]
            if args.playwright_config:
                opening.append(f"--config={args.playwright_config}")
            cli(*opening)
            cli("run-code", f"--filename={ROOT / '.audit/haiku-browser.cjs'}")
            output = cli("eval", "window.__tetrisAudit")
            if "### Result\n" not in output:
                raise RuntimeError("Browser audit returned no result: " + output)
            data, _ = json.JSONDecoder().raw_decode(output.split("### Result\n", 1)[1].lstrip())
            if not isinstance(data, dict) or data.get("mode") != effort:
                raise RuntimeError("Browser snippet did not finish all assertions: " + output)
            print(f"{effort} Chromium {data['browser']}: browser assertions passed; "
                  f"phone document width {data['mobile']['documentWidth']}", flush=True)
        finally:
            try:
                cli("close")
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
    parser.add_argument("--browser", action="store_true", help="Also run the Chromium desktop/phone probe")
    parser.add_argument("--playwright-cli", default=shutil.which("playwright-cli") or str(
        Path.home() / ".codex/skills/playwright/scripts/playwright_cli.sh"))
    parser.add_argument("--playwright-config", type=lambda p: str(Path(p).resolve()),
                        help="Playwright CLI browser launch configuration")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="tetris-haiku-audit-") as temporary:
        for effort in EFFORTS:
            project = f"claude-haiku-5-5-{effort}"
            copy = Path(temporary) / project
            shutil.copytree(ROOT / project, copy,
                            ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"))
            commands = [
                ["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []),
                ["npm", "test"],
                ["node", str(ROOT / ".audit/haiku-audit.mjs"), str(copy), effort],
            ]
            for command in commands:
                print(f"$ {' '.join(command)}", flush=True)
                result = subprocess.run(command, cwd=copy)
                if result.returncode:
                    return result.returncode
            if args.browser:
                browser_audit(copy, effort, Path(temporary), args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
