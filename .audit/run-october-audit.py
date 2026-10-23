#!/usr/bin/env python3
"""Build/test the October imports and run their regression probes in temporary copies."""

from concurrent.futures import ThreadPoolExecutor
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

PROJECTS = ("beam", "cat-jam", "gemini-4", "nemotron", "space-bunny")
ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Require npm's existing package cache")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="tetris-october-audit-") as temporary:
        copies = Path(temporary)
        for project in PROJECTS:
            shutil.copytree(
                ROOT / project, copies / project,
                ignore=shutil.ignore_patterns("node_modules", "dist", "dist-test", ".git"),
            )

        def validate(project: str) -> tuple[str, int, str]:
            commands = [["npm", "ci", "--ignore-scripts"]]
            if args.offline:
                commands[0].append("--offline")
            commands.append(["npm", "test"])
            if project == "nemotron":
                commands.append([
                    "./node_modules/.bin/tsc", "--module", "commonjs",
                    "--moduleResolution", "node", "--outDir", "audit-cjs",
                ])
            output = []
            for command in commands:
                result = subprocess.run(
                    command, cwd=copies / project, text=True,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                )
                output.append(f"$ {' '.join(command)}\n{result.stdout}")
                if result.returncode:
                    return project, result.returncode, "\n".join(output)
            return project, 0, "\n".join(output)

        with ThreadPoolExecutor(max_workers=5) as executor:
            results = list(executor.map(validate, PROJECTS))
        for project, status, output in results:
            print(f"{project}: {'PASS' if status == 0 else 'FAIL'}\n{output}")
        if any(status for _, status, _ in results):
            return 1
        return subprocess.run(
            ["node", str(ROOT / ".audit/october-audit.mjs"), str(copies)],
            cwd=ROOT,
        ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
