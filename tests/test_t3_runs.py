from __future__ import annotations

from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import stat
import tempfile
import unittest
from unittest import mock

from scripts import benchmark, t3_runs


WORKSPACE = "/Users/someone/tetris-bench/runs/abc123/tetris"


def tool_item(ordinal: int, item_type: str, **payload: object) -> tuple:
    return ("thread-1", item_type, ordinal, json.dumps({"startedAt": "2026-10-24T10:00:00.000Z", **payload}))


class OutsideAccessTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".t3"
        (self.home / "userdata").mkdir(parents=True)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def findings(self, *items: tuple) -> list[str]:
        with closing(sqlite3.connect(self.home / "userdata" / "statev2.sqlite")) as connection:
            connection.execute(
                "CREATE TABLE orchestration_v2_projection_turn_items (thread_id, type, ordinal, payload_json)"
            )
            connection.executemany("INSERT INTO orchestration_v2_projection_turn_items VALUES (?, ?, ?, ?)", items)
            connection.commit()
        return [item["reference"] for item in t3_runs.outside_access(self.home, "thread-1", WORKSPACE)]

    def test_flags_reads_listings_and_searches_outside_the_workspace(self) -> None:
        found = self.findings(
            tool_item(1, "command_execution", title="Workspace ready", input="Preparing workspace /Users/x"),
            tool_item(2, "dynamic_tool", toolName="read", input={"path": "README.md"}),
            # The run's own folder holds only the workspace, so reading `..` is not a finding.
            tool_item(3, "dynamic_tool", toolName="read", input={"path": ".."}),
            tool_item(4, "dynamic_tool", toolName="read", input={"path": "../beam/README.md"}),
            tool_item(5, "file_search", pattern="**/README.md", results=[{"fileName": "..", "preview": "x"}]),
            tool_item(6, "dynamic_tool", toolName="Read", input={"file_path": f"{WORKSPACE}/src/game.ts"}),
            tool_item(7, "command_execution", input="cd /Users/someone/projects/tetris-llm-benchmark && cat README.md"),
            tool_item(8, "dynamic_tool", toolName="Bash", input={"command": "ls ~/Documents"}),
        )
        self.assertEqual(found, [
            "../beam/README.md", "/Users/someone/projects/tetris-llm-benchmark", "~/Documents",
        ])

    def test_ignores_urls_regexes_caches_and_system_paths(self) -> None:
        found = self.findings(
            tool_item(1, "command_execution", input="curl -s http://localhost:8321/dist/main.js | head"),
            tool_item(2, "command_execution", input="sed -i 's/foo/bar/g' src/a.ts && ls ~/.npm"),
            tool_item(3, "command_execution", input="cat > /tmp/probe.mjs <<'EOF'\n// a comment\nEOF"),
            tool_item(4, "command_execution", input=f"cd {WORKSPACE} && npm test"),
            tool_item(5, "dynamic_tool", toolName="Glob", input={"pattern": "src/**/*.ts"}),
        )
        self.assertEqual(found, [])


