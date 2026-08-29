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

**DeepSeek OMP/PI:** The implementation required two user messages, while the other runs used one benchmark prompt. Elapsed time includes both agent-work phases but excludes the wait for the second message. A later README-only message did not affect the audited implementation and is reported separately.
<!-- benchmark-results:end -->

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

OMP's earlier `Tokens total` values of `172,351` for Luna and `78,367` for Sol
were actually `Input + Output`; they excluded cache reads. They are retained in
the detailed files only as **non-cache tokens**, not as total usage.

### Timing convention

Start is the timestamp of the first benchmark user message. End is completion
of the final tested-agent response: Codex's root `task_complete` event, the OMP
response timestamp plus its duration, or the final PI assistant-message
timestamp. Session-file creation and title-generation timestamps are excluded
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
guardian IDs or expected OMP title count. Generated `STATISTICS.md` files also
display the tested session ID.

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

## Adding a benchmark run

The benchmark CLI uses only the Python standard library. It ingests completed
runs; it does not launch Codex or OMP, modify implementations, update quality
rankings, or create Git commits.

1. Put the completed implementation in a new repository subdirectory with a
   `package.json`, `package-lock.json`, and working `npm test` command.
2. Add one entry to [`benchmark-runs.json`](benchmark-runs.json), including the
   exact root session ID, provider/model, working-directory basename, cutoff,
   and overhead policy.
3. Point `CODEX_HOME`, `OMP_HOME`, or `PI_HOME` at the machine that owns the
   session data.
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
```

`refresh` finds only the configured session, fails closed when identity or
overhead evidence is missing, installs dependencies and runs tests in an
isolated temporary copy, regenerates the run's `STATISTICS.md`, and refreshes
the marked results block above. Other useful commands are:

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
