"""Prepare isolated T3 Code workspaces for benchmark runs, follow them, and read back what ran.

This module only touches T3 through its `t3` command and a read-only view of its
database. Turning a finished run into a registered benchmark result is done by
`benchmark.py import`, which uses `inspect_run` and `outside_access` from here.
"""

from __future__ import annotations

from contextlib import closing
import datetime as dt
import glob
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import sqlite3
import subprocess
from typing import Any


# The prompt every T3 run so far has used; changing it would break comparability.
PROMPT = "Read the README.md file and implement it"
WORKSPACE_NAME = "tetris"
UNLISTABLE = 0o300
ARCHIVE_NAME = "archive"
FINISHED_TURN_STATUSES = {"completed", "failed", "interrupted"}
HARNESSES = {
    "claudeAgent": {"harness": "t3_claude", "harness_label": "T3 Code / Claude Agent SDK", "provider_label": "Claude Agent SDK"},
    "opencode": {"harness": "t3_opencode", "harness_label": "T3 Code / OpenCode"},
    "codex": {"harness": "t3_codex", "harness_label": "T3 Code / Codex", "provider_label": "Codex"},
}
COPY_IGNORE = shutil.ignore_patterns("node_modules", "dist", ".git", ".DS_Store")
PATH_KEYS = {"path", "file_path", "filePath", "fileName", "filename", "notebook_path", "cwd", "directory"}
# Shell commands and tool scripts; only tokens that clearly name a user's files are checked,
# because commands also carry URLs, regexes, and code comments.
COMMAND_KEYS = {"command", "cmd", "code", "input"}
USER_ROOTS = ("/Users/", "/home/", "/Volumes/", "/root/")
# Places a coding agent legitimately touches outside its workspace.
SYSTEM_PREFIXES = (
    "/dev/", "/usr/", "/bin/", "/sbin/", "/etc/", "/tmp/", "/private/tmp/", "/var/folders/",
    "/private/var/folders/", "/opt/", "/System/", "/Library/", "/Applications/",
)
HOME_CACHES = (".npm", ".cache", ".nvm", ".bun", ".yarn", ".pnpm-store", ".node-gyp", "Library/Caches")
# Web search queries and fetched URLs; looking up the rules is fine, looking up this benchmark is not.
WEB_KEYS = {"url", "query", "patterns"}
WEB_MODES = ("open", "blocked")
PATH_TOKEN = re.compile(r"""(?:^|(?<=[\s='"(]))((?:~|\.\.|/)[^\s'"|;&<>()`]*)""")


class RunError(RuntimeError):
    pass



def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9.]+", "-", text.lower()).strip("-")


def pending_dir(root: Path) -> Path:
    return root / ".bench" / "pending"


def connect(t3_home: Path) -> sqlite3.Connection:
    database = t3_home / "userdata" / "statev2.sqlite"
    if not database.is_file():
        raise RunError(f"T3 database does not exist: {database}")
    connection = sqlite3.connect(database.resolve().as_uri() + "?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def t3_command(*args: str) -> str:
    binary = os.environ.get("T3_BIN") or shutil.which("t3")
    if not binary:
        raise RunError("The t3 command was not found; open T3 Code once to install it, or set T3_BIN")
    process = subprocess.run([binary, *args], text=True, capture_output=True)
    if process.returncode:
        raise RunError(f"t3 {' '.join(args)} failed:\n{process.stdout}{process.stderr}")
    return process.stdout


def spec_provenance(root: Path) -> dict[str, Any]:
    spec = root / "TETRIS.md"
    try:
        commit = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=root, text=True, capture_output=True, check=True,
        ).stdout.strip()
        dirty = bool(subprocess.run(
            ["git", "status", "--porcelain", "--", "TETRIS.md"], cwd=root, text=True, capture_output=True, check=True,
        ).stdout.strip())
    except (OSError, subprocess.CalledProcessError):
        commit, dirty = None, None
    return {"sha256": hashlib.sha256(spec.read_bytes()).hexdigest(), "commit": commit, "modified": dirty}


