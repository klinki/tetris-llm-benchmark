from __future__ import annotations

import dataclasses
from contextlib import closing
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

from scripts import benchmark, results_site


def write_jsonl(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(entry) + "\n" for entry in entries))


def empty_ranking() -> dict:
    return {
        "schema_version": 1,
        "weights": {"correctness": 40, "tests": 20, "code": 20, "simplicity": 10, "browser_ux": 10},
        "entries": [],
    }


def ranking_entry(run_id: str, correctness: float, tests: float, *severities: str) -> dict:
    return {
        "run_id": run_id,
        "audited": "2026-10-23",
        "scores": {"correctness": correctness, "tests": tests, "code": 8.0, "simplicity": 8.0, "browser_ux": 8.0},
        "bugs": [{"severity": severity, "title": "Bug", "detail": "Detail."} for severity in severities],
        "summary": f"{run_id} finding",
    }


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


class PiCollectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".pi"
        self.session_id = "fixture-pi-session"
        self.session_path = (
            self.home / "agent" / "sessions" / "--tmp-fixture-pi--"
            / f"run_{self.session_id}.jsonl"
        )
        self.run = {
            "id": "fixture-pi",
            "label": "Fixture PI",
            "project_dir": "fixture-pi",
            "harness": "pi",
            "harness_label": "PI",
            "provider": "fixture-provider",
            "provider_label": "fixture-provider",
            "model": "fixture-model",
            "session_id": self.session_id,
            "expected_cwd_basename": "fixture-pi",
            "cutoff": {"through_user_message": 1, "exclude_inter_message_wait": True},
            "overhead": {"kind": "none"},
        }
        usage_one = {
            "input": 10, "cacheRead": 20, "cacheWrite": 0, "output": 5,
            "reasoning": 3, "totalTokens": 35, "cost": {"total": 0.1},
        }
        usage_two = {
            "input": 7, "cacheRead": 30, "cacheWrite": 0, "output": 8,
            "reasoning": 6, "totalTokens": 45, "cost": {"total": 0.2},
        }
        entries = [
            {"type": "session", "version": 3, "id": self.session_id,
             "timestamp": "2026-01-01T00:00:00.000Z", "cwd": "/tmp/fixture-pi"},
            {"type": "message", "timestamp": "2026-01-01T00:00:01.000Z", "message": {
                "role": "user", "content": [{"type": "text", "text": "Implement it"}],
            }},
            {"type": "message", "timestamp": "2026-01-01T00:00:02.000Z", "message": {
                "role": "assistant", "provider": "fixture-provider", "model": "fixture-model",
                "usage": usage_one, "stopReason": "toolUse",
                "content": [{"type": "thinking"}, {"type": "toolCall", "name": "write"}],
            }},
            {"type": "message", "timestamp": "2026-01-01T00:00:02.100Z", "message": {
                "role": "toolResult", "isError": True, "content": [{"type": "text", "text": "failed"}],
            }},
            {"type": "message", "timestamp": "2026-01-01T00:00:04.000Z", "message": {
                "role": "assistant", "provider": "fixture-provider", "model": "fixture-model",
                "usage": usage_two, "stopReason": "stop", "content": [{"type": "text", "text": "Done"}],
            }},
        ]
        write_jsonl(self.session_path, entries)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_collects_exact_jsonl_session_and_per_response_usage(self) -> None:
        result = benchmark.collect_pi(self.run, self.home)
        self.assertEqual(dataclasses.astuple(result.tested)[:5], (17, 50, 0, 13, 80))
        self.assertAlmostEqual(result.tested.cost, 0.3)
        self.assertEqual(result.overhead.total, 0)
        self.assertEqual(result.active_elapsed_ms, 3_000)
        self.assertEqual(result.included_phases[0].responses, 2)
        self.assertEqual(result.included_phases[0].tool_calls, 1)
        self.assertEqual(result.included_phases[0].tool_errors, 1)
        report = benchmark.render_statistics(result)
        self.assertIn("## Normalized PI output", report)
        self.assertIn("Session storage: append-only PI JSONL", report)
        self.assertIn("Reasoning output subset: 9 (already included in Output)", report)
        self.assertIn("| 17 | 50 | 0 | 13 | **80** |", report)

    def test_rejects_reasoning_larger_than_output(self) -> None:
        entries = benchmark.read_jsonl(self.session_path)
        entries[2]["message"]["usage"]["reasoning"] = 6
        write_jsonl(self.session_path, entries)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "subset of output"):
            benchmark.collect_pi(self.run, self.home)

    def test_rejects_unsupported_usage_schema(self) -> None:
        entries = benchmark.read_jsonl(self.session_path)
        del entries[2]["message"]["usage"]["cacheRead"]
        write_jsonl(self.session_path, entries)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "Unsupported PI usage schema"):
            benchmark.collect_pi(self.run, self.home)

    def test_rejects_ambiguous_session(self) -> None:
        duplicate = self.session_path.with_name(f"duplicate_{self.session_id}.jsonl")
        duplicate.write_text(self.session_path.read_text())
        with self.assertRaisesRegex(benchmark.BenchmarkError, "found 2"):
            benchmark.collect_pi(self.run, self.home)


