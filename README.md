# Tetris LLM Benchmark

This experimental benchmark compares model and agent-harness behavior while
implementing the Tetris game described in [TETRIS.md](TETRIS.md). The goal is
to produce a correct implementation efficiently, including token use.

## Results

The primary benchmark figure is **tested-agent total**. Harness-generated
requests are reported separately so that title generation or approval review
does not silently change the model comparison.

| Run | Harness | Elapsed | Tested-agent total | Harness overhead | Combined recorded total |
|---|---|---:|---:|---:|---:|
| [Luna Codex](luna-codex/STATISTICS.md) | Codex Desktop | 11m 31.291s | **1,177,121** | 68,227 | 1,245,348 |
| [Luna OMP](luna-omp/STATISTICS.md) | OMP | 14m 14.264s | **5,171,263** | 391 | 5,171,654 |
| [Sol Codex](sol-codex/STATISTICS.md) | Codex Desktop | 6m 22.017s | **909,035** | 41,371 | 950,406 |
| [Sol OMP](sol-omp/STATISTICS.md) | OMP | 8m 3.842s | **999,455** | 365 | 999,820 |
| [DeepSeek OMP/PI](deepseek-pi/STATISTICS.md) | OMP/PI | 1h 30m 39.662s | **19,162,498** | 1,635 | 19,164,133 |

The DeepSeek run is listed for completeness but is not directly comparable:
it contains three user messages and follow-up interaction, while each Luna and
Sol run used one benchmark prompt.

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
of the final tested-agent response: Codex's root `task_complete` event, or the
OMP response timestamp plus its duration. Session-file creation and OMP title
generation timestamps are excluded because they are harness lifecycle events,
not benchmark work boundaries.

## Session isolation

Sessions were matched by exact ID, working directory, model, prompt, and time.
Broad date filtering is unsafe because unrelated sessions overlap these runs.

| Run | Tested session ID | Overhead record |
|---|---|---|
| Luna Codex | `019fe763-4679-7e92-902c-0ea1c4cc638f` | Guardian `019fe76a-a36f-7892-911c-d70ed9e5a31e` |
| Luna OMP | `019fe752-f49b-7000-a874-a3871c2487c7` | Two title events with the same session ID |
| Sol Codex | `019fea5f-5c72-7df2-bf83-3a3edfbf7192` | Guardian `019fea63-1466-7b12-9a36-fdd3f81aba9a` |
| Sol OMP | `019fea22-4474-7000-91b9-3ac7ff12f162` | Two title events with the same session ID |
| DeepSeek OMP/PI | `019fe238-a6de-7000-9e4a-fa92e19ad158` | Two title events with the same session ID |

For Codex, guardian records are included only when their `parent_thread_id`
matches the tested root session. For OMP, database rows are grouped by the
exact `session_file`, and log overhead is included only when its `sessionId`
matches. This excludes, among other data, an overlapping `chrome-bookmarks`
OMP session and the later statistics-audit Codex session.

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