class BenchmarkLookupTests(unittest.TestCase):
    MARKERS = ["tetris-llm-benchmark", "owner.github.io/tetris-llm-benchmark"]

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name) / ".t3"
        (self.home / "userdata").mkdir(parents=True)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def findings(self, *items: tuple) -> list[tuple[str, str]]:
        with closing(sqlite3.connect(self.home / "userdata" / "statev2.sqlite")) as connection:
            connection.execute(
                "CREATE TABLE orchestration_v2_projection_turn_items (thread_id, type, ordinal, payload_json)"
            )
            connection.executemany("INSERT INTO orchestration_v2_projection_turn_items VALUES (?, ?, ?, ?)", items)
            connection.commit()
        return [
            (item["kind"], item["reference"])
            for item in t3_runs.outside_access(self.home, "thread-1", WORKSPACE, self.MARKERS)
        ]

    def test_looking_up_the_rules_is_fine_but_looking_up_the_benchmark_is_not(self) -> None:
        found = self.findings(
            tool_item(1, "web_search", patterns=["tetris guideline SRS wall kick table"]),
            tool_item(2, "dynamic_tool", toolName="WebFetch", input={"url": "https://tetris.wiki/Super_Rotation_System"}),
            tool_item(3, "web_search", patterns=["Tetris LLM Benchmark results opus"]),
            tool_item(4, "dynamic_tool", toolName="WebFetch", input={"url": "https://owner.github.io/tetris-llm-benchmark/"}),
            tool_item(5, "command_execution", input="curl -s https://github.com/owner/tetris_llm_benchmark | head"),
        )
        self.assertEqual([kind for kind, _ in found], ["benchmark", "benchmark", "benchmark"])

    def test_a_workspace_inside_the_repository_is_not_a_lookup(self) -> None:
        workspace = Path("/Users/someone/projects/tetris-llm-benchmark/opus")
        text = f"cd {workspace} && npm test"
        self.assertIsNone(t3_runs.finding_kind("text", text, workspace, self.home, self.MARKERS))
        self.assertEqual(
            t3_runs.finding_kind("text", "cat /Users/someone/projects/tetris-llm-benchmark/RANKING.md", workspace,
                                 self.home, self.MARKERS),
            "benchmark",
        )

    def test_reading_t3_data_is_labelled(self) -> None:
        t3_data = Path("/Users/someone/.t3")
        workspace = Path(WORKSPACE)
        self.assertEqual(
            t3_runs.finding_kind("path", "/Users/someone/.t3/userdata/statev2.sqlite", workspace, t3_data, []),
            "t3-data",
        )
        self.assertEqual(t3_runs.finding_kind("path", "/Users/someone/notes.txt", workspace, t3_data, []), "path")

    def test_listing_the_runs_own_folder_is_not_a_finding(self) -> None:
        workspace = Path("/Users/someone/tetris-bench/runs/abc123/tetris")
        t3_data = Path("/Users/someone/.t3")
        self.assertIsNone(t3_runs.finding_kind("path", "/Users/someone/tetris-bench/runs/abc123", workspace, t3_data, []))
        self.assertIsNone(t3_runs.finding_kind("command", "..", workspace, t3_data, []))
        self.assertEqual(t3_runs.finding_kind("command", "../..", workspace, t3_data, []), "command")
        self.assertEqual(
            t3_runs.finding_kind("path", "/Users/someone/tetris-bench/runs", workspace, t3_data, []), "path",
        )

    def test_t3_tools_are_flagged_except_the_preview_browser_and_its_own_screenshots(self) -> None:
        own = f"{self.home}/userdata/browser-artifacts/own.png"
        other = f"{self.home}/userdata/browser-artifacts/other.png"
        # The temporary T3 home lives under a system temp folder, which the scan otherwise ignores.
        with mock.patch.object(t3_runs, "SYSTEM_PREFIXES", ("/dev/",)):
            found = self._screenshot_findings(own, other)
        self.assertEqual(found, [("t3-data", other), ("t3-tool", '{"threadId": "old-run"}')])

    def test_reading_the_background_log_opencode_announced_is_not_a_finding(self) -> None:
        own = "/Users/someone/.local/share/opencode/shell/abc/sh_1.out"
        other = "/Users/someone/.local/share/opencode/shell/abc/sh_2.out"
        found = self.findings(
            tool_item(1, "command_execution", input="npm start",
                      output=f"Command moved to the background.\nOutput is streaming to: {own}\nYou will be notified."),
            tool_item(2, "command_execution", input=f"sleep 2; cat {own}"),
            tool_item(3, "command_execution", input=f"cat {other}"),
        )
        self.assertEqual(found, [("command", other)])

    def _screenshot_findings(self, own: str, other: str) -> list[tuple[str, str]]:
        return self.findings(
            tool_item(1, "dynamic_tool", toolName="mcp__t3-code__preview_snapshot", input={"save": True},
                      output=json.dumps({"content": json.dumps({"screenshotPath": own})})),
            tool_item(2, "dynamic_tool", toolName="Read", input={"file_path": own}),
            tool_item(3, "dynamic_tool", toolName="Read", input={"file_path": other}),
            tool_item(4, "dynamic_tool", toolName="mcp__t3-code__t3_thread_read", input={"threadId": "old-run"}),
        )


class NewRunTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.root = self.base / "repo"
        self.root.mkdir()
        (self.root / "TETRIS.md").write_text("# Tetris\n")
        self.fake_t3 = self.base / "t3"
        self.fake_t3.write_text('#!/bin/sh\necho "Added project 1234-abcd (bench) at $3."\n')
        self.fake_t3.chmod(0o755)

    def tearDown(self) -> None:
        for folder, _, _ in os.walk(self.base):
            os.chmod(folder, 0o700)
        self.temporary.cleanup()

    def test_workspace_holds_only_the_task_and_cannot_see_its_neighbours(self) -> None:
        workspaces = self.base / "runs"
        with mock.patch.dict(os.environ, {"T3_BIN": str(self.fake_t3)}):
            record = t3_runs.new_run(self.root, "opencode-go/gemini-4-argon", "medium", workspaces, open_app=False)
        workspace = Path(record["workspace"])
        self.assertEqual(sorted(path.name for path in workspace.iterdir()), ["README.md"])
        self.assertEqual((workspace / "README.md").read_text(), "# Tetris\n")
        self.assertEqual(record["t3_project_id"], "1234-abcd")
        self.assertEqual(record["slug"], "gemini-4-argon-medium")
        self.assertEqual([path.name for path in workspaces.iterdir()], [workspace.parent.name])
        pending = json.loads((t3_runs.pending_dir(self.root) / f"{record['key']}.json").read_text())
        self.assertEqual(pending["expected_model"], "opencode-go/gemini-4-argon")

    def test_one_run_at_a_time_and_earlier_folders_are_archived_unlistably(self) -> None:
        workspaces = self.base / "runs"
        with mock.patch.dict(os.environ, {"T3_BIN": str(self.fake_t3)}):
            first = t3_runs.new_run(self.root, "claude-haiku-5-5", "high", workspaces, open_app=False)
            with self.assertRaisesRegex(t3_runs.RunError, "still pending"):
                t3_runs.new_run(self.root, "claude-haiku-5-5", "max", workspaces, open_app=False)
            (t3_runs.pending_dir(self.root) / f"{first['key']}.json").unlink()
            second = t3_runs.new_run(self.root, "claude-haiku-5-5", "max", workspaces, open_app=False)
        archive = self.base / t3_runs.ARCHIVE_NAME
        self.assertEqual([path.name for path in workspaces.iterdir()], [Path(second["workspace"]).parent.name])
        self.assertEqual(stat.S_IMODE(archive.stat().st_mode), 0o300)
        with self.assertRaises(PermissionError):
            list(archive.iterdir())
        self.assertTrue((archive / Path(first["workspace"]).parent.name / "tetris" / "README.md").is_file())

    def test_refuses_workspaces_inside_the_repository(self) -> None:
        # The fake t3 keeps a missed refusal from registering a real T3 project.
        with mock.patch.dict(os.environ, {"T3_BIN": str(self.fake_t3)}):
            with self.assertRaisesRegex(t3_runs.RunError, "outside the benchmark repository"):
                t3_runs.new_run(self.root, "m", "high", self.root / "runs", open_app=False)

    def test_failed_project_registration_leaves_nothing_behind(self) -> None:
        workspaces = self.base / "runs"
        with mock.patch.dict(os.environ, {"T3_BIN": "/bin/echo"}):
            with self.assertRaisesRegex(t3_runs.RunError, "Unexpected `t3 project add` output"):
                t3_runs.new_run(self.root, "m", "high", workspaces, open_app=False)
        os.chmod(workspaces, 0o700)
        self.assertEqual(list(workspaces.iterdir()), [])
        self.assertFalse(t3_runs.pending_dir(self.root).exists())


class ModelSelectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name)
        (self.home / "userdata").mkdir()
        self.write_instances({
            "opencode": {"driver": "opencode", "enabled": True},
            "claudeAgent": {"driver": "claudeAgent", "enabled": False},
            "claudeAgent_work": {"driver": "claudeAgent", "enabled": True},
        })

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_instances(self, instances: dict) -> None:
        (self.home / "userdata" / "settings.json").write_text(json.dumps({"providerInstances": instances}))

    def test_selects_the_driver_option_and_enabled_instance(self) -> None:
        self.assertEqual(t3_runs.model_selection(self.home, "opencode-go/gemini-4-argon", "medium"), {
            "instanceId": "opencode", "model": "opencode-go/gemini-4-argon",
            "options": [{"id": "variant", "value": "medium"}],
        })
        self.assertEqual(t3_runs.model_selection(self.home, "claude-opus-5-5", "high"), {
            "instanceId": "claudeAgent_work", "model": "claude-opus-5-5",
            "options": [{"id": "effort", "value": "high"}, {"id": "fastMode", "value": False}],
        })

    def test_ambiguous_or_unknown_drivers_need_an_explicit_instance(self) -> None:
        self.write_instances({
            "claude_a": {"driver": "claudeAgent", "enabled": True},
            "claude_b": {"driver": "claudeAgent", "enabled": True},
        })
        with self.assertRaisesRegex(t3_runs.RunError, "pass --instance"):
            t3_runs.model_selection(self.home, "claude-opus-5-5", "high")
        self.assertEqual(t3_runs.model_selection(self.home, "claude-opus-5-5", "high", "claude_b")["instanceId"], "claude_b")
        with self.assertRaisesRegex(t3_runs.RunError, "Cannot tell which T3 driver"):
            t3_runs.model_selection(self.home, "grok-build", "high")

    def test_codex_models_select_the_standard_service_tier(self) -> None:
        self.write_instances({"codex": {"driver": "codex", "enabled": True}})
        self.assertEqual(t3_runs.model_selection(self.home, "gpt-6-luna", "xhigh"), {
            "instanceId": "codex", "model": "gpt-6-luna",
            "options": [{"id": "reasoningEffort", "value": "xhigh"}, {"id": "serviceTier", "value": "default"}],
        })


class CodexTurnContextTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.home = Path(self.temporary.name)
        self.day = self.home / "sessions" / "2026" / "10" / "24"
        self.day.mkdir(parents=True)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_rollout(self, *contexts: dict) -> None:
        lines = [{"type": "session_meta", "payload": {"id": "abc"}}]
        lines += [{"type": "turn_context", "payload": {"turn_id": str(i), **context}} for i, context in enumerate(contexts)]
        (self.day / "rollout-2026-10-24T10-00-00-abc.jsonl").write_text("\n".join(json.dumps(line) for line in lines))

    def test_reads_the_recorded_model_effort_cwd_and_tier(self) -> None:
        context = {"model": "gpt-6-luna", "effort": "high", "cwd": "/w/tetris", "service_tier": None}
        self.write_rollout(context, context)
        self.assertEqual(t3_runs.codex_turn_context(self.home, "abc"), context)

    def test_rejects_missing_or_changing_contexts(self) -> None:
        with self.assertRaisesRegex(t3_runs.RunError, "Found 0 Codex rollouts"):
            t3_runs.codex_turn_context(self.home, "abc")
        self.write_rollout(
            {"model": "gpt-6-luna", "effort": "high", "cwd": "/w/tetris"},
            {"model": "gpt-6-luna", "effort": "low", "cwd": "/w/tetris"},
        )
        with self.assertRaisesRegex(t3_runs.RunError, "changed during session"):
            t3_runs.codex_turn_context(self.home, "abc")