class T3CollectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".t3"
        self.database = self.home / "userdata" / "statev2.sqlite"
        self.database.parent.mkdir(parents=True)
        self.run = {
            "id": "fixture-t3", "label": "Fixture T3", "project_dir": "fixture-t3",
            "harness": "t3_opencode", "harness_label": "T3 Code / OpenCode",
            "provider": "fixture-provider", "provider_label": "fixture-provider",
            "model": "fixture-model", "session_id": "native-session",
            "t3_thread_id": "app-thread", "expected_cwd": "/tmp/fixture-t3",
            "expected_cwd_basename": "fixture-t3", "reasoning_variant": "xhigh",
            "cutoff": {"through_user_message": 1, "exclude_inter_message_wait": True},
            "overhead": {"kind": "unknown"},
        }
        self.provider = {
            "nativeThreadRef": {"nativeId": "native-session"},
            "nativeMetadata": {"modelSelection": {
                "model": "fixture-provider/fixture-model",
                "options": [{"id": "variant", "value": "xhigh"}],
            }},
        }
        self.turn = {
            "status": "completed",
            "turnTokenUsage": {
                "inputTokens": 120, "cachedInputTokens": 80, "cacheCreationTokens": 10,
                "outputTokens": 20, "reasoningTokens": 12,
                "usageStatus": "complete", "usageScope": "main_agent", "hasSubagents": False,
            },
            # Deliberately smaller latest-request counts: using these is incorrect.
            "tokenUsage": {"inputTokens": 4, "cachedInputTokens": 2, "outputTokens": 1},
        }
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.executescript("""
                CREATE TABLE projection_projects (project_id TEXT, workspace_root TEXT);
                CREATE TABLE orchestration_v2_projection_threads (
                    thread_id TEXT, project_id TEXT, default_provider TEXT, payload_json TEXT DEFAULT '{}');
                CREATE TABLE orchestration_v2_projection_provider_threads (
                    provider_thread_id TEXT, thread_id TEXT, provider TEXT, payload_json TEXT);
                CREATE TABLE orchestration_v2_projection_provider_turns (
                    provider_turn_id TEXT, thread_id TEXT, provider_thread_id TEXT,
                    payload_json TEXT, status TEXT, completed_at TEXT, ordinal INTEGER);
                CREATE TABLE orchestration_v2_projection_messages (
                    message_id TEXT, thread_id TEXT, role TEXT, created_at TEXT, payload_json TEXT);
                INSERT INTO projection_projects VALUES ('project', '/tmp/fixture-t3');
                INSERT INTO orchestration_v2_projection_threads (thread_id, project_id, default_provider)
                    VALUES ('app-thread', 'project', 'opencode');
                INSERT INTO orchestration_v2_projection_messages VALUES
                    ('user-1', 'app-thread', 'user', '2026-01-01T00:00:01.000Z', '{}'),
                    ('assistant-1', 'app-thread', 'assistant', '2026-01-01T00:00:03.900Z', '{}'),
                    ('unrelated-user', 'unrelated-thread', 'user', '2026-01-01T00:00:01.000Z', '{}');
            """)
            connection.execute(
                "INSERT INTO orchestration_v2_projection_provider_threads VALUES (?,?,?,?)",
                ("provider-thread", "app-thread", "opencode", json.dumps(self.provider)),
            )
            connection.execute(
                "INSERT INTO orchestration_v2_projection_provider_turns VALUES (?,?,?,?,?,?,?)",
                ("turn", "app-thread", "provider-thread", json.dumps(self.turn),
                 "completed", "2026-01-01T00:00:04.000Z", 1),
            )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def save_turn(self) -> None:
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute(
                "UPDATE orchestration_v2_projection_provider_turns SET payload_json=? WHERE provider_turn_id='turn'",
                (json.dumps(self.turn),),
            )

    def test_whole_turn_cache_normalization_reasoning_and_readonly_isolation(self) -> None:
        before = self.database.read_bytes()
        result = benchmark.collect_t3_opencode(self.run, self.home)
        self.assertEqual(self.database.read_bytes(), before)
        self.assertEqual(dataclasses.astuple(result.tested)[:5], (30, 80, 10, 20, 140))
        self.assertEqual(result.reasoning_output, 12)
        self.assertEqual(result.active_elapsed_ms, 3000)
        self.assertEqual(result.included_phases[0].assistant_messages, 1)
        self.assertIsNone(result.overhead)
        self.assertIsNone(result.combined)

    def test_unknown_overhead_survives_report_and_readme_rendering(self) -> None:
        result = benchmark.collect_t3_opencode(self.run, self.home)
        report = benchmark.render_statistics(result)
        report_path = Path(self.temporary.name) / "fixture-t3/STATISTICS.md"
        benchmark.check_report_arithmetic(report, report_path)
        values = benchmark.extract_report_values(report_path, report)
        self.assertEqual(values["tested"], 140)
        self.assertIsNone(values["overhead"])
        self.assertIsNone(values["combined"])
        self.assertIn("- Recorded reasoning variant: `xhigh`", report)
        self.assertIn("Model responses: Not verified", report)
        self.assertNotIn("$0.000000000", report)
        self.assertIn('"reasoningTokens": 12', report)
        pricing = {"models": {"fixture-model": {"label": "Fixture", "unpriced": "No public price."}}}
        block = benchmark.render_readme_block(
            [self.run], {self.run["id"]: report}, Path(self.temporary.name), empty_ranking(), pricing,
        )
        self.assertIn("| `xhigh` | T3 Code / OpenCode | Pending | 140 | — | 3.000s | Not ranked yet |", block)
        self.assertIn("unknown does not mean zero", block)

    def test_rejects_numeric_combined_total_with_unknown_overhead(self) -> None:
        report = benchmark.render_statistics(benchmark.collect_t3_opencode(self.run, self.home))
        before, after = report.split("## Combined recorded usage", 1)
        after = after.replace(benchmark.usage_row(None), benchmark.usage_row(benchmark.Usage()), 1)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "Unknown overhead"):
            benchmark.check_report_arithmetic(before + "## Combined recorded usage" + after, Path("report.md"))

    def test_rejects_mismatched_identity_model_directory_and_variant(self) -> None:
        for field, value, message in [
            ("session_id", "different-native-session", "Expected one T3"),
            ("t3_thread_id", "different-app-thread", "Expected one T3"),
            ("model", "different-model", "provider/model mismatch"),
            ("expected_cwd", "/different/fixture-t3", "cwd mismatch"),
            ("reasoning_variant", "low", "reasoning variant mismatch"),
        ]:
            with self.subTest(field=field):
                with self.assertRaisesRegex(benchmark.BenchmarkError, message):
                    benchmark.collect_t3_opencode({**self.run, field: value}, self.home)

    def test_rejects_partial_subagent_and_unsupported_usage(self) -> None:
        for field, value in [("usageStatus", "partial"), ("hasSubagents", True), ("reasoningTokens", 21)]:
            original = self.turn["turnTokenUsage"][field]
            self.turn["turnTokenUsage"][field] = value
            self.save_turn()
            with self.subTest(field=field), self.assertRaises(benchmark.BenchmarkError):
                benchmark.collect_t3_opencode(self.run, self.home)
            self.turn["turnTokenUsage"][field] = original
        del self.turn["turnTokenUsage"]["cachedInputTokens"]
        self.save_turn()
        with self.assertRaisesRegex(benchmark.BenchmarkError, "Unsupported T3 usage schema"):
            benchmark.collect_t3_opencode(self.run, self.home)

    def test_rejects_ambiguous_provider_turn(self) -> None:
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute("""
                INSERT INTO orchestration_v2_projection_provider_turns
                SELECT 'duplicate', thread_id, provider_thread_id, payload_json, status, completed_at, 2
                FROM orchestration_v2_projection_provider_turns WHERE provider_turn_id='turn'
            """)
        with self.assertRaisesRegex(benchmark.BenchmarkError, "found 1 messages, 0 harness notifications and 2 turns"):
            benchmark.collect_t3_opencode(self.run, self.home)

    def test_a_declared_notification_turn_is_excluded_from_usage_and_time(self) -> None:
        notice = {"notification": {"source": {"kind": "background_task"}}, "creationSource": "provider",
                  "text": "Background task completed."}
        later = {**self.turn, "turnTokenUsage": {**self.turn["turnTokenUsage"], "inputTokens": 9000}}
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute(
                "INSERT INTO orchestration_v2_projection_messages VALUES (?,?,?,?,?)",
                ("notice", "app-thread", "user", "2026-01-01T00:00:05.000Z", json.dumps(notice)),
            )
            connection.execute(
                "INSERT INTO orchestration_v2_projection_messages VALUES (?,?,?,?,?)",
                ("assistant-2", "app-thread", "assistant", "2026-01-01T00:00:09.000Z", "{}"),
            )
            connection.execute(
                "INSERT INTO orchestration_v2_projection_provider_turns VALUES (?,?,?,?,?,?,?)",
                ("later", "app-thread", "provider-thread", json.dumps(later),
                 "completed", "2026-01-01T00:00:10.000Z", 2),
            )
        with self.assertRaisesRegex(benchmark.BenchmarkError, "1 harness notifications and 2 turns"):
            benchmark.collect_t3_opencode(self.run, self.home)
        declared = {**self.run, "t3_notification_turns": [{"ordinal": 2, "message": "Background task completed."}]}
        result = benchmark.collect_t3_opencode(declared, self.home)
        self.assertEqual(result.tested.total, 140)
        self.assertEqual(result.end_ms - result.start_ms, 3000)
        self.assertEqual(result.phases[0].assistant_messages, 1)
        self.assertIn('Excluded turn 2: started by the harness notification "Background task completed."',
                      benchmark.render_statistics(result))

    def test_claude_sdk_effective_effort_is_validated_from_matching_log(self) -> None:
        self.run.update({
            "harness": "t3_claude", "harness_label": "T3 Code / Claude Agent SDK",
            "t3_provider_instance": "claudeAgent_custom", "provider": "claudeAgent",
            "provider_label": "Claude Agent SDK", "reasoning_variant": "medium", "fast_mode": False,
        })
        app_thread = {"modelSelection": {"model": "fixture-model", "options": [{"id": "fastMode", "value": False}]}}
        self.provider["nativeMetadata"] = None
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute(
                "UPDATE orchestration_v2_projection_threads SET default_provider=?,payload_json=?",
                ("claudeAgent_custom", json.dumps(app_thread)),
            )
            connection.execute(
                "UPDATE orchestration_v2_projection_provider_threads SET provider=?,payload_json=?",
                ("claudeAgent_custom", json.dumps(self.provider)),
            )
        log = self.home / "userdata/logs/provider/events.app-thread.log"
        log.parent.mkdir(parents=True)
        request = {"event": {"payload": {"type": "query.open", "options": {
            "sessionId": "native-session", "model": "fixture-model", "cwd": "/tmp/fixture-t3",
            "effort": "medium", "settings": {"fastMode": False},
        }}}}
        log.write_text("[2026-01-01T00:00:01.100Z] NTIVE: " + json.dumps(request) + "\n")
        result = benchmark.collect_t3_opencode(self.run, self.home)
        self.assertEqual(result.tested.total, 140)
        self.assertIn("- Fast mode: off", benchmark.render_statistics(result))
        with self.assertRaisesRegex(benchmark.BenchmarkError, "SDK effort mismatch"):
            benchmark.collect_t3_opencode({**self.run, "reasoning_variant": "high"}, self.home)
        log.unlink()
        with self.assertRaisesRegex(benchmark.BenchmarkError, "No matching Claude SDK"):
            benchmark.collect_t3_opencode(self.run, self.home)

    def test_recorded_parent_usage_is_separate_and_lineage_is_required(self) -> None:
        self.run["expected_task_cwd"] = "/tmp/fixture-t3"
        self.run["t3_parent"] = {
            "thread_id": "parent-thread", "session_id": "parent-session", "expected_turns": 2,
            "model_alias": "fixture-provider/fixture-model", "reasoning_variant": "xhigh",
        }
        parent = json.loads(json.dumps(self.provider))
        parent["nativeThreadRef"]["nativeId"] = "parent-session"
        app_thread = {"lineage": {"parentThreadId": "parent-thread"}}
        prompt = {"text": "Work in /tmp/fixture-t3", "senderThreadId": "parent-thread"}
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute(
                "UPDATE orchestration_v2_projection_threads SET payload_json=? WHERE thread_id='app-thread'",
                (json.dumps(app_thread),),
            )
            connection.execute(
                "UPDATE orchestration_v2_projection_messages SET payload_json=? WHERE message_id='user-1'",
                (json.dumps(prompt),),
            )
            connection.execute(
                "INSERT INTO orchestration_v2_projection_provider_threads VALUES (?,?,?,?)",
                ("parent-provider-thread", "parent-thread", "opencode", json.dumps(parent)),
            )
            for ordinal in (1, 2):
                connection.execute(
                    "INSERT INTO orchestration_v2_projection_provider_turns VALUES (?,?,?,?,?,?,?)",
                    (f"parent-turn-{ordinal}", "parent-thread", "parent-provider-thread", json.dumps(self.turn),
                     "completed", "2026-01-01T00:00:05.000Z", ordinal),
                )
        result = benchmark.collect_t3_opencode(self.run, self.home)
        self.assertEqual(result.tested.total, 140)
        self.assertIsNone(result.overhead)
        self.assertEqual(len(result.raw_overhead_events), 2)
        report = benchmark.render_statistics(result)
        self.assertIn("Parent orchestration (2 turns) | 60 | 160 | 20 | 40 | **280**", report)
        self.assertIn("Tested agent plus recorded parent (lower bound) | 90 | 240 | 30 | 60 | **420**", report)
        benchmark.check_report_arithmetic(report, Path("fixture.md"))
        with closing(sqlite3.connect(self.database)) as connection, connection:
            connection.execute(
                "UPDATE orchestration_v2_projection_threads SET payload_json='{}' WHERE thread_id='app-thread'"
            )
        with self.assertRaisesRegex(benchmark.BenchmarkError, "parent lineage mismatch"):
            benchmark.collect_t3_opencode(self.run, self.home)


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

    def test_registered_missing_lockfile_and_build_failure_are_checked_both_ways(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            project = root / "fixture"
            project.mkdir()

            def write(exit_code: int) -> None:
                (project / "package.json").write_text(json.dumps({
                    "name": "fixture", "version": "1.0.0",
                    "scripts": {"test": f"node -e \"process.exit({exit_code})\""},
                }))

            run = {"id": "fixture", "project_dir": "fixture"}
            write(0)
            with self.assertRaisesRegex(benchmark.BenchmarkError, "missing package-lock.json"):
                benchmark.validate_project(root, run)
            benchmark.validate_project(root, {**run, "missing_lockfile": True})
            failing = {**run, "missing_lockfile": True, "known_build_failure": "tsc type errors"}
            with self.assertRaisesRegex(benchmark.BenchmarkError, "npm test passed"):
                benchmark.validate_project(root, failing)
            write(1)
            benchmark.validate_project(root, failing)
            benchmark.validate_project(root, {**run, "missing_lockfile": True, "known_test_failure": "bag test"})
            with self.assertRaisesRegex(benchmark.BenchmarkError, "failed npm test"):
                benchmark.validate_project(root, {**run, "missing_lockfile": True})


class RankingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.runs = [{"id": "a", "label": "Run A"}, {"id": "b", "label": "Run B"}, {"id": "c", "label": "Run C"}]

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def load(self, ranking: dict) -> dict:
        (self.root / "ranking.json").write_text(json.dumps(ranking))
        return benchmark.load_ranking(self.root, self.runs)

    def test_weighted_scores_are_exact_and_ties_break_on_correctness(self) -> None:
        ranking = empty_ranking()
        # A and B both weigh 8.20; B wins on correctness. C is lower.
        ranking["entries"] = [
            ranking_entry("a", 8.0, 9.0),
            ranking_entry("b", 8.5, 8.0, "minor"),
            ranking_entry("c", 9.5, 4.5),
        ]
        ranked = benchmark.ranked_entries(self.load(ranking))
        self.assertEqual(
            [(rank, entry["run_id"], str(score)) for rank, entry, score in ranked],
            [(1, "b", "8.20"), (2, "a", "8.20"), (3, "c", "7.90")],
        )
        table = benchmark.render_ranking_table(self.runs, ranking)
        self.assertIn("| Rank | Implementation | Correctness (40%) | Tests (20%) |", table)
        self.assertIn("| 1 | Run B | 8.5 | 8.0 | 8.0 | 8.0 | 8.0 | **8.20** | 1 minor |", table)
        self.assertIn("| 2 | Run A | 8.0 | 9.0 | 8.0 | 8.0 | 8.0 | **8.20** | 0 |", table)

    def test_rejects_invalid_rankings(self) -> None:
        cases = [
            ("unregistered", [ranking_entry("missing", 8.0, 8.0)], None, "unregistered run"),
            ("duplicate", [ranking_entry("a", 8.0, 8.0), ranking_entry("a", 7.0, 7.0)], None, "more than once"),
            ("quarter point", [ranking_entry("a", 8.25, 8.0)], None, "half point"),
            ("severity", [ranking_entry("a", 8.0, 8.0, "severe")], None, "bugs need a severity"),
            ("weights", [], {"correctness": 50, "tests": 20, "code": 20, "simplicity": 10, "browser_ux": 10},
             "summing to 100"),
        ]
        for name, entries, weights, message in cases:
            with self.subTest(name):
                ranking = empty_ranking()
                ranking["entries"] = entries
                if weights:
                    ranking["weights"] = weights
                with self.assertRaisesRegex(benchmark.BenchmarkError, message):
                    self.load(ranking)

    def test_ranking_block_requires_markers(self) -> None:
        block = f"{benchmark.RANKING_START}\nnew\n{benchmark.RANKING_END}"
        replaced = benchmark.replace_marked_block(
            f"Intro\n{benchmark.RANKING_START}\nold\n{benchmark.RANKING_END}\nRest\n",
            benchmark.RANKING_START, benchmark.RANKING_END, block, "RANKING.md",
        )
        self.assertEqual(replaced, f"Intro\n{block}\nRest\n")
        with self.assertRaisesRegex(benchmark.BenchmarkError, "markers are missing"):
            benchmark.replace_marked_block("No markers", benchmark.RANKING_START, benchmark.RANKING_END, block, "RANKING.md")


class PricingTests(unittest.TestCase):
    FAMILIES = [{"name": "OpenAI", "tiers": ["Sol", "Luna"]}]
    PRICED = {
        "label": "GPT-5.6 Luna",
        "family": "OpenAI", "tier": "Luna", "version": "5.6",
        "prices": {"input": 0.20, "cache_read": 0.02, "cache_write": None, "output": 1.20},
        "evidence": "recorded",
        "source": "https://example.com/pricing",
        "note": "Fixture.",
    }

    def load(self, models: dict, runs: list[dict]) -> dict:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "pricing.json").write_text(json.dumps({"schema_version": 1, "families": self.FAMILIES, "models": models}))
            return benchmark.load_pricing(root, runs)

    def test_every_model_needs_a_listed_family_tier_and_numeric_version(self) -> None:
        run = [{"id": "a", "model": "m"}]
        self.load({"m": self.PRICED}, run)
        for change, message in [
            ({"family": "Unknown"}, "family and tier"),
            ({"tier": "Terra"}, "family and tier"),
            ({"version": "five"}, "numeric version"),
        ]:
            with self.subTest(change=change), self.assertRaisesRegex(benchmark.BenchmarkError, message):
                self.load({"m": {**self.PRICED, **change}}, run)

    def test_estimate_reproduces_a_harness_recorded_cost(self) -> None:
        # Luna OMP's tokens; OMP recorded $0.171229440 for them.
        tokens = {"input": 135_570, "cache_read": 4_998_912, "cache_write": 0, "output": 36_781}
        cost = benchmark.estimate_cost(tokens, self.PRICED)
        self.assertAlmostEqual(cost["total"], 0.17122944, places=8)
        self.assertAlmostEqual(cost["parts"]["cache_read"], 0.09997824, places=8)
        self.assertEqual(benchmark.format_cost(cost), "$0.17")
        self.assertEqual(benchmark.format_cost(None), "—")
        self.assertEqual(benchmark.format_cost({"total": 0.004}), "<$0.01")

    def test_tokens_without_a_price_fail_instead_of_counting_as_free(self) -> None:
        tokens = {"input": 1, "cache_read": 0, "cache_write": 5, "output": 1}
        with self.assertRaisesRegex(benchmark.BenchmarkError, "no cache_write price"):
            benchmark.estimate_cost(tokens, self.PRICED)
        self.assertIsNone(benchmark.estimate_cost(tokens, {"label": "Stealth", "unpriced": "Free."}))

    def test_rejects_missing_or_malformed_prices(self) -> None:
        run = {"id": "luna", "model": "gpt-5.6-luna"}
        cases = [
            ("missing model", {}, "no entry for gpt-5.6-luna"),
            ("null input", {"gpt-5.6-luna": {**self.PRICED, "prices": {**self.PRICED["prices"], "input": None}}},
             "only cache_write may be null"),
            ("evidence", {"gpt-5.6-luna": {**self.PRICED, "evidence": "guess"}}, "needs a source and evidence"),
            ("both", {"gpt-5.6-luna": {**self.PRICED, "unpriced": "Free."}}, "either give prices"),
        ]
        for name, models, message in cases:
            with self.subTest(name), self.assertRaisesRegex(benchmark.BenchmarkError, message):
                self.load(models, [run])
        self.assertIn("gpt-5.6-luna", self.load({"gpt-5.6-luna": self.PRICED}, [run])["models"])


