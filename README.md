# Tetris LLM Benchmark

This experimental benchmark compares model and agent-harness behavior while
implementing the Tetris game described in [TETRIS.md](TETRIS.md). The goal is
to produce a correct implementation efficiently, including token use.

## Results

Each run is one model implementing [TETRIS.md](TETRIS.md) once, in one agent
harness. Runs are ordered by quality score, with token use and time alongside.
Tokens count only the tested agent; harness-generated requests such as title
generation or approval review are reported in each run's statistics so they do
not skew the model comparison.

The table is generated from [`benchmark-runs.json`](benchmark-runs.json),
[`ranking.json`](ranking.json), and each run's `STATISTICS.md`.

<!-- benchmark-results:start -->
| # | Run | Model | Effort | Harness | Quality | Tokens | Est. cost | Time | Main finding |
|---:|---|---|---|---|---:|---:|---:|---:|---|
| 1 | [Opus 5.5](opus-5.5/STATISTICS.md) | `claude-opus-5-5` | `medium` | T3 Code / Claude Agent SDK | **9.05** | 1,510,085 | $1.50 | 7m 17.232s | Strongest tests and rules coverage; board does not fit a phone screen |
| 2 | [Claude Sonnet 5.5 (xhigh)](claude-sonnet-5-5-xhigh/STATISTICS.md) | `claude-sonnet-5-5` | `xhigh` | T3 Code / Claude Agent SDK | **9.00** | 2,531,771 | $1.30 | 9m 23.043s | Broad rules, strong integration/input tests and a fitting phone layout; soft-drop jump |
| 3 | [Claude Haiku 5.5 (xhigh)](claude-haiku-5-5-xhigh/STATISTICS.md) | `claude-haiku-5-5` | `xhigh` | T3 Code / Claude Agent SDK | **8.80** | 5,786,532 | $0.17 | 13m 19.187s | Broad rules and strong tests; soft-drop timing jump and clipped phone playfield |
| 4 | [Claude Sonnet 5.5 (high)](claude-sonnet-5-5-high/STATISTICS.md) | `claude-sonnet-5-5` | `high` | T3 Code / Claude Agent SDK | **8.65** | 978,719 | $0.66 | 4m 44.511s | Broad rules and timing tests; soft-drop jump and clipped phone sidebars |
| 5 | [Luna OMP](luna-omp/STATISTICS.md) | `gpt-5.6-luna` | — | OMP | **8.60** | 5,171,263 | $0.17 | 14m 14.264s | No confirmed bugs; tests skip kicks, lock delay and advanced scoring |
| 6 | [Claude Haiku 5.5 (high)](claude-haiku-5-5-high/STATISTICS.md) | `claude-haiku-5-5` | `high` | T3 Code / Claude Agent SDK | **8.55** | 4,999,379 | $0.13 | 9m 54.526s | Broad rules support; soft-drop timing jump and clipped phone playfield |
| 7 | [Gemini-4](gemini-4/STATISTICS.md) | `gemini-4-argon-contributor` | `medium` | T3 Code / OpenCode | **8.50** | 590,203 | $0.45 | 6m 36.862s | No perfect-clear bonus; side panels overflow on phones |
| 8 | [Luna PI](luna-pi/STATISTICS.md) | `gpt-5.6-luna` | — | PI | **8.45** | 970,356 | $0.08 | 12m 26.483s | Combo bonus is multiplied by the level twice |
| 9 | [Gemini 4 Argon (high)](gemini-4-argon-contributor-high/STATISTICS.md) | `gemini-4-argon-contributor` | `high` | T3 Code / OpenCode | **8.45** | 1,125,477 | $0.82 | 13m 9.707s | Broad rules support; missing perfect-clear bonus and clipped phone sidebars |
| 10 | [Muse Spark 1.3 (medium)](muse-spark-1.3-medium/STATISTICS.md)† | `muse-spark-1.3-contributor` | `medium` | T3 Code / OpenCode | **8.40** | 923,864 | $1.20 | 2m 13.321s | No perfect-clear bonus; board collapses to nothing on phones |
| 11 | [Claude Sonnet 5.5 (medium)](claude-sonnet-5-5-medium/STATISTICS.md) | `claude-sonnet-5-5` | `medium` | T3 Code / Claude Agent SDK | **8.35** | 494,455 | $0.38 | 2m 30.629s | Full/mini spins, B2B and combos work; no perfect-clear bonus, soft-drop jump and clipped sidebars |
| 12 | [Sol OMP](sol-omp/STATISTICS.md) | `gpt-5.6-sol` | — | OMP | **8.30** | 999,455 | $1.29 | 8m 3.842s | No mini T-spins; sparse test suite |
| 13 | [Claude Haiku 5.5 (max)](claude-haiku-5-5-max/STATISTICS.md) | `claude-haiku-5-5` | `max` | T3 Code / Claude Agent SDK | **8.25** | 7,447,694 | $0.25 | 23m 8.921s | No perfect-clear bonus or hidden lock-out; soft-drop timing jump and phone sidebar overflow |
| 14 | [Sol Codex](sol-codex/STATISTICS.md) | `gpt-5.6-sol` | — | Codex Desktop | **8.20** | 909,035 | $1.12 | 6m 22.017s | Piece can lock in mid-air after a ledge move; no mini T-spins |
| 15 | [Luna Codex](luna-codex/STATISTICS.md) | `gpt-5.6-luna` | — | Codex Desktop | **7.60** | 1,177,121 | $0.07 | 11m 31.291s | Four S/Z rotation states are not SRS; game-over overlay shows during play |
| 16 | [Claude Sonnet 5.5 (low)](claude-sonnet-5-5-low/STATISTICS.md) | `claude-sonnet-5-5` | `low` | T3 Code / Claude Agent SDK | **7.40** | 124,165 | $0.19 | 1m 3.761s | Basic scoring only; hidden lock-out missing, soft-drop jump and clipped phone sidebars |
| 17 | [Cat-jam](cat-jam/STATISTICS.md) | `longcat-2.5-preview-free` | `default` | T3 Code / OpenCode | **7.40** | 2,070,440 | $0.12 | 23m 42.424s | Malformed L rotation state; no T-spin, B2B or perfect-clear scoring |
| 18 | [DeepSeek OMP/PI](deepseek-pi/STATISTICS.md)† | `deepseek-v4-flash` | — | OMP/PI | **7.30** | 18,118,592 | $0.12 | 44m 11.418s | Piece can lock in mid-air after a ledge move; basic scoring only |
| 19 | [Space-bunny](space-bunny/STATISTICS.md) | `space-bunny` | `xhigh` | T3 Code / OpenCode | **6.75** | 21,547,591 | — | 13m 19.433s | Non-SRS shapes and kicks, flattened ghost piece, scoring errors |
| 20 | [Beam](beam/STATISTICS.md) | `beam-free` | `xhigh` | T3 Code / OpenCode | **5.60** | 1,334,888 | — | 3m 3.429s | Lock timer mixes two clocks; classic scoring table |
| 21 | [Nemotron](nemotron/STATISTICS.md) | `nvidia/nemotron-3.5-super-vl:free` | `thinking` | T3 Code / OpenCode | **4.00** | 1,851,716 | $0.20 | 9m 8.773s | Does not start in the browser: imports lack .js extensions |
| — | [Muse Spark 1.3 (minimal)](muse-spark-1.3-contributor-minimal/STATISTICS.md) | `muse-spark-1.3-contributor` | `minimal` | T3 Code / OpenCode | Pending | 561,377 | $0.73 | 45.005s | Not ranked yet |
| — | [Muse Spark 1.3 (low)](muse-spark-1.3-contributor-low/STATISTICS.md) | `muse-spark-1.3-contributor` | `low` | T3 Code / OpenCode | Pending | 289,934 | $0.41 | 2m 1.225s | Not ranked yet |
| — | [Muse Spark 1.3 (medium)](muse-spark-1.3-contributor-medium/STATISTICS.md) | `muse-spark-1.3-contributor` | `medium` | T3 Code / OpenCode | Pending | 262,101 | $0.37 | 43.277s | Not ranked yet |

