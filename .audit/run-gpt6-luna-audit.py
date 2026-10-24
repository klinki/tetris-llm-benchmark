#!/usr/bin/env python3
"""Build, test and probe five GPT-6 Luna efforts in disposable copies, including Chromium."""

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
EFFORTS = ("low", "medium", "high", "xhigh", "max")


def chromium_config(temporary: Path, explicit: str | None) -> str | None:
    if explicit:
        return explicit
    # Reuse a locally installed Chromium, without downloading a browser or
    # touching a user's browser profile. Otherwise use the CLI's default.
    caches = [Path.home() / "Library/Caches/ms-playwright",
              Path.home() / ".cache/ms-playwright"]
    for cache in caches:
        for build in sorted(cache.glob("chromium-*"), reverse=True):
            binaries = list(build.glob("chrome-*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"))
            binaries += list(build.glob("chrome-*/chrome"))
            if binaries:
                config = temporary / "playwright.json"
                config.write_text(json.dumps({"browser": {"browserName": "chromium", "launchOptions": {
                    "channel": "chromium", "headless": True, "executablePath": str(binaries[0])}}}))
                return str(config)
    return None


def browser_audit(copy: Path, effort: str, temporary: Path, args) -> None:
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
    session = f"gpt6-luna-{effort}-{temporary.name}"

    def cli(*arguments):
        result = subprocess.run([args.playwright_cli, f"--session={session}", *arguments],
                                cwd=temporary, text=True, capture_output=True, timeout=60)
        with (temporary / f"{effort}-browser.log").open("a") as log:
            log.write(result.stdout + result.stderr)
        if result.returncode or "### Error" in result.stdout:
            raise RuntimeError(result.stdout + result.stderr)
        return result.stdout

    with (temporary / f"{effort}-server.log").open("w") as log:
        # Only the disposable low server's port literal is adapted. Routing/MIME
        # and application source stay unchanged.
        if effort == "low":
            server_path = copy / "server.mjs"
            server_path.write_text(server_path.read_text().replace(".listen(8321,", ".listen(Number(process.env.PORT),"))
        # Medium has no emitted game and its own ESM server uses require().
        # A static diagnostic pass serves its unchanged HTML/CSS only. It is
        # deliberately not a playable game or a workaround scored as delivery.
        command = ["python3", "-m", "http.server", str(port), "--bind", "127.0.0.1"] if effort == "medium" else ["npm", "start"]
        server = subprocess.Popen(command, cwd=copy,
                                  env={**os.environ, "PORT": str(port)},
                                  stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            deadline = time.monotonic() + 30
            while True:
                if server.poll() is not None:
                    raise RuntimeError("Audit server exited: " + (temporary / f"{effort}-server.log").read_text())
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=0.1):
                        break
                except OSError:
                    if time.monotonic() > deadline:
                        raise RuntimeError("Audit server did not listen within 30 seconds")
                    time.sleep(0.1)
            opening = ["open", f"http://localhost:{port}/?audit={effort}"]
            config = chromium_config(temporary, args.playwright_config)
            if config:
                opening.append(f"--config={config}")
            cli(*opening)
            cli("snapshot")
            cli("run-code", f"--filename={ROOT / '.audit/gpt6-luna-browser.cjs'}")
            output = cli("eval", "window.__tetrisAudit")
            if "### Result\n" not in output:
                raise RuntimeError("Browser returned no audit result: " + output)
            data, _ = json.JSONDecoder().raw_decode(output.split("### Result\n", 1)[1].lstrip())
            if not isinstance(data, dict) or data.get("mode") != effort:
                raise RuntimeError("Browser assertions did not complete: " + output)
            print(f"{effort} Chromium {data['browser']}: desktop/mobile assertions passed; "
                  f"phone document width {data['mobile']['documentWidth']}", flush=True)
            if args.artifacts_dir:
                args.artifacts_dir.mkdir(parents=True, exist_ok=True)
                (args.artifacts_dir / f"gpt6-luna-{effort}.json").write_text(json.dumps(data, indent=2) + "\n")
                for viewport in ("desktop", "mobile"):
                    shutil.copy2(temporary / f"gpt6-luna-{effort}-{viewport}.png", args.artifacts_dir)
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
    parser.add_argument("--engine-only", action="store_true", help="Explicitly skip browser checks")
    parser.add_argument("--playwright-cli", default=shutil.which("playwright-cli") or str(
        Path.home() / ".codex/skills/playwright/scripts/playwright_cli.sh"))
    parser.add_argument("--playwright-config", type=lambda p: str(Path(p).resolve()))
    parser.add_argument("--artifacts-dir", type=lambda p: Path(p).resolve(),
                        help="Optionally retain screenshots and browser JSON outside the checkout")
    parser.add_argument("--effort", choices=EFFORTS, help="Audit one effort while developing/rechecking probes")
    args = parser.parse_args()
    if args.artifacts_dir and args.artifacts_dir.is_relative_to(ROOT):
        parser.error("--artifacts-dir must be outside the checkout")
    with tempfile.TemporaryDirectory(prefix="tetris-gpt6-luna-audit-") as directory:
        temporary = Path(directory)
        for effort in ((args.effort,) if args.effort else EFFORTS):
            project = f"gpt-6-luna-{effort}"
            copy = temporary / project
            shutil.copytree(ROOT / project, copy,
                            ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".test-dist", "build", ".git"))
            commands = [
                ["npm", "install" if effort == "medium" else "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []),
                ["npm", "run", "build"],
                ["npm", "test"],
                ["node", str(ROOT / ".audit/gpt6-luna-audit.mjs"), str(copy), effort],
            ]
            for index, command in enumerate(commands):
                print(f"$ {' '.join(command)}", flush=True)
                result = subprocess.run(command, cwd=copy, text=True, capture_output=True)
                output = result.stdout + result.stderr
                (temporary / f"{effort}-command-{index}.log").write_text(output)
                if effort == "medium" and index in (1, 2):
                    assert result.returncode != 0, "Medium unexpectedly builds/tests"
                    assert output.count("error TS") == 113, output
                    assert not (copy / "dist").exists(), "Medium unexpectedly emitted a game"
                    print("medium: expected 113 TypeScript errors; no dist emitted", flush=True)
                elif effort == "xhigh" and index == 2:
                    assert result.returncode != 0 and "the 7-bag queue gives every piece once per bag" in output
                    assert "pass 2" in output and "fail 1" in output, output
                    print("xhigh: expected own bag assertion failure; 2 pass, 1 fail", flush=True)
                elif result.returncode:
                    print(output, flush=True)
                    return result.returncode
                else:
                    print(output, flush=True)
            if effort == "medium":
                assert not (ROOT / project / "package-lock.json").exists()
                result = subprocess.run(["node", "server.js"], cwd=copy, text=True, capture_output=True, timeout=15)
                assert result.returncode != 0 and "require is not defined in ES module scope" in result.stderr
                print("medium: own server independently fails with ESM require error", flush=True)
            if not args.engine_only:
                browser_audit(copy, effort, temporary, args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