class SiteTests(unittest.TestCase):
    def test_root_relative_urls_become_relative_and_are_recorded(self) -> None:
        original = (
            '<link rel="stylesheet" href="/styles.css">\n'
            "<script type=\"module\" src='/dist/main.js'></script>\n"
            '<a href="//cdn.example/x.js">cdn</a> <script src="dist/other.js"></script>'
        )
        text, rewritten = results_site.relativize_urls(original)
        self.assertEqual(rewritten, ["/styles.css", "/dist/main.js"])
        self.assertIn('href="./styles.css"', text)
        self.assertIn("src='./dist/main.js'", text)
        self.assertIn('href="//cdn.example/x.js"', text)
        self.assertIn('src="dist/other.js"', text)

    def test_audit_markdown_is_escaped_and_links_point_at_the_repository(self) -> None:
        rendered = results_site.inline_markdown(
            "[`isTSpin`](sol-omp/src/game.ts) returns <b>true</b>; see [docs](https://example.com).",
            "https://github.com/owner/repo",
        )
        self.assertIn(
            '<a href="https://github.com/owner/repo/blob/main/sol-omp/src/game.ts"><code>isTSpin</code></a>', rendered,
        )
        self.assertIn("&lt;b&gt;true&lt;/b&gt;", rendered)
        self.assertIn('<a href="https://example.com">docs</a>', rendered)
        self.assertEqual(results_site.inline_markdown("[x](a.ts)", None), "x")

    def test_output_directory_must_be_empty_or_previously_generated(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary) / "out"
            out.mkdir()
            (out / "keep.txt").write_text("not ours")
            with self.assertRaisesRegex(results_site.SiteError, "Refusing to replace"):
                results_site.prepare_output(out)
            self.assertTrue((out / "keep.txt").exists())
            (out / "keep.txt").unlink()
            results_site.prepare_output(out)
            (out / "stale.html").write_text("old build")
            results_site.prepare_output(out)
            self.assertFalse((out / "stale.html").exists())

    def test_durations_round_trip(self) -> None:
        for milliseconds in (133_321, 2_651_418, 3_723_004, 999):
            self.assertEqual(benchmark.parse_duration(benchmark.duration(milliseconds)), milliseconds)

    def test_github_heading_anchor(self) -> None:
        self.assertEqual(results_site.github_slug("1. Opus 5.5 — 9.05"), "1-opus-55--905")


if __name__ == "__main__":
    unittest.main()
