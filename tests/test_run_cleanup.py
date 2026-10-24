from __future__ import annotations

import os
from pathlib import Path
import tempfile
import time
import unittest

from unittest import mock

from scripts import benchmark, run_cleanup
from scripts.run_cleanup import Process

WORKSPACE = Path("/Users/someone/tetris-bench/runs/abc123/tetris")


def table(*processes: Process) -> dict[int, Process]:
    return {process.pid: process for process in processes}


class LeftoverTests(unittest.TestCase):
    def setUp(self) -> None:
        self.t3 = Process(10, 1, "/Applications/T3 Code (Beta).app/Contents/MacOS/T3 Code (Beta)", "/")
        self.opencode = Process(20, 10, "/opt/homebrew/bin/opencode serve --hostname=127.0.0.1 --port=58507", "/")
        self.server = Process(30, 20, "node server.mjs", str(WORKSPACE), [8321])
        self.claude = Process(40, 10, "claude --output-format stream-json --verbose", str(WORKSPACE))
        self.codex_helper = Process(50, 1, "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl", str(WORKSPACE))
        self.elsewhere = Process(60, 1, "node app.js", "/Users/someone/projects/other", [3000])
        self.processes = table(self.t3, self.opencode, self.server, self.claude, self.codex_helper, self.elsewhere)

    def test_only_non_harness_processes_in_the_workspace_are_leftovers(self) -> None:
        self.assertEqual(run_cleanup.leftovers(self.processes, [WORKSPACE]), [self.server])

    def test_a_notifying_harness_parent_is_stopped_before_its_child(self) -> None:
        order = run_cleanup.stop_order(self.processes, [self.server])
        self.assertEqual(order, [self.opencode, self.server])

    def test_stop_skips_processes_that_already_exited(self) -> None:
        killed = []

        def kill(pid: int, _signal: int) -> None:
            if pid == 30:
                raise ProcessLookupError
            killed.append(pid)

        lines = run_cleanup.stop([self.opencode, self.server], kill=kill, pause=0)
        self.assertEqual(killed, [20])
        self.assertEqual(len(lines), 1)

    def test_listeners_on_game_ports_exclude_the_operating_system(self) -> None:
        airplay = Process(70, 1, "/System/Library/CoreServices/ControlCenter.app/Contents/MacOS/ControlCenter", "/", [5000])
        found = run_cleanup.foreign_listeners(table(self.server, self.elsewhere, airplay))
        self.assertEqual(found, [self.server, self.elsewhere])


class PreflightTests(unittest.TestCase):
    def test_stops_benchmark_servers_and_only_reports_others(self) -> None:
        root = Path("/Users/someone/projects/tetris-llm-benchmark")
        archived = Process(1, 0, "node server.js", "/Users/someone/tetris-bench/archive/abc/tetris", [8321])
        repo_run = Process(2, 0, "node server.js", str(root / "opus-5.5"), [8322])
        audit = Process(3, 0, "node server.mjs", str(root), [41000])
        mine = Process(4, 0, "node app.js", "/Users/someone/projects/other", [3000])
        processes = table(archived, repo_run, audit, mine)
        stopped = []
        with mock.patch.object(run_cleanup, "list_processes", return_value=processes), \
                mock.patch.object(run_cleanup, "stop", side_effect=lambda found: stopped.extend(found) or []):
            lines = benchmark.preflight(root, [{"project_dir": "opus-5.5"}], Path("/Users/someone/tetris-bench/runs"))
        self.assertEqual(stopped, [archived, repo_run])
        self.assertEqual(len(lines), 1)
        self.assertIn("port 3000", lines[0])


class ScratchTests(unittest.TestCase):
    def test_removes_entries_created_during_the_run_and_keeps_older_ones(self) -> None:
        with tempfile.TemporaryDirectory(dir="/tmp") as temporary:
            old = Path(temporary) / "old.log"
            old.write_text("before")
            time.sleep(0.01)
            started = time.time() + 10  # everything that exists now predates this "run"
            lines = run_cleanup.remove_scratch([str(old), "/etc/hosts", "/tmp/does-not-exist"], started)
            self.assertTrue(old.exists())
            self.assertEqual(len(lines), 1)
            self.assertIn("kept", lines[0])
            lines = run_cleanup.remove_scratch([str(old)], started - 60)
            self.assertFalse(old.exists())
            self.assertIn("removed", lines[0])
            self.assertTrue(os.path.exists("/etc/hosts"))


if __name__ == "__main__":
    unittest.main()
