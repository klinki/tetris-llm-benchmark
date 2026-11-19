from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest import mock

from scripts import benchmark, t3_runs


class ReleaseLockTests(unittest.TestCase):
    """A run's lock may only be lifted once the run is over, or by a command that ends it."""

    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        (self.root / ".bench").mkdir()
        (self.root / ".bench" / t3_runs.LOCK_STATE).write_text("[]\n")
        self.t3_home = self.root / "t3"

    def tearDown(self) -> None:
        self.directory.cleanup()

    def release(self, command: str, live: list[str], force: bool = False) -> None:
        with mock.patch.object(benchmark, "live_runs", return_value=live):
            benchmark.release_lock(self.root, self.t3_home, command, force)

    def test_a_finished_run_is_unlocked_by_any_command(self) -> None:
        self.release("render", [])
        self.assertFalse(t3_runs.lock_active(self.root))

    def test_commands_are_refused_while_a_run_is_live(self) -> None:
        for command in ("render", "verify", "site", "cleanup", "import", "preflight"):
            with self.subTest(command=command), self.assertRaises(benchmark.BenchmarkError):
                self.release(command, ["m-high-abc"])
        self.assertTrue(t3_runs.lock_active(self.root))

    def test_watch_keeps_the_lock_while_the_run_is_live(self) -> None:
        self.release("watch", ["m-high-abc"])
        self.assertTrue(t3_runs.lock_active(self.root))

    def test_discarding_or_forcing_lifts_the_lock_of_a_live_run(self) -> None:
        self.release("discard", ["m-high-abc"])
        self.assertFalse(t3_runs.lock_active(self.root))
        (self.root / ".bench" / t3_runs.LOCK_STATE).write_text("[]\n")
        self.release("render", ["m-high-abc"], force=True)
        self.assertFalse(t3_runs.lock_active(self.root))

    def test_a_run_of_unknown_state_counts_as_live(self) -> None:
        record = {"key": "m-high-abc"}
        with mock.patch.object(t3_runs, "load_pending", return_value=[record]), \
             mock.patch.object(t3_runs, "run_status", side_effect=t3_runs.RunError("no database")):
            self.assertEqual(benchmark.live_runs(self.root, self.t3_home), ["m-high-abc"])


if __name__ == "__main__":
    unittest.main()
