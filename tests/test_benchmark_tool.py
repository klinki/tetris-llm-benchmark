from __future__ import annotations

import dataclasses
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

from scripts import benchmark


def write_jsonl(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(entry) + "\n" for entry in entries))


def event(timestamp: str, payload_type: str, **payload: object) -> dict:
    return {
        "timestamp": timestamp,
        "type": "event_msg",
        "payload": {"type": payload_type, **payload},
    }


class CodexCollectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".codex"
        self.run = {
            "id": "fixture-codex",
            "label": "Fixture Codex",
            "project_dir": "fixture-codex",
            "harness": "codex",
            "harness_label": "Codex Desktop",
            "provider": "openai",
            "provider_label": "OpenAI",
            "model": "fixture-model",
            "session_id": "root-session",
            "expected_cwd_basename": "fixture-codex",
            "cutoff": {"through_user_message": 2, "exclude_inter_message_wait": True},
            "overhead": {"kind": "codex_guardian", "session_ids": ["guardian-session"]},
        }
        total_one = {
            "input_tokens": 100,
            "cached_input_tokens": 40,
            "cache_write_input_tokens": 0,
            "output_tokens": 10,
            "reasoning_output_tokens": 6,
            "total_tokens": 110,
        }
        total_two = {
            "input_tokens": 200,
            "cached_input_tokens": 80,
            "cache_write_input_tokens": 0,
            "output_tokens": 30,
            "reasoning_output_tokens": 17,
            "total_tokens": 230,
        }
        root_entries = [
            {"timestamp": "2026-01-01T00:00:00.000Z", "type": "session_meta", "payload": {
                "id": "root-session", "parent_thread_id": None, "cwd": "/tmp/fixture-codex", "model_provider": "openai"
            }},
            {"timestamp": "2026-01-01T00:00:00.050Z", "type": "turn_context", "payload": {"model": "fixture-model"}},
            event("2026-01-01T00:00:01.000Z", "user_message"),
            {"timestamp": "2026-01-01T00:00:01.100Z", "type": "response_item", "payload": {"type": "custom_tool_call", "name": "exec", "call_id": "one"}},
            {"timestamp": "2026-01-01T00:00:01.200Z", "type": "response_item", "payload": {"type": "custom_tool_call_output", "call_id": "one"}},
            event("2026-01-01T00:00:01.300Z", "agent_message"),
            event("2026-01-01T00:00:02.000Z", "token_count", info={"total_token_usage": total_one}),
            event("2026-01-01T00:00:02.100Z", "task_complete"),
            event("2026-01-01T00:00:10.000Z", "user_message"),
            {"timestamp": "2026-01-01T00:00:10.100Z", "type": "response_item", "payload": {"type": "function_call", "name": "wait", "call_id": "two"}},
            {"timestamp": "2026-01-01T00:00:10.200Z", "type": "response_item", "payload": {"type": "function_call_output", "call_id": "two"}},
            event("2026-01-01T00:00:10.300Z", "agent_message"),
            event("2026-01-01T00:00:12.000Z", "token_count", info={"total_token_usage": total_two}),
            event("2026-01-01T00:00:12.500Z", "task_complete"),
        ]
        guardian_usage = {
            "input_tokens": 50,
            "cached_input_tokens": 20,
            "cache_write_input_tokens": 0,
            "output_tokens": 5,
            "reasoning_output_tokens": 4,
            "total_tokens": 55,
        }
        guardian_entries = [
            {"timestamp": "2026-01-01T00:00:05.000Z", "type": "session_meta", "payload": {
                "id": "guardian-session", "parent_thread_id": "root-session", "cwd": "/tmp/fixture-codex", "model_provider": "openai"
            }},
            event("2026-01-01T00:00:05.100Z", "user_message"),
            event("2026-01-01T00:00:06.000Z", "token_count", info={"total_token_usage": guardian_usage}),
            event("2026-01-01T00:00:06.100Z", "task_complete"),
        ]
        write_jsonl(self.home / "sessions" / "root-root-session.jsonl", root_entries)
        write_jsonl(self.home / "sessions" / "guardian-guardian-session.jsonl", guardian_entries)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_collects_cumulative_usage_without_double_counting_reasoning(self) -> None:
        result = benchmark.collect_codex(self.run, self.home)
        self.assertEqual(result.tested, benchmark.Usage(120, 80, 0, 30, 230, 0))
        self.assertEqual(result.overhead.total, 55)
        self.assertEqual(result.combined.total, 285)
        self.assertEqual(result.active_elapsed_ms, 3_600)
        self.assertEqual(result.excluded_wait_ms, 7_900)
        self.assertEqual(sum(phase.tool_calls for phase in result.included_phases), 2)
        report = benchmark.render_statistics(result)
        self.assertIn('"reasoning_output_tokens": 17', report)
        self.assertIn("| 120 | 80 | 0 | 30 | **230** |", report)
        golden = Path(__file__).parent / "fixtures" / "codex-statistics.md"
        self.assertEqual(report, golden.read_text())

    def test_rejects_guardian_with_wrong_parent(self) -> None:
        guardian = self.home / "sessions" / "guardian-guardian-session.jsonl"
        entries = benchmark.read_jsonl(guardian)
        entries[0]["payload"]["parent_thread_id"] = "another-root"
        write_jsonl(guardian, entries)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "does not belong"):
            benchmark.collect_codex(self.run, self.home)

    def test_rejects_ambiguous_root_session(self) -> None:
        source = self.home / "sessions" / "root-root-session.jsonl"
        duplicate = self.home / "sessions" / "duplicate-root-session.jsonl"
        duplicate.write_text(source.read_text())
        with self.assertRaisesRegex(benchmark.BenchmarkError, "found 2"):
            benchmark.collect_codex(self.run, self.home)

    def test_rejects_model_mismatch(self) -> None:
        self.run["model"] = "wrong-model"
        with self.assertRaisesRegex(benchmark.BenchmarkError, "model mismatch"):
            benchmark.collect_codex(self.run, self.home)


class OmpCollectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".omp"
        self.home.mkdir(parents=True)
        database = sqlite3.connect(self.home / "stats.db")
        database.executescript("""
            CREATE TABLE messages (
              session_file TEXT, folder TEXT, model TEXT, provider TEXT,
              timestamp INTEGER, duration REAL, input_tokens INTEGER,
              output_tokens INTEGER, cache_read_tokens INTEGER,
              cache_write_tokens INTEGER, total_tokens INTEGER,
              cost_total REAL, error_message TEXT
            );
            CREATE TABLE user_messages (session_file TEXT, timestamp INTEGER);
            CREATE TABLE tool_calls (
              session_file TEXT, timestamp INTEGER, tool_name TEXT,
              result_chars INTEGER, is_error INTEGER
            );
        """)
        self.session = "/tmp/-projects-fixture-omp/run-omp-session.jsonl"
        database.executemany(
            "INSERT INTO user_messages VALUES (?, ?)",
            [(self.session, 1_500), (self.session, 5_100), (self.session, 20_100)],
        )
        messages = [
            (self.session, "-projects-fixture-omp", "fixture-model", "fixture-provider", 1_499, 501, 10, 5, 20, 0, 35, 0.1, None),
            (self.session, "-projects-fixture-omp", "fixture-model", "fixture-provider", 5_098, 902, 7, 3, 30, 0, 40, 0.2, None),
            (self.session, "-projects-fixture-omp", "fixture-model", "fixture-provider", 20_098, 402, 1, 1, 40, 0, 42, 0.3, None),
        ]
        database.executemany("INSERT INTO messages VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", messages)
        tools = [
            (self.session, 1_499, "read", 10, 0),
            (self.session, 5_098, "write", 20, 1),
            (self.session, 20_098, "edit", 30, 0),
        ]
        database.executemany("INSERT INTO tool_calls VALUES (?,?,?,?,?)", tools)
        database.commit()
        database.close()
        title_entries = [
            {"timestamp": "1970-01-01T00:00:02.100Z", "message": "title-generator: success", "sessionId": "omp-session", "usage": {
                "input": 2, "output": 1, "cacheRead": 0, "cacheWrite": 0, "totalTokens": 3, "cost": {"total": 0.01}
            }},
            {"timestamp": "1970-01-01T00:00:05.900Z", "message": "title-generator: success", "sessionId": "omp-session", "usage": {
                "input": 3, "output": 2, "cacheRead": 0, "cacheWrite": 0, "totalTokens": 5, "cost": {"total": 0.02}
            }},
        ]
        write_jsonl(self.home / "logs" / "omp.log", title_entries)
        self.run = {
            "id": "fixture-omp",
            "label": "Fixture OMP",
            "project_dir": "fixture-omp",
            "harness": "omp",
            "harness_label": "OMP",
            "provider": "fixture-provider",
            "provider_label": "fixture-provider",
            "model": "fixture-model",
            "session_id": "omp-session",
            "expected_cwd_basename": "fixture-omp",
            "cutoff": {"through_user_message": 2, "exclude_inter_message_wait": True},
            "overhead": {"kind": "omp_titles", "expected_count": 2},
            "append_only": "inactive",
            "phase_labels": ["Inspect", "Implement", "Docs"],
            "phase_notes": ["Fixture note."],
        }

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_collects_exact_session_phases_and_titles(self) -> None:
        result = benchmark.collect_omp(self.run, self.home)
        self.assertEqual(dataclasses.astuple(result.tested)[:5], (17, 50, 0, 8, 75))
        self.assertAlmostEqual(result.tested.cost, 0.3)
        self.assertEqual(dataclasses.astuple(result.overhead)[:5], (5, 0, 0, 3, 8))
        self.assertAlmostEqual(result.overhead.cost, 0.03)
        self.assertEqual(result.combined.total, 83)
        self.assertEqual(result.active_elapsed_ms, 1_400)
        self.assertEqual(result.excluded_wait_ms, 3_100)
        self.assertEqual(result.phases[1].tool_errors, 1)
        report = benchmark.render_statistics(result)
        self.assertIn("## Excluded follow-up phases (non-primary)", report)
        self.assertIn("| Docs | 0.400s", report)
        golden = Path(__file__).parent / "fixtures" / "omp-statistics.md"
        self.assertEqual(report, golden.read_text())

    def test_missing_title_overhead_fails_closed(self) -> None:
        (self.home / "logs" / "omp.log").write_text("")
        with self.assertRaisesRegex(benchmark.BenchmarkError, "Expected 2 title events"):
            benchmark.collect_omp(self.run, self.home)

    def test_rejects_unsupported_database_schema(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "stats.db"
            connection = sqlite3.connect(path)
            connection.execute("CREATE TABLE messages (session_file TEXT)")
            connection.commit()
            connection.close()
            with self.assertRaisesRegex(benchmark.BenchmarkError, "Unsupported OMP schema"):
                benchmark.open_omp_database(path)


class RenderingAndValidationTests(unittest.TestCase):
    def test_readme_markers_are_deterministic(self) -> None:
        original = "# Benchmark\n\n## Results\n\nIntro.\n\n| Run | Harness | Elapsed | X |\n|---|---|---|---|\n| old | old | old | old |\n\nOld note.\n\n## Token accounting\n\nKeep me.\n"
        block = f"{benchmark.README_START}\nnew\n{benchmark.README_END}"
        once = benchmark.replace_readme_block(original, block)
        twice = benchmark.replace_readme_block(once, block)
        self.assertEqual(once, twice)
        self.assertIn("## Token accounting\n\nKeep me.", once)

    def test_isolated_npm_validation_does_not_create_dist_in_source(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "fixture"
            project.mkdir()
            (project / "package.json").write_text(json.dumps({
                "name": "fixture", "version": "1.0.0", "scripts": {"test": "node -e \"process.exit(0)\""}
            }))
            (project / "package-lock.json").write_text(json.dumps({
                "name": "fixture", "version": "1.0.0", "lockfileVersion": 3,
                "requires": True, "packages": {"": {"name": "fixture", "version": "1.0.0"}}
            }))
            benchmark.validate_project(root, {"id": "fixture", "project_dir": "fixture"})
            self.assertFalse((project / "node_modules").exists())
            self.assertFalse((project / "dist").exists())


if __name__ == "__main__":
    unittest.main()
