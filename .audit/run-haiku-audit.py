#!/usr/bin/env python3
"""Build/test/probe Claude Haiku 5.5 (high) in a disposable isolated copy."""

import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PROJECT = "claude-haiku-5-5-high"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="tetris-haiku-audit-") as temporary:
        copy = Path(temporary) / PROJECT
        shutil.copytree(ROOT / PROJECT, copy,
                        ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"))
        commands = [
            ["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else []),
            ["npm", "test"],
            ["node", str(ROOT / ".audit/haiku-audit.mjs"), str(copy)],
        ]
        for command in commands:
            print(f"$ {' '.join(command)}", flush=True)
            result = subprocess.run(command, cwd=copy)
            if result.returncode:
                return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