**† Muse Spark 1.3 (medium):** Reference-assisted run: the medium-reasoning child read Gemini-4's engine, shape tables, tests, and build files before writing this implementation, so token/time efficiency is not an independent from-scratch comparison. Primary time covers the child task only. The xhigh parent prepared/delegated and verified/reported the result: 339,157 recorded parent tokens and 2m 54.475s end-to-end are documented separately.

**† DeepSeek OMP/PI:** The implementation required two user messages, while the other runs used one benchmark prompt. Elapsed time includes both agent-work phases but excludes the wait for the second message. A later README-only message did not affect the audited implementation and is reported separately.

**Columns:** Quality is the weighted [ranking](RANKING.md) score out of 10; token use and time do not affect it. Tokens are the tested agent's total (input + cache read + cache write + output). Effort is the recorded reasoning setting; `—` means it was not recorded. Effort labels are provider-specific, not equivalent reasoning budgets.

**Est. cost** prices the tested agent's tokens at the model's public API list price on the run date, from [`pricing.json`](pricing.json); `—` means the model has no public price. It is an estimate of the API cost, not what a subscription or free tier charged. Some prices come from third-party listings or are upper bounds; `pricing.json` records the source and caveats for each model.

**Harness overhead:** each run's statistics report separate harness requests. For T3 runs they are not verified; unknown does not mean zero.
<!-- benchmark-results:end -->