def new_run(
    root: Path, model: str, effort: str, workspaces: Path, open_app: bool = True, register: bool = True,
) -> dict[str, Any]:
    """Create an isolated workspace holding only the task, and register it as a T3 project.

    With register=False the workspace is registered some other way, e.g. by an agent through
    T3's own tools; import finds the thread by the workspace path either way."""
    root = root.resolve()
    workspaces = workspaces.expanduser().resolve()
    if workspaces == root or root in workspaces.parents:
        raise RunError("Workspaces must live outside the benchmark repository, where other implementations are")
    # Only one run may be active: runs share /tmp and local ports, and OpenCode needs to read
    # every folder above its workspace, so the active run's folder must be the only one there.
    active = [record["key"] for record in load_pending(root) if Path(record["workspace"]).parent.parent == workspaces]
    if active:
        raise RunError(f"{', '.join(active)} is still pending; import or discard it before starting another run")
    workspaces.mkdir(parents=True, exist_ok=True)
    workspaces.chmod(0o700)
    archive = workspaces.parent / ARCHIVE_NAME
    for leftover in workspaces.iterdir():
        archive_container(leftover, archive)
    token = secrets.token_hex(6)
    container = workspaces / token
    container.mkdir()
    workspace = container / WORKSPACE_NAME
    workspace.mkdir()
    shutil.copyfile(root / "TETRIS.md", workspace / "README.md")

    slug = slugify(f"{model.split('/')[-1]}-{effort}")
    project_id = None
    if register:
        try:
            output = t3_command("project", "add", str(workspace), "--title", f"bench {slug} {token[:4]}")
            match = re.search(r"Added project (\S+)", output)
            if not match:
                raise RunError(f"Unexpected `t3 project add` output: {output}")
            project_id = match.group(1)
        except RunError:
            container.chmod(0o700)
            shutil.rmtree(container)
            raise
    record = {
        "key": f"{slug}-{token}",
        "slug": slug,
        "expected_model": model,
        "expected_effort": effort,
        # Only open mode exists so far; an isolated mode with web tools blocked is planned.
        "web": "open",
        "workspace": str(workspace),
        "archive": str(archive),
        "t3_project_id": project_id,
        "prompt": PROMPT,
        "spec": spec_provenance(root),
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
    }
    save_pending(root, record)
    if open_app and register:
        t3_command("app", str(workspace))
    return record


def archive_container(container: Path, archive: Path) -> Path:
    """Move a finished or abandoned run's folder where no later agent can list it.

    The archive's own read bit is removed: the agent runs as this user, so the folder can
    still be entered and written to, but not listed, even by the owner."""
    archive.mkdir(exist_ok=True)
    archive.chmod(UNLISTABLE)
    destination = archive / container.name
    container.chmod(0o700)
    container.rename(destination)
    return destination


def save_pending(root: Path, record: dict[str, Any]) -> None:
    pending_dir(root).mkdir(parents=True, exist_ok=True)
    (pending_dir(root) / f"{record['key']}.json").write_text(json.dumps(record, indent=2) + "\n")


EFFORT_OPTION = {"opencode": "variant", "claudeAgent": "effort", "codex": "reasoningEffort"}
# Codex service tiers that run faster at a higher price, like Claude's fast mode.
FAST_SERVICE_TIERS = {"priority", "fast"}


def model_selection(t3_home: Path, model: str, effort: str, instance: str | None = None) -> dict[str, Any]:
    """The T3 model selection for a model ID: OpenCode IDs contain a provider prefix, Claude IDs start with claude-,
    and Codex IDs with gpt-."""
    driver = ("opencode" if "/" in model else "claudeAgent" if model.startswith("claude-")
              else "codex" if model.startswith("gpt-") else None)
    if driver is None:
        raise RunError(f"Cannot tell which T3 driver runs {model}; pass --instance")
    if instance is None:
        settings = json.loads((t3_home / "userdata" / "settings.json").read_text())
        enabled = [
            name for name, config in settings.get("providerInstances", {}).items()
            if config.get("driver") == driver and config.get("enabled")
        ]
        if len(enabled) != 1:
            raise RunError(f"Found {len(enabled)} enabled T3 {driver} instances ({', '.join(enabled)}); pass --instance")
        instance = enabled[0]
    options: list[dict[str, Any]] = [{"id": EFFORT_OPTION[driver], "value": effort}]
    if driver == "claudeAgent":
        options.append({"id": "fastMode", "value": False})
    elif driver == "codex":
        options.append({"id": "serviceTier", "value": "default"})
    return {"instanceId": instance, "model": model, "options": options}


