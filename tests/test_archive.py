from __future__ import annotations

from pathlib import Path
import unittest

from scripts import benchmark

ROOT = Path("/Users/someone/projects/tetris-llm-benchmark")
WORKSPACE = "/Users/someone/tetris-bench/runs/abc123/tetris"


def run(run_id: str = "m-high", workspace: str = WORKSPACE) -> dict:
    return {"id": run_id, "harness": "t3_codex", "t3_thread_id": f"thread-{run_id}", "expected_cwd": workspace}


class ArchiveTests(unittest.TestCase):
    def setUp(self) -> None:
        self.states = {"thread-m-high": {"project_id": "p1", "workspace_root": WORKSPACE, "archived_at": None, "settled_at": None,
                                        "thread_archived_at": None}}
        self.sent: list[tuple[list[str], list[str], list[str]]] = []

    def finish(self, root, t3_home, threads, projects, archive_threads):
        self.sent.append((threads, projects, archive_threads))
        for state in self.states.values():
            state["settled_at"] = state["settled_at"] or "2026-11-19T12:00:00Z"
            state["archived_at"] = state["archived_at"] or "2026-11-19T12:00:01Z"
            state["thread_archived_at"] = state["thread_archived_at"] or "2026-11-19T12:00:02Z"

    def archive(self, runs: list[dict], scored: tuple[str, ...] = ("m-high",)) -> list[str]:
        ranking = {"entries": [{"run_id": run_id} for run_id in scored]}
        return benchmark.archive_runs(ROOT, runs, ranking, Path("/t3"), self.finish, lambda _, thread: self.states.get(thread))

    def test_settles_and_archives_a_scored_run_and_reads_both_back(self) -> None:
        lines = self.archive([run()])
        self.assertEqual(self.sent, [(["thread-m-high"], ["p1"], ["thread-m-high"])])
        self.assertIn("project p1 archived", lines[0])

    def test_an_already_finished_run_sends_nothing(self) -> None:
        self.states["thread-m-high"].update(settled_at="x" * 19, archived_at="y" * 19, thread_archived_at="z" * 19)
        self.archive([run()])
        self.assertEqual(self.sent, [])

    def test_a_run_archived_before_threads_were_archives_only_its_thread(self) -> None:
        self.states["thread-m-high"].update(settled_at="x" * 19, archived_at="y" * 19)
        self.archive([run()])
        self.assertEqual(self.sent, [([], [], ["thread-m-high"])])

    def test_an_unscored_run_is_refused(self) -> None:
        with self.assertRaisesRegex(benchmark.BenchmarkError, "not scored"):
            self.archive([run()], scored=())
        self.assertEqual(self.sent, [])

    def test_a_project_that_is_not_the_runs_own_workspace_is_refused(self) -> None:
        self.states["thread-m-high"]["workspace_root"] = str(ROOT)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "not its own workspace"):
            self.archive([run()])
        self.assertEqual(self.sent, [])

    def test_a_change_t3_does_not_show_is_reported(self) -> None:
        with self.assertRaisesRegex(benchmark.BenchmarkError, "does not show"):
            benchmark.archive_runs(
                ROOT, [run()], {"entries": [{"run_id": "m-high"}]}, Path("/t3"),
                lambda *args: None, lambda _, thread: self.states.get(thread),
            )


if __name__ == "__main__":
    unittest.main()