## Implementation quality

[`RANKING.md`](RANKING.md) has the rubric, per-criterion scores,
task-conformance and test-coverage tables, and the audit of each
implementation. Scores and confirmed bugs are recorded in
[`ranking.json`](ranking.json); after changing them, run `python3 scripts/benchmark.py render` to regenerate the
leaderboard above and the ranking table.

Evidence is in the audit records: the [October audit](.audit/october-review.md)
for the five T3 Code/OpenCode imports, the [October 23 audit](.audit/oct23-review.md)
for Opus 5.5 and Muse Spark, the [Haiku audit](.audit/haiku-review.md)
for Claude Haiku 5.5 (high, xhigh and max), the [Sonnet audit](.audit/sonnet-review.md)
for Claude Sonnet 5.5 (low, medium, high and xhigh), the
[Gemini high audit](.audit/gemini-high-review.md) for Gemini 4 Argon (high), and the
[audit index](.audit/README.md) for the rest. They hold exact session mappings,
reproducible probes, browser evidence, isolation context and test-coverage limitations.

Effort values are the exact settings T3 stored. Cat-jam's `default` means the
provider's default setting, not that reasoning was disabled. Opus 5.5 ran with
fast mode off.

## Results site

The same results are published as a static site with interactive charts
(quality against estimated cost, tokens, and time; cost; token use; time; and
score breakdown) and a
page per run that shows its scores, confirmed bugs, usage, and a playable build
of its game. [`pages.yml`](.github/workflows/pages.yml) builds and checks it on
every pull request and deploys it to GitHub Pages from `main`.

```sh
python3 scripts/benchmark.py site            # builds _site/, including every game
python3 scripts/benchmark.py site --skip-games
npm ci && npx playwright install chromium   # once, for the browser check
npm run check:site                           # loads every page and game in Chromium
```

Each game is built with its own `npm ci` and `npm run build` in an isolated copy
and published as delivered, with two documented exceptions that only affect
static hosting. Asset URLs starting with `/` in a game's `index.html` are made
relative, because the site is served under a project path. A path the run's
own server maps to another file is declared as `static_aliases` in
[`benchmark-runs.json`](benchmark-runs.json) and copied into place. Each run
page names any such change. Nemotron is published unfixed: it is declared as a
`known_browser_failure`, and the browser check confirms it still fails.

The page generator is [`scripts/results_site.py`](scripts/results_site.py); the
charts and styles are in [`site/assets`](site/assets).

## Token accounting

Every normalized usage table uses the same columns and equation:

```text
Total = Input + Cache Read + Cache Write + Output
```

- **Input** means uncached input tokens.
- **Cache Read** and **Cache Write** remain visible because cached tokens still
  represent model token processing and are included in provider totals.
- **Output** already includes reasoning output when the provider reports a
  reasoning-token subset. Reasoning tokens must not be added again.
- **Tested-agent total** includes only requests made by the implementation
  model through the benchmark harness.