def launch_thread(
    root: Path, t3_home: Path, project_id: str, selection: dict[str, Any], prompt: str = PROMPT,
) -> str:
    """Start the thread through T3's internal API, in full-access mode with no generated title."""
    request = {
        "t3Home": str(t3_home), "projectId": project_id, "title": prompt,
        "modelSelection": selection, "prompt": prompt,
    }
    process = subprocess.run(
        ["node", str(root / "scripts" / "t3-launch.mjs")], input=json.dumps(request), text=True, capture_output=True,
    )
    if process.returncode:
        raise RunError(f"Launching through T3's API failed: {process.stderr.strip() or process.stdout.strip()}")
    return json.loads(process.stdout)["threadId"]


def copy_prompt() -> bool:
    if not shutil.which("pbcopy"):
        return False
    subprocess.run(["pbcopy"], input=PROMPT, text=True, check=True)
    return True


def load_pending(root: Path) -> list[dict[str, Any]]:
    return [json.loads(path.read_text()) for path in sorted(pending_dir(root).glob("*.json"))]


def find_pending(root: Path, key: str) -> dict[str, Any]:
    matches = [record for record in load_pending(root) if key in (record["key"], record["workspace"])]
    if len(matches) != 1:
        known = ", ".join(record["key"] for record in load_pending(root)) or "none"
        raise RunError(f"No single pending run matches {key}; pending runs: {known}")
    return matches[0]


def thread_for(connection: sqlite3.Connection, record: dict[str, Any]) -> sqlite3.Row | None:
    rows = connection.execute("""
        SELECT t.thread_id, t.runtime_mode, t.provider_instance_id, t.payload_json AS app_json
        FROM orchestration_v2_projection_threads t
        JOIN projection_projects p ON p.project_id=t.project_id
        WHERE p.workspace_root=? AND p.deleted_at IS NULL AND t.deleted_at IS NULL
    """, (record["workspace"],)).fetchall()
    if len(rows) > 1:
        raise RunError(f"{record['key']} has {len(rows)} T3 threads; a benchmark run must have exactly one")
    return rows[0] if rows else None


def is_notification(message_json: str) -> bool:
    """A user message T3 posts for the harness, e.g. "Background task completed.", not one a person sent."""
    payload = json.loads(message_json)
    return "notification" in payload and payload.get("creationSource") == "provider"


def notification_turns(t3_home: Path, thread_id: str) -> list[dict[str, Any]]:
    """Provider turns after the first, each started by a harness notification rather than a person."""
    with closing(connect(t3_home)) as connection:
        notices = [row["payload_json"] for row in connection.execute(
            "SELECT payload_json FROM orchestration_v2_projection_messages WHERE thread_id=? AND role='user' ORDER BY created_at",
            (thread_id,),
        ) if is_notification(row["payload_json"])]
        ordinals = [row["ordinal"] for row in connection.execute(
            "SELECT ordinal FROM orchestration_v2_projection_provider_turns WHERE thread_id=? ORDER BY ordinal",
            (thread_id,),
        )][1:]
    if len(notices) != len(ordinals):
        raise RunError(f"Thread {thread_id} has {len(ordinals)} later turns but {len(notices)} harness notifications")
    return [{"ordinal": ordinal, "message": json.loads(notice).get("text")} for ordinal, notice in zip(ordinals, notices)]


def run_status(t3_home: Path, record: dict[str, Any]) -> tuple[str, str]:
    """Return (state, detail) where state is waiting, running, completed, or failed."""
    with closing(connect(t3_home)) as connection:
        thread = thread_for(connection, record)
        if thread is None:
            return "waiting", "no thread yet: start one in T3 and paste the prompt"
        users = sum(not is_notification(row["payload_json"]) for row in connection.execute(
            "SELECT payload_json FROM orchestration_v2_projection_messages WHERE thread_id=? AND role='user'",
            (thread["thread_id"],),
        ))
        turns = [row["status"] for row in connection.execute(
            "SELECT status FROM orchestration_v2_projection_provider_turns WHERE thread_id=? ORDER BY ordinal",
            (thread["thread_id"],),
        )]
    if users > 1:
        return "failed", f"{users} user messages; a benchmark run allows exactly one"
    if not turns or any(status not in FINISHED_TURN_STATUSES for status in turns):
        return "running", f"thread {thread['thread_id']}"
    # Later turns can only come from harness notifications; the benchmark work is the first.
    if turns[0] != "completed":
        return "failed", f"the provider turn ended as {turns[0]}"
    return "completed", f"thread {thread['thread_id']}"


def provider_logs(t3_home: Path, thread_id: str) -> list[Path]:
    """A thread's provider event logs. T3 writes the `:` of IDs such as `mcp:<uuid>` as `-` in the file name."""
    name = thread_id.replace(":", "-")
    return sorted((t3_home / "userdata" / "logs" / "provider").glob(f"events.{glob.escape(name)}.log*"))


