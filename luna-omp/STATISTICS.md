# Statistics

## Session

- Harness: OMP
- Provider/model: `openai-codex` / `gpt-5.6-luna`
- Session ID: `019fe752-f49b-7000-a874-a3871c2487c7`
- User messages: 1
- Model responses: 95
- Tool calls: 94
- Tool results: 94
- Model/API errors: 0
- Tool errors: 4
- Start: `2026-08-09T16:20:46.790Z`
- End: `2026-08-09T16:35:01.054Z`
- Elapsed: 14m 14.264s

The timing starts at the benchmark user message/first tested-model request and
ends when the final tested-model response completed.

## Tested-agent usage

This is the primary benchmark figure. The previously reported `172,351` value
is Input + Output only and excludes cache reads.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 135,570 | 4,998,912 | 0 | 36,781 | **5,171,263** |

## Harness overhead

OMP generated two session titles under the same session ID. These requests are
not included in `stats.db`'s tested-agent aggregate.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Title generation (2 requests) | 340 | 0 | 0 | 51 | **391** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 135,910 | 4,998,912 | 0 | 36,832 | **5,171,654** |

## Normalized OMP output

```text
Messages
  User: 1
  Model responses: 95
  Tool calls: 94
  Tool results: 94
  Model/API errors: 0
  Tool errors: 4

Append-Only: inactive (setting: auto (openai-codex))

Tokens
  Input: 135,570
  Cache Read: 4,998,912
  Cache Write: 0
  Output: 36,781
  Non-cache tokens (Input + Output): 172,351
  Total: 5,171,263
  Cache-read rate: 97.36%

Requests
  Count: 95
  Average duration: 8.79s

Cost
  Tested agent: $0.171229
  Title-generation overhead: $0.000129
  Combined recorded: $0.171359
```