- **Harness overhead** includes identifiable model requests made for harness
  operation: Codex guardian approval reviews or OMP title generation.
- **Combined recorded total** is tested-agent usage plus harness overhead.
  It is shown as `Not verified` when overhead is unknown.

The leaderboard's **Tokens** column is the tested-agent total. Harness overhead
and combined totals appear in each run's `STATISTICS.md`.

OMP's earlier `Tokens total` values of `172,351` for Luna and `78,367` for Sol
were actually `Input + Output`; they excluded cache reads. They are retained in
the detailed files only as **non-cache tokens**, not as total usage.

### Timing convention

Start is the timestamp of the first benchmark user message. End is completion
of the final tested-agent response: Codex's root `task_complete` event, the OMP
response timestamp plus its duration, the final PI assistant-message
timestamp, or T3's completed provider-turn timestamp. Session-file creation and title-generation timestamps are excluded
because they are harness lifecycle events, not benchmark work boundaries.
DeepSeek is the documented exception: its end is the completed implementation
response to message two, and the wait between messages one and two is
subtracted from elapsed time.

## Cost estimates

The **Est. cost** column prices each run's tested-agent tokens at the model's
public pay-as-you-go API list price in effect on the run date:

```text
Cost = (Input × input price + Cache Read × cache-read price
        + Cache Write × cache-write price + Output × output price) / 1,000,000
```

[`pricing.json`](pricing.json) holds the price per million tokens for every
model in the registry, with its source, the date it was checked, and how
strongly it is backed:

- **`recorded`**: the price reproduces the cost the harness itself recorded.
  OMP and PI record a dollar cost, so Luna, Sol, and DeepSeek prices are
  checked against four real bills. `verify` fails if any estimate drifts more
  than 1% from a recorded cost.
- **`official`**: taken from the provider's own pricing page.
- **`third-party`**: taken from a price listing because the provider's page
  was not available. Treat these as approximate.

The estimate is what the run would cost through the provider's API. It is not
what a subscription such as OpenCode Go or a free tier actually charged. When a
run used a free or contributor variant, the standard public price of the same
model is used. Where a provider publishes no cached-input price, cached tokens
are priced as regular input, which makes that estimate an upper bound. Models
with no public price at all (Beam and Space Bunny, both free stealth models)
have no estimate. Every assumption is recorded in the model's `note`.

## Session isolation

Sessions were matched by exact ID, working directory, model, prompt, and time.
Broad date filtering is unsafe because unrelated sessions overlap these runs.

The authoritative mappings are stored in
[`benchmark-runs.json`](benchmark-runs.json). Each run declares its tested
session ID, expected provider/model/directory, cutoff policy, and exact
guardian IDs, expected OMP title count, or explicitly unknown T3 overhead.
T3 runs additionally declare their exact T3 thread ID, original working
directory, and recorded reasoning variant. Generated `STATISTICS.md` files
also display the tested session ID.

For Codex, guardian records are included only when their `parent_thread_id`
matches the tested root session. For OMP, database rows are grouped by the
exact `session_file`, and log overhead is included only when its `sessionId`
matches. This excludes, among other data, an overlapping `chrome-bookmarks`
OMP session and the later statistics-audit Codex session.

For PI, the collector opens the one JSONL file whose filename contains the
exact configured session ID, then validates the session record's ID, version,
working directory, provider, and model. Usage is summed across assistant
responses in the included user-message phases; tool calls and results are
counted from those same messages. PI reasoning tokens are an informational
subset of output and are not added again.

For T3 Code/OpenCode, both the exact T3 thread ID and native OpenCode session
ID must match. The collector validates the original project directory, model
alias, reasoning variant, and complete main-agent usage without subagents.
T3 Claude Agent SDK runs also require a matching native `query.open` log
record for their effective effort and fast-mode settings. Delegated Muse
collection validates its parent lineage and explicit task-directory instruction.

## Reproducing the calculations

### Codex

Codex rollouts are JSON Lines files under `~/.codex/sessions/`. The final
cumulative `token_count` event contains the tested-agent usage:

```sh
codex_rollout=/path/to/matching/root-rollout.jsonl

jq -s '
  [.[]
   | select(.type == "event_msg")
   | select(.payload.type == "token_count")
   | select(.payload.info != null)]
  | last
  | .payload.info.total_token_usage
' "$codex_rollout"
```

Codex's raw `input_tokens` includes cached input. Normalize it as:

```text
Input = input_tokens - cached_input_tokens
Cache Read = cached_input_tokens
Cache Write = cache_write_input_tokens
Total = Input + Cache Read + Cache Write + output_tokens
```

Locate child overhead from its metadata and require the expected parent:

```sh
guardian_rollout=/path/to/candidate/guardian-rollout.jsonl

jq -s '
  first
  | select(.type == "session_meta")
  | .payload
  | {id, parent_thread_id, thread_source, source, cwd}
' "$guardian_rollout"
```

The detailed Codex statistics files preserve both final cumulative JSON usage
events, including `reasoning_output_tokens` for reference.

### OMP

OMP's `stats.db` already stores uncached input and cache reads separately. Use
read-only SQLite and restrict the query to the exact session file:

```sh
omp_db=/path/to/.omp/stats.db
omp_session_file=/absolute/path/to/the/matching-session.jsonl

sqlite3 -readonly -header -column "$omp_db" "
  SELECT
    folder,
    model,
    provider,
    COUNT(*) AS model_responses,
    SUM(input_tokens) AS input,
    SUM(cache_read_tokens) AS cache_read,
    SUM(cache_write_tokens) AS cache_write,
    SUM(output_tokens) AS output,
    SUM(total_tokens) AS total,
    SUM(cost_total) AS cost
  FROM messages
  WHERE session_file = '$omp_session_file'
  GROUP BY session_file, folder, model, provider;
"
```

The end time is the latest response completion rather than the latest request
start:

```sql
MAX(timestamp + COALESCE(duration, 0))
```

OMP title-generation calls are recorded in JSON log lines rather than the
tested-agent database aggregate. Match them by exact session ID:

```sh
omp_session_id=replace-with-exact-session-id

jq -s --arg id "$omp_session_id" '
  [.[]
   | select(.sessionId == $id)
   | select(.message == "title-generator: success")
   | .usage]
  | {
      requests: length,
      input: (map(.input // 0) | add),
      cache_read: (map(.cacheRead // 0) | add),
      cache_write: (map(.cacheWrite // 0) | add),
      output: (map(.output // 0) | add),
      total: (map(.totalTokens // 0) | add)
    }
' /path/to/.omp/logs/*.log
```

The OMP directory used for these runs was `/Users/agent/.omp`; the originally
suggested singular path `/User/agent/.omp` does not exist.

### PI

PI sessions are append-only JSON Lines files under
`~/.pi/agent/sessions/`. Restrict collection to the exact session ID and sum
the per-response usage objects:

```sh
pi_session=/path/to/exact-pi-session.jsonl

jq -s '
  [.[]
   | select(.type == "message")
   | select(.message.role == "assistant")
   | .message.usage]
  | {
      responses: length,
      input: (map(.input // 0) | add),
      cache_read: (map(.cacheRead // 0) | add),
      cache_write: (map(.cacheWrite // 0) | add),
      output: (map(.output // 0) | add),
      total: (map(.totalTokens // 0) | add),
      reasoning_subset: (map(.reasoning // 0) | add),
      cost: (map(.cost.total // 0) | add)
    }
' "$pi_session"
```

Each PI response must satisfy the common total equation independently. The
session used for Luna PI declared no separate model-powered harness overhead.

### T3 Code / OpenCode, Claude Agent SDK, and Codex

T3 stores the audited runs in `~/.t3/userdata/statev2.sqlite`. The collector
joins the exact configured T3 thread to its project, native OpenCode session,
and completed provider turn. It uses the whole-turn `turnTokenUsage` field,
not the latest-request `tokenUsage` snapshot:

```text
Input = inputTokens - cachedInputTokens - cacheCreationTokens
Cache Read = cachedInputTokens
Cache Write = cacheCreationTokens
Output = outputTokens
Total = inputTokens + outputTokens
```

Here `outputTokens` already includes `reasoningTokens`. The recorded reasoning
variant is taken from the provider thread's model-selection options. The
[October audit record](.audit/october-review.md) includes the read-only SQLite
query and exact session mappings.