def claude_query(t3_home: Path, thread_id: str, session_id: str) -> dict[str, Any]:
    """The Claude Agent SDK's effective options, which T3's model selection does not store."""
    found = []
    for path in provider_logs(t3_home, thread_id):
        for line in path.read_text().splitlines():
            if '"query.open"' not in line:
                continue
            payload = json.loads(line[line.index("{"):]).get("event", {}).get("payload", {})
            options = payload.get("options", {})
            if payload.get("type") == "query.open" and options.get("sessionId") == session_id:
                found.append(options)
    if not found:
        raise RunError(f"No Claude SDK query.open record for thread {thread_id}")
    if any(options != found[0] for options in found[1:]):
        raise RunError(f"Claude SDK options changed during thread {thread_id}")
    return found[0]


def codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")).expanduser()


def codex_turn_context(home: Path, session_id: str) -> dict[str, Any]:
    """The model, effort, cwd, and service tier Codex itself recorded for a session, which T3 does not store."""
    paths = sorted((home / "sessions").glob(f"**/rollout-*-{glob.escape(session_id)}.jsonl"))
    if len(paths) != 1:
        raise RunError(f"Found {len(paths)} Codex rollouts for session {session_id} under {home}")
    contexts = []
    for line in paths[0].read_text().splitlines():
        record = json.loads(line)
        if record.get("type") == "turn_context":
            payload = record["payload"]
            contexts.append({key: payload.get(key) for key in ("model", "effort", "cwd", "service_tier")})
    if not contexts:
        raise RunError(f"No Codex turn_context record for session {session_id}")
    if any(context != contexts[0] for context in contexts[1:]):
        raise RunError(f"Codex model, effort, cwd, or service tier changed during session {session_id}")
    return contexts[0]


def inspect_run(t3_home: Path, record: dict[str, Any]) -> dict[str, Any]:
    """Read what actually ran: thread, session, driver, model, and effort, all from T3's own records."""
    with closing(connect(t3_home)) as connection:
        thread = thread_for(connection, record)
        if thread is None:
            raise RunError(f"{record['key']} has no T3 thread yet")
        provider_threads = connection.execute("""
            SELECT driver, provider, payload_json FROM orchestration_v2_projection_provider_threads
            WHERE thread_id=?
        """, (thread["thread_id"],)).fetchall()
    if len(provider_threads) != 1:
        raise RunError(f"{record['key']} has {len(provider_threads)} provider threads; expected one")
    driver = provider_threads[0]["driver"]
    if driver not in HARNESSES:
        raise RunError(f"{record['key']} ran on the T3 {driver} driver, which the collector does not support yet")
    native = json.loads(provider_threads[0]["payload_json"])
    session_id = native.get("nativeThreadRef", {}).get("nativeId")
    if not session_id:
        raise RunError(f"{record['key']} has no native session ID yet")
    identity: dict[str, Any] = {
        "t3_thread_id": thread["thread_id"],
        "session_id": session_id,
        "driver": driver,
        "provider_instance": provider_threads[0]["provider"],
        "runtime_mode": thread["runtime_mode"],
    }
    if driver == "claudeAgent":
        selection = json.loads(thread["app_json"])["modelSelection"]
        options = claude_query(t3_home, thread["thread_id"], session_id)
        if options.get("model") != selection.get("model") or options.get("cwd") != record["workspace"]:
            raise RunError(f"Claude SDK model or working directory does not match T3's thread for {record['key']}")
        identity.update(provider="claudeAgent", model=selection["model"], effort=options.get("effort"))
        # Models without fast mode, such as Haiku, have no fastMode setting at all.
        settings = options.get("settings", {})
        if "fastMode" in settings:
            identity["fast_mode"] = bool(settings["fastMode"])
    elif driver == "codex":
        selection = json.loads(thread["app_json"])["modelSelection"]
        context = codex_turn_context(codex_home(), session_id)
        if context["model"] != selection.get("model") or context["cwd"] != record["workspace"]:
            raise RunError(f"Codex model or working directory does not match T3's thread for {record['key']}")
        if context["service_tier"] in FAST_SERVICE_TIERS:
            raise RunError(f"{record['key']} ran on the faster {context['service_tier']} service tier")
        identity.update(provider="codex", model=selection["model"], effort=context["effort"])
    else:
        selection = native["nativeMetadata"]["modelSelection"]
        provider, _, model = selection["model"].partition("/")
        variants = [option.get("value") for option in selection.get("options", []) if option.get("id") == "variant"]
        identity.update(provider=provider, model=model, effort=variants[0] if len(variants) == 1 else None)
    if not identity["effort"]:
        raise RunError(f"Could not determine the reasoning effort T3 used for {record['key']}")
    return identity


