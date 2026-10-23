#!/usr/bin/env python3
"""Rebuild/test the Opus and Muse runs and probe them in isolated copies."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import subprocess
import tempfile

PROJECTS = ("opus5.5", "muse-spark-1.3-medium")
ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only the npm package cache")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="tetris-oct23-audit-") as temporary:
        copies = Path(temporary)
        for project in PROJECTS:
            shutil.copytree(
                ROOT / project, copies / project,
                ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"),
            )

        def validate(project: str) -> tuple[str, int, str]:
            install = ["npm", "ci", "--ignore-scripts"] + (["--offline"] if args.offline else [])
            output = []
            for command in (install, ["npm", "test"]):
                result = subprocess.run(command, cwd=copies / project, text=True,
                                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
                output.append(f"$ {' '.join(command)}\n{result.stdout}")
                if result.returncode:
                    return project, result.returncode, "\n".join(output)
            return project, 0, "\n".join(output)

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(validate, PROJECTS))
        for project, status, output in results:
            print(f"{project}: {'PASS' if status == 0 else 'FAIL'}\n{output}", flush=True)
        if any(status for _, status, _ in results):
            return 1
        return subprocess.run(["node", str(ROOT / ".audit/oct23-audit.mjs"), str(copies)], cwd=ROOT).returncode


if __name__ == "__main__":
    raise SystemExit(main())
