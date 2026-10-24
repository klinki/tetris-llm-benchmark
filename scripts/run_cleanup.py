"""Clean up around benchmark runs: scratch files, leftover servers, and the ports they hold.

Every run on this machine shares /tmp and local ports, so whatever one run leaves behind can be
found, or hold a port, when the next one starts. The decisions here take a process table as
input, so they can be tested without touching real processes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import os
from pathlib import Path
import shutil
import signal
import subprocess
import time
from typing import Callable, Iterable

# The harness's own processes run in the workspace too; T3 manages them and restarts them on demand.
AGENT_COMMANDS = {"claude", "codex", "opencode"}
AGENT_PREFIXES = ("/Applications/ChatGPT.app/", "/Applications/T3 Code")
# Harness processes that turn the end of a background child into a new turn ("Background task
# completed."), so they are stopped before their leftover children.
NOTIFYING_PARENTS = ("opencode serve --hostname=127.0.0.1", "claude --output-format stream-json")
# Ports agents commonly serve a game on; anything else listening there is reported before a run.
COMMON_PORTS = (3000, 4173, 5000, 5173, 8000, 8080, 8321, 8322, 8399)


@dataclass
class Process:
    pid: int
    ppid: int
    command: str
    cwd: str | None = None
    ports: list[int] = field(default_factory=list)


def is_agent(process: Process) -> bool:
    executable = process.command.split(" ", 1)[0]
    return (
        Path(executable).name in AGENT_COMMANDS
        or "stream-json" in process.command
        or process.command.startswith(AGENT_PREFIXES)
    )


def inside(path: str | None, roots: Iterable[Path]) -> bool:
    if not path:
        return False
    resolved = Path(os.path.normpath(path))
    return any(resolved == root or root in resolved.parents for root in roots)


def leftovers(processes: dict[int, Process], roots: Iterable[Path]) -> list[Process]:
    """Processes, other than the harness's own, whose working directory is under one of the roots."""
    roots = [Path(os.path.normpath(root)) for root in roots]
    return [process for process in processes.values() if inside(process.cwd, roots) and not is_agent(process)]


def stop_order(processes: dict[int, Process], targets: list[Process]) -> list[Process]:
    """The targets, each preceded by any notifying harness process above it."""
    ordered: list[Process] = []
    for target in targets:
        parent = processes.get(target.ppid)
        seen = set()
        while parent and parent.pid not in seen:
            seen.add(parent.pid)
            if any(pattern in parent.command for pattern in NOTIFYING_PARENTS) and parent not in ordered:
                ordered.append(parent)
            parent = processes.get(parent.ppid)
    ordered.extend(target for target in targets if target not in ordered)
    return ordered


def stop(processes: list[Process], kill: Callable[[int, int], None] = os.kill, pause: float = 1.0) -> list[str]:
    lines = []
    for process in processes:
        try:
            kill(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            continue  # already gone, e.g. a child of a harness process stopped just before
        ports = f" (port {', '.join(map(str, process.ports))})" if process.ports else ""
        lines.append(f"stopped {process.pid}{ports}: {process.command[:120]}")
        if any(pattern in process.command for pattern in NOTIFYING_PARENTS):
            time.sleep(pause)
    return lines


def remove_scratch(places: Iterable[str], started: float) -> list[str]:
    """Remove /tmp entries a run named, unless they existed before it started."""
    lines = []
    for place in sorted(set(places)):
        if not place.startswith("/tmp/"):
            continue
        path = Path(place)
        if not os.path.lexists(path):
            continue
        status = path.lstat()
        # Creation time where the platform records it (macOS); otherwise the last status change (Linux).
        if getattr(status, "st_birthtime", status.st_ctime) < started - 5:
            lines.append(f"kept {place}: it existed before the run started")
            continue
        if path.is_dir() and not path.is_symlink():
            shutil.rmtree(path)
        else:
            path.unlink()
        lines.append(f"removed {place}")
    return lines


def foreign_listeners(processes: dict[int, Process], ports: Iterable[int] = COMMON_PORTS) -> list[Process]:
    """Processes listening on a common game port, other than the operating system's own (e.g. AirPlay on 5000)."""
    wanted = set(ports)
    return [
        process for process in processes.values()
        if wanted.intersection(process.ports) and not process.command.startswith(("/System/", "/usr/libexec/"))
    ]


def _lsof(arguments: list[str]) -> dict[int, list[str]]:
    output = subprocess.run(["lsof", "-nP", *arguments, "-Fpn"], capture_output=True, text=True).stdout
    names: dict[int, list[str]] = {}
    pid = None
    for line in output.splitlines():
        if line.startswith("p"):
            pid = int(line[1:])
        elif line.startswith("n") and pid is not None:
            names.setdefault(pid, []).append(line[1:])
    return names


def list_processes() -> dict[int, Process]:
    """Every process with its parent, command, working directory, and listening TCP ports."""
    output = subprocess.run(["ps", "-axo", "pid=,ppid=,command="], capture_output=True, text=True).stdout
    processes = {}
    for line in output.splitlines():
        parts = line.split(None, 2)
        if len(parts) == 3:
            processes[int(parts[0])] = Process(int(parts[0]), int(parts[1]), parts[2])
    for pid, names in _lsof(["-a", "-d", "cwd"]).items():
        if pid in processes:
            processes[pid].cwd = names[0]
    for pid, names in _lsof(["-iTCP", "-sTCP:LISTEN"]).items():
        if pid in processes:
            processes[pid].ports = sorted({int(name.rsplit(":", 1)[1]) for name in names if name.rsplit(":", 1)[-1].isdigit()})
    return processes
