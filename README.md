# Tetris LLM Benchmark

This experimental benchmark compares model and agent-harness behavior while
implementing the Tetris game described in [TETRIS.md](TETRIS.md). The goal is
to produce a correct implementation efficiently, including token use.

## Results

The primary benchmark figure is **tested-agent total**. Harness-generated
requests are reported separately so that title generation or approval review
does not silently change the model comparison.

<!-- benchmark-results:start -->
| Run | Harness | Elapsed | Tested-agent total | Harness overhead | Combined recorded total |
|---|---|---:|---:|---:|---:|
| [Luna Codex](luna-codex/STATISTICS.md) | Codex Desktop | 11m 31.291s | **1,177,121** | 68,227 | 1,245,348 |
| [Luna OMP](luna-omp/STATISTICS.md) | OMP | 14m 14.264s | **5,171,263** | 391 | 5,171,654 |
| [Luna PI](luna-pi/STATISTICS.md) | PI | 12m 26.483s | **970,356** | 0 | 970,356 |
| [Sol Codex](sol-codex/STATISTICS.md) | Codex Desktop | 6m 22.017s | **909,035** | 41,371 | 950,406 |
| [Sol OMP](sol-omp/STATISTICS.md) | OMP | 8m 3.842s | **999,455** | 365 | 999,820 |
| [DeepSeek OMP/PI](deepseek-pi/STATISTICS.md) | OMP/PI | 44m 11.418s | **18,118,592** | 1,635 | 18,120,227 |
| [Beam](beam/STATISTICS.md) | T3 Code / OpenCode | 3m 3.429s | **1,334,888** | Not verified | Not verified |
| [Cat-jam](cat-jam/STATISTICS.md) | T3 Code / OpenCode | 23m 42.424s | **2,070,440** | Not verified | Not verified |
| [Gemini-4](gemini-4/STATISTICS.md) | T3 Code / OpenCode | 6m 36.862s | **590,203** | Not verified | Not verified |
| [Nemotron](nemotron/STATISTICS.md) | T3 Code / OpenCode | 9m 8.773s | **1,851,716** | Not verified | Not verified |
| [Space-bunny](space-bunny/STATISTICS.md) | T3 Code / OpenCode | 13m 19.433s | **21,547,591** | Not verified | Not verified |
| [Opus 5.5](opus-5.5/STATISTICS.md) | T3 Code / Claude Agent SDK | 7m 17.232s | **1,510,085** | Not verified | Not verified |
| [Muse Spark 1.3 (medium)](muse-spark-1.3-medium/STATISTICS.md) | T3 Code / OpenCode | 2m 13.321s | **923,864** | Not verified | Not verified |

**DeepSeek OMP/PI:** The implementation required two user messages, while the other runs used one benchmark prompt. Elapsed time includes both agent-work phases but excludes the wait for the second message. A later README-only message did not affect the audited implementation and is reported separately.
**Muse Spark 1.3 (medium):** Reference-assisted run: the medium-reasoning child read Gemini-4's engine, shape tables, tests, and build files before writing this implementation, so token/time efficiency is not an independent from-scratch comparison. Primary time covers the child task only. The xhigh parent prepared/delegated and verified/reported the result: 339,157 recorded parent tokens and 2m 54.475s end-to-end are documented separately.
**Unverified overhead:** T3 agent totals and elapsed times are verified. Harness overhead and combined totals are not verified; unknown does not mean zero.
<!-- benchmark-results:end -->

## Implementation quality

[`RANKING.md`](RANKING.md) compares all 13 implementations using the same
weighted quality rubric. The five T3 Code/OpenCode implementations were
imported and reviewed on 2026-10-20:

| Implementation | Recorded reasoning variant | Quality score | Main finding |
|---|---|---:|---|
| [Gemini-4](gemini-4/README.md) | `medium` | 8.50 | Strongest new implementation; perfect-clear bonus and narrow layout gaps |
| [Cat-jam](cat-jam/README.md) | `default` | 7.40 | Malformed L rotation state and incomplete advanced scoring |
| [Space-bunny](space-bunny/README.md) | `xhigh` | 6.75 | Incorrect SRS, collapsed ghost geometry, and scoring integration defects |
| [Beam](beam/README.md) | `xhigh` | 5.60 | Mixed lock-timer clocks and incomplete scoring |
| [Nemotron](nemotron/README.md) | `thinking` | 4.00 | Builds/tests pass, but extensionless imports prevent browser startup |

Reasoning variants are the exact configured OpenCode settings stored by T3.
They are provider-specific labels, not equivalent reasoning budgets across
models; `default` does not mean reasoning was disabled.

The [October audit record](.audit/october-review.md) includes exact T3/OpenCode
session mappings, main-agent token counts and timing, reproducible probes,
browser evidence, and test-coverage limitations. These runs are registered in
the generated results block above, with per-run `STATISTICS.md` files.

The two additions reviewed on 2026-10-23 are:

| Implementation | Harness | Recorded reasoning | Quality score | Main finding |
|---|---|---|---:|---|
| [Opus 5.5](opus-5.5/README.md) | T3 Code / Claude Agent SDK | `medium`, fast mode off | 9.05 | Strongest test/rules coverage; fixed-width phone layout |
| [Muse Spark 1.3](muse-spark-1.3-medium/README.md) | T3 Code / OpenCode | `medium` child | 8.40 | Missing perfect-clear bonus; phone board collapses |

Muse's child read Gemini-4's implementation and tests before writing its
version, so its efficiency is reference-assisted. The xhigh setup/verification
parent is recorded separately. See the [October 23 audit](.audit/oct23-review.md)
for exact session isolation, reasoning evidence, parent usage, and findings.

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

### T3 Code / OpenCode and Claude Agent SDK

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

This adapter supports the audited single-user-message, single-provider-turn
schema. Partial usage, subagents, extra turns, identity/configuration
mismatches, or unsupported schemas fail explicitly. T3 activity counts and
cost are not yet verified. The registry declares overhead as `unknown`, so
both overhead and combined totals remain `Not verified` rather than zero.

## Adding a benchmark run

The benchmark CLI uses only the Python standard library. It ingests completed
runs; it does not launch Codex or OMP, modify implementations, update quality
rankings, or create Git commits.

1. Put the completed implementation in a new repository subdirectory with a
   `package.json`, `package-lock.json`, and working `npm test` command.
2. Add one entry to [`benchmark-runs.json`](benchmark-runs.json), including the
   exact root session ID, provider/model, working-directory basename, cutoff,
   and overhead policy. For T3, also include its T3 thread ID, exact original
   directory, and reasoning variant.
3. Point `CODEX_HOME`, `OMP_HOME`, `PI_HOME`, or `T3_HOME` at the machine that
   owns the session data.
4. Refresh the run, review the generated Markdown, and commit it.

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
the marked results block above. An explicit T3 `unknown` policy permits the
verified agent total while clearly marking overhead and combined usage as
unverified. Other useful commands are:

```sh
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py refresh --all
python3 scripts/benchmark.py refresh RUN_ID --dry-run
python3 scripts/benchmark.py verify
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py verify RUN_ID
python3 -m unittest discover -s tests -v
```

Generated Markdown is the committed result record. `verify` without a run ID
checks report arithmetic and README consistency without needing historical
session files. `verify RUN_ID` additionally recollects that exact source and
requires its generated statistics to match byte-for-byte. Quality scoring in
[`RANKING.md`](RANKING.md) remains a separate audited workflow.
