from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock

from scripts import benchmark, t3_runs

SESSION = "01a1f36d-cc4f-72b1-8fae-d8fb86e565dc"


def limits(five_hour: float, weekly: float, five_hour_reset: int = 1_000_000, weekly_reset: int = 2_000_000) -> dict:
    return {
        "primary": {"used_percent": five_hour, "window_minutes": 300, "resets_at": five_hour_reset},
        "secondary": {"used_percent": weekly, "window_minutes": 10080, "resets_at": weekly_reset},
        "plan_type": "plus",
    }


class CodexQuotaTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.home = Path(self.directory.name)

    def tearDown(self) -> None:
        self.directory.cleanup()

    def rollout(self, *events: tuple[str, dict]) -> None:
        path = self.home / "sessions" / "2026" / "11" / "19" / f"rollout-2026-11-19T11-50-22-{SESSION}.jsonl"
        path.parent.mkdir(parents=True)
        path.write_text("".join(
            json.dumps({"timestamp": time, "type": "event_msg", "payload": payload}) + "\n" for time, payload in events
        ))

    def test_the_benchmark_turn_is_measured_and_notification_turns_are_noted(self) -> None:
        self.rollout(
            ("2026-11-19T10:50:22.000Z", {"type": "task_started"}),
            ("2026-11-19T10:50:29.000Z", {"type": "token_count", "rate_limits": limits(0, 84)}),
            ("2026-11-19T10:58:00.000Z", {"type": "token_count", "rate_limits": limits(20, 87, 1_000_004)}),
            ("2026-11-19T11:03:29.000Z", {"type": "token_count", "rate_limits": limits(37, 90, 1_000_005)}),
            ("2026-11-19T11:03:30.000Z", {"type": "task_complete"}),
            ("2026-11-19T11:03:50.000Z", {"type": "task_started"}),
            ("2026-11-19T11:03:59.000Z", {"type": "token_count", "rate_limits": limits(38, 90)}),
        )
        quota = t3_runs.codex_quota(self.home, SESSION)
        self.assertEqual(quota["plan"], "plus")
        self.assertEqual(
            [(window["name"], window["used_percent_start"], window["used_percent_end"]) for window in quota["windows"]],
            [("5-hour", 0, 37), ("Weekly", 84, 90)],
        )
        self.assertIn("3 snapshots in turn 1, 10:50:29Z to 11:03:29Z", quota["source"])
        self.assertIn("through turn 2", quota["note"])
        self.assertIn("5-hour 38%", quota["note"])
        self.assertNotIn("reset during the run", quota["note"])

    def test_a_window_that_resets_mid_run_is_flagged(self) -> None:
        self.rollout(
            ("2026-11-19T10:50:22.000Z", {"type": "task_started"}),
            ("2026-11-19T10:50:29.000Z", {"type": "token_count", "rate_limits": limits(95, 84)}),
            ("2026-11-19T11:03:29.000Z", {"type": "token_count", "rate_limits": limits(4, 85, 1_018_000)}),
        )
        self.assertIn("5-hour window reset during the run", t3_runs.codex_quota(self.home, SESSION)["note"])

    def test_a_session_without_snapshots_has_no_quota(self) -> None:
        self.rollout(("2026-11-19T10:50:22.000Z", {"type": "task_started"}))
        self.assertIsNone(t3_runs.codex_quota(self.home, SESSION))


class QuotaReportTests(unittest.TestCase):
    def test_a_window_past_its_reset_is_reported_empty(self) -> None:
        latest = {"at": "2026-11-19T07:19:15.529Z", **limits(66, 84, five_hour_reset=1_000, weekly_reset=9_000)}
        lines = benchmark.quota_report(latest, now=5_000)
        self.assertIn("5-hour: 0% used", lines[1])
        self.assertIn("Weekly: 84% used", lines[2])
        self.assertIn("(in 1h 06m)", lines[2])



class QuotaPlanTests(unittest.TestCase):
    NOW = 10_000

    def plan(self, five_hour: float, weekly: float, last: dict, five_hour_reset: int = 13_600, weekly_reset: int = 500_000):
        latest = limits(five_hour, weekly, five_hour_reset, weekly_reset)
        return benchmark.quota_plan(latest, self.NOW, last, max_wait=6 * 3600)

    def test_an_effort_that_fits_goes_ahead(self) -> None:
        self.assertEqual(self.plan(20, 80, {"5-hour": 10, "Weekly": 2})[0], "go")

    def test_waits_for_the_5_hour_reset_when_a_fresh_window_would_fit(self) -> None:
        action, seconds, reason = self.plan(52, 82, {"5-hour": 31, "Weekly": 5})
        self.assertEqual(action, "wait")
        self.assertEqual(seconds, 3_600 + 60)
        self.assertIn("5-hour", reason)

    def test_an_effort_larger_than_a_whole_window_stops_the_batch(self) -> None:
        # GPT-6 Astra xhigh used 37 points; three times that cannot fit even a fresh window.
        action, _, reason = self.plan(0, 84, {"5-hour": 37, "Weekly": 6})
        self.assertEqual(action, "stop")
        self.assertIn("more than a whole window", reason)

    def test_a_weekly_reset_too_far_away_stops_the_batch(self) -> None:
        action, _, reason = self.plan(10, 90, {"5-hour": 5, "Weekly": 6})
        self.assertEqual(action, "stop")
        self.assertIn("--max-quota-wait", reason)

    def test_a_window_past_its_reset_counts_as_empty(self) -> None:
        self.assertEqual(self.plan(95, 50, {"5-hour": 20, "Weekly": 1}, five_hour_reset=self.NOW - 1)[0], "go")


class RequirePriceTests(unittest.TestCase):
    PRICING = {"models": {"gpt-6-astra": {}, "gemini-4-argon-contributor": {}}}

    def test_a_priced_model_passes_with_or_without_its_provider(self) -> None:
        benchmark.require_price(self.PRICING, "gpt-6-astra")
        benchmark.require_price(self.PRICING, "opencode-go/gemini-4-argon-contributor")

    def test_an_unpriced_model_is_refused_before_the_run(self) -> None:
        with self.assertRaises(benchmark.BenchmarkError):
            benchmark.require_price(self.PRICING, "gpt-7")


if __name__ == "__main__":
    unittest.main()