def model_matches(expected: str, identity: dict[str, Any]) -> bool:
    return expected in (identity["model"], f"{identity['provider']}/{identity['model']}")


def _path_outside(text: str, workspace: Path) -> bool:
    path = Path(os.path.expanduser(text))
    resolved = Path(os.path.normpath(path if path.is_absolute() else workspace / path))
    if resolved == workspace or workspace in resolved.parents:
        return False
    home = Path.home()
    if any(resolved == home / cache or home / cache in resolved.parents for cache in HOME_CACHES):
        return False
    return not any(f"{resolved}/".startswith(prefix) for prefix in SYSTEM_PREFIXES)


def _names_user_files(token: str) -> bool:
    return token.startswith(("~", "..")) or token.startswith(USER_ROOTS) or token.rstrip("/") in USER_ROOTS


def _references(value: Any, key: str = "") -> list[tuple[str, str]]:
    """Every (kind, text) in a tool input that names a file system location, a command, or a web lookup."""
    found: list[tuple[str, str]] = []
    if isinstance(value, dict):
        for child_key, child in value.items():
            found.extend(_references(child, child_key))
    elif isinstance(value, list):
        for child in value:
            found.extend(_references(child, key))
    elif isinstance(value, str) and value:
        if key in PATH_KEYS:
            found.append(("path", value))
        elif key in COMMAND_KEYS:
            found.append(("text", value))
            found.extend(("command", token) for token in PATH_TOKEN.findall(value) if _names_user_files(token))
        elif key in WEB_KEYS:
            found.append(("text", value))
        elif key == "pattern" and (value.startswith(("/", "~")) or "../" in value or value == ".."):
            found.append(("path", value))
    return found


def benchmark_markers(root: Path) -> list[str]:
    """Names that identify this benchmark: its folder name and its GitHub owner/repository."""
    markers = {root.resolve().name}
    try:
        remote = subprocess.run(
            ["git", "remote", "get-url", "origin"], cwd=root, text=True, capture_output=True, check=True,
        ).stdout.strip()
        match = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$", remote)
        if match:
            markers.update({match.group(2), f"{match.group(1)}.github.io/{match.group(2)}"})
    except (OSError, subprocess.CalledProcessError):
        pass
    return sorted(markers)


def _normalized(text: str) -> str:
    return re.sub(r"[\s_]+", "-", text.lower())


def _mentions_benchmark(text: str, workspace: Path, markers: list[str]) -> bool:
    # A workspace inside the repository (as in early runs) names the repository in every path.
    text = _normalized(text.replace(str(workspace), ""))
    return any(_normalized(marker) in text for marker in markers)


# T3's own tools reach every thread's transcript; only its preview browser, which shows the agent's own pages, is allowed.
T3_TOOL = re.compile(r"t3[-_]code(?:__|\W+)(\w+)$")
SCREENSHOT_PATH = re.compile(r'"screenshotPath\\?"\s*:\s*\\?"([^"\\]+)')
# OpenCode moves long commands to the background and tells the agent where their output streams.
SHELL_OUTPUT_PATH = re.compile(r"Output is streaming to: (\S+\.out)")