Claude Agent SDK usage uses the same normalized whole-turn fields. Its model
comes from T3's application thread, and effective effort is validated from the
matching SDK `query.open` provider log. For the delegated Muse run, the tested
agent is the medium child; verified xhigh parent turns are shown separately as
recorded orchestration usage, with a lower bound for child plus parent. These
records do not establish a complete harness-overhead total.

Codex runs in T3 (`t3_codex`) use the same whole-turn fields. Their model also
comes from T3's application thread, and the model, effort, working directory,
and service tier Codex actually used are validated from the session's own
rollout under `CODEX_HOME` (`~/.codex/sessions/**/rollout-*-<session>.jsonl`),
whose `turn_context` records must agree. A run on the faster `priority`
service tier is refused.

This adapter supports the audited single-user-message, single-provider-turn
schema. Partial usage, subagents, extra turns, identity/configuration
mismatches, or unsupported schemas fail explicitly. T3 activity counts and
cost are not yet verified. The registry declares overhead as `unknown`, so
both overhead and combined totals remain `Not verified` rather than zero.

## Running a benchmark in T3 Code

New runs are executed in [T3 Code](https://github.com/pingdotgg/t3code) and
brought into the repository in three steps:

```sh
# 1. Prepare an isolated workspace and register it as a T3 project
python3 scripts/benchmark.py new claude-opus-5-5 high
python3 scripts/benchmark.py new opencode-go/gemini-4-argon-contributor medium --launch

# 2. Wait for every pending run to finish and import each one
python3 scripts/benchmark.py watch --import

# 3. Or import one run by hand
python3 scripts/benchmark.py import claude-opus-5-5-high-<id>
```

`new` takes the model ID as T3 reports it and the effort to select. It creates
`~/tetris-bench/runs/<random>/tetris/` holding only `README.md`, a copy of
[`TETRIS.md`](TETRIS.md), adds it to T3 as a project, and opens it. Start a
thread there with that model and effort in full-access mode, and send the
prompt that every T3 run has used, `Read the README.md file and implement it`;
`new` copies it to the clipboard. With `--launch`, `new` starts the thread
itself (see below).

`watch` checks pending runs every 20 seconds by reading T3's database
read-only. With `--import`, each finished run is imported immediately; runs
that cannot be imported are reported and left pending.

`import` reads the thread, native session, model, effort, and provider instance
from T3's own records rather than from what was typed. It refuses the run when
T3 used a different model or effort than `new` prepared, when the thread was
not in full-access mode (elapsed time would include approval waits), or when
the agent reached outside its workspace. It then adds the entry to
[`benchmark-runs.json`](benchmark-runs.json), copies the implementation into
the repository without `node_modules` or build output, runs `refresh`
(collection, isolated `npm test`, `STATISTICS.md`, README and RANKING tables),
and rolls everything back if any step fails. The run shows as `Pending` until
it is audited and scored. Its model needs a [`pricing.json`](pricing.json)
entry first.

### Isolation

Earlier runs shared a parent folder with other implementations, and several
agents looked there. Each new workspace sits in its own randomly named folder
under `~/tetris-bench/runs`, which holds only the active run: `new` refuses to
start while another run is pending, and moves every other folder there into
`~/tetris-bench/archive`. `import` moves the run's folder there once it is
imported. The archive has the owner's read permission removed, so the agent,
which runs as you, cannot list it; listing the folders above its workspace
shows only its own. To delete old runs, restore read permission first
(`chmod -R u+r ~/tetris-bench/archive`).

The first layout also removed read permission from `runs` and the run's own
folder. OpenCode cannot start in such a workspace: it resolves the real path of
every folder above it and fails with `PermissionDenied`, so its turn ends
before the model is called.

Isolation is also checked after the fact. `import` scans every tool call in the
T3 session and reports:

- **paths outside the workspace**: file reads, directory listings, searches,
  and paths in shell commands, ignoring system folders and package manager
  caches;
- **T3 data** (`t3-data`): anything under `~/.t3`, whose database holds the
  transcripts of every earlier run;
- **benchmark lookups** (`benchmark`): web searches, fetched URLs, or commands
  that name this benchmark's folder, GitHub repository, or Pages site.

Web access itself is allowed. Searching for the Tetris Guideline or SRS tables
is fine; finding other runs' code or results is not. A run with findings is
refused unless imported with `--allow-outside`, in which case the findings are
stored with its registry entry. `python3 scripts/benchmark.py isolation
[RUN_ID]` runs the same check on registered T3 runs.

Every run records its web mode as `"web"` in
[`benchmark-runs.json`](benchmark-runs.json) and on its site page. All runs so
far are `open`, the default. A planned isolated mode will block web tools
through each harness's workspace configuration and record `blocked`.

### Launching through T3's API

`--launch` starts the thread through `orchestration.launchThread`, the RPC the
T3 app itself uses: full-access mode, the fixed prompt, the effort as the
model's option (`variant` for OpenCode, `effort` for Claude), and title
generation off, which avoids an extra untracked model request.
[`scripts/t3-launch.mjs`](scripts/t3-launch.mjs) authenticates with a
five-minute session that can only operate threads, issued by
`t3 auth session issue` and revoked once the thread starts. This API is
internal and undocumented, so a T3 update can break it. When the launch fails,
`new` falls back to opening the workspace for a manual start. Use `--instance`
when more than one provider instance of the model's driver is enabled.

### Running directly from T3

A run can also be driven from inside a T3 thread, using the orchestration
tools T3 gives its agents instead of `scripts/t3-launch.mjs`. It was first
used for the Claude Haiku 5.5 (high) run; `new --launch` remains for terminal
use.

T3's own tools take over the launch and the wait. `t3_thread_launch` accepts
everything the launch script sends by hand: the `projectId`, a
`modelSelection` whose options carry the effort, `runtimeMode: "full-access"`,
`interactionMode: "default"`, and the first message. `t3_thread_wait` blocks
until the thread reaches a final state. The orchestrating thread runs:

1. `python3 scripts/benchmark.py new <model> <effort> --no-open` in its shell,
   to create the isolated workspace and register the T3 project. The project
   ID is stored as `t3_project_id` in `.bench/pending/<key>.json`.
2. `t3_thread_launch` with that project ID, the model and effort, full-access
   mode, the fixed prompt `Read the README.md file and implement it` as the
   message, and the same prompt as the title, as `--launch` does.
3. `t3_thread_wait` on the returned thread ID.
4. `python3 scripts/benchmark.py import <key>` in its shell.

This removes the undocumented `orchestration.launchThread` RPC, the
`t3 auth session issue` token, the WebSocket client, and the 20-second polling
in `watch`. `orchestrator_capabilities` lists the exact model IDs, provider
instances, and options T3 accepts, so they no longer have to be typed. Several
runs can be launched in parallel and awaited together.

The CLI is still needed for the rest. Creating the randomly named folders,
removing their read permission, and everything `import` checks and rolls back
are file and database operations an agent should not improvise.

What the Haiku run established:

- **Title generation.** `t3_thread_launch` has no `generateTitle` parameter,
  but with an explicit title none ran: T3's server trace has no title span for
  the thread and the title stayed as given.
- **Permission modes.** A launched thread cannot run with broader modes than
  the thread that launched it, so the orchestrating thread must itself be in
  full-access mode. It was, and the tested thread ran in full access.
- **Thread IDs.** Threads started this way have IDs like `mcp:<uuid>`, and T3
  writes the `:` as `-` in provider log names. The collector now looks the log
  up under that name.
- **Fast mode.** Models without fast mode, such as Haiku, have no `fastMode`
  setting in the SDK log, so none is recorded for them.

Tested agents in T3 are given `allowedTools: ["mcp__t3-code__*"]`, which
includes `t3_thread_search` and `t3_thread_read`; they can read earlier runs'
transcripts without touching a file. The isolation check therefore reports any
call to a T3 tool as `t3-tool`, except the preview browser (`preview_*`), which
shows the agent its own pages. The screenshots the preview browser saves under
`~/.t3/userdata/browser-artifacts` are not `t3-data` findings when the same
thread saved them; the Haiku xhigh run checked its game this way.

### Running several benchmarks

Workspaces cannot see each other, but every run on the machine shares `/tmp`
and local server ports, and agents of the same model pick the same names. The
Haiku run left `/tmp/tetris-fuzz` (with its own Playwright install),
`/tmp/tetris-serve.log`, and `/tmp/tetris-serve.pid`, and its first server
attempt found its default port taken by an unrelated server for the Opus 5.5
game. Concurrent runs, or later runs finding those leftovers, could therefore
read each other's files or test each other's game. Runs are executed one at a
time, which also keeps elapsed time free of CPU contention, and after each run:

- the `/tmp` entries it named are removed and any server still running from
  its workspace is stopped, before the next run starts;
- `python3 scripts/benchmark.py overlaps KEY...` lists every `/tmp` entry named
  by more than one of the given runs (pending keys or run IDs), and every
  localhost port they used during overlapping intervals. It exits non-zero
  when it finds one.

GPT models run through T3's Codex provider: `new` selects it for `gpt-` model
IDs, with the `reasoningEffort` option and the standard service tier.

## Adding a benchmark run

The benchmark CLI uses only the Python standard library. T3 Code runs are
handled by the commands above; this section covers the manual path every
harness supports. The CLI does not launch Codex, OMP, or PI, modify
implementations, update quality rankings, or create Git commits.

1. Put the completed implementation in a new repository subdirectory with a
   `package.json`, `package-lock.json`, and working `npm test` command.
2. Add one entry to [`benchmark-runs.json`](benchmark-runs.json), including the
   exact root session ID, provider/model, working-directory basename, cutoff,
   and overhead policy. For T3, also include its T3 thread ID, exact original
   directory, and reasoning variant. If its model is new, add the model's
   price to [`pricing.json`](pricing.json), or say why it has none.
3. Point `CODEX_HOME`, `OMP_HOME`, `PI_HOME`, or `T3_HOME` at the machine that
   owns the session data.
4. Refresh the run, review the generated Markdown, and commit it. Until the
   run is scored it appears at the bottom of the leaderboard as `Pending`.
5. After auditing it, add its entry to [`ranking.json`](ranking.json),
   including each confirmed bug's severity, title, and detail, and its audit
   section to [`RANKING.md`](RANKING.md), then run
   `python3 scripts/benchmark.py render`.
6. Build the site and run the browser check. If the game needs its own server
   to load, declare the mapping as `static_aliases`, or record a
   `known_browser_failure` if it cannot run in a browser at all.

```sh
# Codex defaults to CODEX_HOME=~/.codex
python3 scripts/benchmark.py refresh new-codex-run

# OMP can live under another user's home directory
OMP_HOME=/Users/agent/.omp \
  python3 scripts/benchmark.py refresh new-omp-run

# PI defaults to PI_HOME=~/.pi
PI_HOME=/Users/agent/.pi \
  python3 scripts/benchmark.py refresh new-pi-run

# T3 defaults to T3_HOME=~/.t3
T3_HOME=/Users/david/.t3 \
  python3 scripts/benchmark.py refresh beam

# Claude SDK effort also requires the matching T3 provider log
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py refresh opus-5.5
```

`refresh` finds only the configured session, fails closed when identity or
expected overhead evidence is missing, installs dependencies and runs tests in an
isolated temporary copy, regenerates the run's `STATISTICS.md`, and refreshes
the README leaderboard and the RANKING table. An explicit T3 `unknown` policy permits the
verified agent total while clearly marking overhead and combined usage as
unverified. Other useful commands are:

```sh
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py refresh --all
python3 scripts/benchmark.py refresh RUN_ID --dry-run
python3 scripts/benchmark.py render
python3 scripts/benchmark.py verify
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py verify RUN_ID
python3 -m unittest discover -s tests -v
```

Generated Markdown is the committed result record. `render` regenerates the
README leaderboard and RANKING table from committed statistics and
`ranking.json`, without session files. `verify` without a run ID checks report
arithmetic, that both generated tables are current, that every scored run
has a matching RANKING.md audit heading, and that cost estimates reproduce
every harness-recorded cost. `verify RUN_ID` additionally
recollects that exact source and requires its generated statistics to match
byte-for-byte. Quality scoring itself remains a separate audited workflow.