class ImportTests(unittest.TestCase):
    EXISTING = {
        "id": "old", "label": "Old", "order": 10, "project_dir": "old", "harness": "t3_opencode",
        "harness_label": "T3 Code / OpenCode", "provider": "opencode-go", "provider_label": "opencode-go",
        "model": "gemini-4", "session_id": "s", "t3_thread_id": "t", "expected_cwd": "/x/old",
        "expected_cwd_basename": "old", "reasoning_variant": "medium",
        "cutoff": {"through_user_message": 1, "exclude_inter_message_wait": True}, "overhead": {"kind": "unknown"},
    }

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "repo"
        self.root.mkdir()
        self.manifest = json.dumps(
            {"schema_version": 1, "generator_version": benchmark.GENERATOR_VERSION, "runs": [self.EXISTING]}, indent=2,
        ) + "\n"
        (self.root / "benchmark-runs.json").write_text(self.manifest)
        (self.root / "ranking.json").write_text(json.dumps({
            "schema_version": 1, "entries": [],
            "weights": {"correctness": 40, "tests": 20, "code": 20, "simplicity": 10, "browser_ux": 10},
        }))
        (self.root / "pricing.json").write_text(json.dumps({"schema_version": 1, "models": {
            "gemini-4": {"label": "Gemini 4", "unpriced": "Test."},
            "claude-opus-5-5": {"label": "Claude Opus 5.5", "unpriced": "Test."},
        }}))
        self.workspace = Path(self.temporary.name) / "ws" / "tetris"
        self.workspace.mkdir(parents=True)
        (self.workspace / "package.json").write_text("{}")
        (self.workspace / "node_modules").mkdir()
        self.record = {
            "key": "claude-opus-5-5-high-abc", "slug": "claude-opus-5-5-high",
            "expected_model": "claude-opus-5-5", "expected_effort": "high", "workspace": str(self.workspace),
            "spec": {"sha256": "x", "commit": "y", "modified": False},
        }
        t3_runs.pending_dir(self.root).mkdir(parents=True)
        (t3_runs.pending_dir(self.root) / f"{self.record['key']}.json").write_text(json.dumps(self.record))
        self.identity = {
            "t3_thread_id": "thread-9", "session_id": "session-9", "driver": "claudeAgent",
            "provider_instance": "claudeAgent_claude_home", "runtime_mode": "full-access",
            "provider": "claudeAgent", "model": "claude-opus-5-5", "effort": "high", "fast_mode": False,
        }

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def run_import(self, identity: dict | None = None, findings: list | None = None, refresh=None) -> dict:
        homes = (Path("/none"),) * 4
        with mock.patch.object(benchmark.t3_runs, "run_status", return_value=("completed", "")), \
                mock.patch.object(benchmark.t3_runs, "inspect_run", return_value=identity or self.identity), \
                mock.patch.object(benchmark.t3_runs, "outside_access", return_value=findings or []), \
                mock.patch.object(benchmark.t3_runs, "notification_turns", return_value=[]), \
                mock.patch.object(benchmark, "refresh", side_effect=refresh):
            return benchmark.import_t3_run(self.root, self.record, homes, allow_outside=False, allow_approvals=False)

    def test_registers_the_run_from_t3s_own_records(self) -> None:
        entry = self.run_import()
        manifest = (self.root / "benchmark-runs.json").read_text()
        self.assertTrue(manifest.startswith(self.manifest.rsplit("\n  ]", 1)[0]))
        saved = json.loads(manifest)["runs"][-1]
        self.assertEqual(saved, entry)
        self.assertEqual(entry["id"], "claude-opus-5-5-high")
        self.assertEqual(entry["label"], "Claude Opus 5.5 (high)")
        self.assertEqual(entry["harness"], "t3_claude")
        self.assertEqual(entry["t3_provider_instance"], "claudeAgent_claude_home")
        self.assertEqual(entry["expected_cwd"], str(self.workspace))
        self.assertIs(entry["fast_mode"], False)
        self.assertEqual(entry["order"], 20)
        self.assertEqual(entry["web"], "open")
        self.assertTrue((self.root / entry["project_dir"] / "package.json").exists())
        self.assertFalse((self.root / entry["project_dir"] / "node_modules").exists())
        self.assertTrue((self.root / ".bench" / "imported" / f"{self.record['key']}.json").exists())

    def test_failed_collection_rolls_back_the_manifest_and_copy(self) -> None:
        with self.assertRaisesRegex(benchmark.BenchmarkError, "collection failed"):
            self.run_import(refresh=benchmark.BenchmarkError("collection failed"))
        self.assertEqual((self.root / "benchmark-runs.json").read_text(), self.manifest)
        self.assertFalse((self.root / "claude-opus-5-5-high").exists())
        self.assertTrue((t3_runs.pending_dir(self.root) / f"{self.record['key']}.json").exists())

    def test_refuses_a_different_model_effort_or_isolation_breach(self) -> None:
        with self.assertRaisesRegex(benchmark.BenchmarkError, "at effort medium"):
            self.run_import(identity={**self.identity, "effort": "medium"})
        with self.assertRaisesRegex(benchmark.BenchmarkError, "outside its workspace 1 time"):
            self.run_import(findings=[{"time": "2026-10-24T10:00:00Z", "tool": "read", "kind": "path", "reference": ".."}])
        with self.assertRaisesRegex(benchmark.BenchmarkError, "approvals"):
            self.run_import(identity={**self.identity, "runtime_mode": "approval-required"})
        self.assertEqual((self.root / "benchmark-runs.json").read_text(), self.manifest)


if __name__ == "__main__":
    unittest.main()