def outside_access(
    t3_home: Path, thread_id: str, workspace: str, markers: list[str] | None = None,
) -> list[dict[str, str]]:
    """Tool calls that left the run's workspace, read T3's own data, or looked up this benchmark."""
    root = Path(os.path.normpath(workspace))
    t3_data = Path(os.path.normpath(t3_home))
    findings = []
    with closing(connect(t3_home)) as connection:
        items = connection.execute("""
            SELECT type, payload_json FROM orchestration_v2_projection_turn_items
            WHERE thread_id=? AND type NOT IN ('reasoning', 'assistant_message', 'user_message', 'checkpoint')
            ORDER BY ordinal
        """, (thread_id,)).fetchall()
    # Files the harness itself handed this thread: preview screenshots and background-command logs.
    own_files: set[str] = set()
    for item in items:
        payload = json.loads(item["payload_json"])
        if payload.get("title") == "Workspace ready":
            continue
        tool = payload.get("toolName") or item["type"]
        t3_tool = T3_TOOL.search(tool)
        if t3_tool and not t3_tool.group(1).startswith("preview_"):
            findings.append({
                "time": payload.get("startedAt", ""), "tool": tool, "kind": "t3-tool",
                "reference": json.dumps(payload.get("input"))[:500],
            })
        fields = {key: payload.get(key) for key in ("input", "pattern", "patterns", "fileName", "results") if key in payload}
        for kind, text in _references(fields):
            finding = finding_kind(kind, text, root, t3_data, markers or [])
            if finding and os.path.normpath(os.path.expanduser(text)) in own_files:
                continue
            if finding:
                findings.append({"time": payload.get("startedAt", ""), "tool": tool, "kind": finding, "reference": text})
        for text in _strings(payload.get("output")) + _strings(payload.get("results")):
            own_files.update(os.path.normpath(path) for path in SHELL_OUTPUT_PATH.findall(text))
            if t3_tool:
                own_files.update(os.path.normpath(path) for path in SCREENSHOT_PATH.findall(text))
    return findings


# Scratch locations every run on this machine shares: /tmp entries and local server ports.
SHARED_PLACE = re.compile(r"""(?:/private)?(/tmp/[^\s'"|;&<>()`/\\]+)|\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})\b""")


def _strings(value: Any) -> list[str]:
    if isinstance(value, dict):
        return [text for child in value.values() for text in _strings(child)]
    if isinstance(value, list):
        return [text for child in value for text in _strings(child)]
    return [value] if isinstance(value, str) else []


def shared_places(t3_home: Path, thread_id: str) -> dict[str, tuple[str, str]]:
    """The /tmp entries and localhost ports a thread's tool calls name, with the first and last time each was named."""
    places: dict[str, tuple[str, str]] = {}
    with closing(connect(t3_home)) as connection:
        items = connection.execute("""
            SELECT payload_json FROM orchestration_v2_projection_turn_items
            WHERE thread_id=? AND type NOT IN ('reasoning', 'assistant_message', 'user_message', 'checkpoint')
            ORDER BY ordinal
        """, (thread_id,)).fetchall()
    for item in items:
        payload = json.loads(item["payload_json"])
        when = payload.get("startedAt", "")
        for text in _strings({key: payload.get(key) for key in ("input", "pattern", "patterns", "fileName")}):
            for tmp, port in SHARED_PLACE.findall(text):
                place = tmp or f"localhost:{port}"
                first, _ = places.get(place, (when, when))
                places[place] = (first, when)
    return places


def concurrent_overlaps(t3_home: Path, threads: dict[str, str]) -> list[dict[str, Any]]:
    """Shared places used by more than one of the given runs (label -> thread ID).

    A /tmp entry is reported whenever two runs name it, because files persist between runs.
    A port is reported only when the runs named it during overlapping intervals."""
    users: dict[str, list[tuple[str, str, str]]] = {}
    for label, thread_id in threads.items():
        for place, (first, last) in shared_places(t3_home, thread_id).items():
            users.setdefault(place, []).append((label, first, last))
    overlaps = []
    for place, used in sorted(users.items()):
        if len(used) < 2:
            continue
        if place.startswith("localhost:") and not any(
            a[1] <= b[2] and b[1] <= a[2] for i, a in enumerate(used) for b in used[i + 1:]
        ):
            continue
        overlaps.append({"place": place, "runs": [{"run": label, "first": first, "last": last} for label, first, last in used]})
    return overlaps


def finding_kind(kind: str, text: str, workspace: Path, t3_data: Path, markers: list[str]) -> str | None:
    """Classify one reference: benchmark lookup, T3 data read, outside path or command, or nothing."""
    if kind == "text":
        return "benchmark" if _mentions_benchmark(text, workspace, markers) else None
    if not _path_outside(text, workspace):
        return None
    path = Path(os.path.expanduser(text))
    resolved = Path(os.path.normpath(path if path.is_absolute() else workspace / path))
    # The run's own folder holds nothing but the workspace; see `new_run`.
    if resolved == workspace.parent and workspace.name == WORKSPACE_NAME:
        return None
    return "t3-data" if resolved == t3_data or t3_data in resolved.parents else kind


def copy_workspace(workspace: str, destination: Path) -> None:
    if destination.exists():
        raise RunError(f"{destination} already exists")
    shutil.copytree(workspace, destination, ignore=COPY_IGNORE)
