# Statistics

## Session

- Harness: OMP
- Provider/model: `openai-codex` / `gpt-5.6-sol`
- Session ID: `019fea22-4474-7000-91b9-3ac7ff12f162`
- User messages: 1
- Model responses: 31
- Tool calls: 30
- Tool results: 30
- Model/API errors: 0
- Tool errors: 3
- Start: `2026-08-10T05:28:57.692Z`
- End: `2026-08-10T05:37:01.534Z`
- Elapsed: 8m 3.842s

The timing starts at the benchmark user message/first tested-model request and
ends when the final tested-model response completed.

## Tested-agent usage

This is the primary benchmark figure. The previously reported `78,367` value
is Input + Output only and excludes cache reads.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 60,699 | 921,088 | 0 | 17,668 | **999,455** |

## Harness overhead

OMP generated two session titles under the same session ID. These requests are
not included in `stats.db`'s tested-agent aggregate.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Title generation (2 requests) | 340 | 0 | 0 | 25 | **365** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 61,039 | 921,088 | 0 | 17,693 | **999,820** |

## Normalized OMP output

```text
Messages
  User: 1
  Model responses: 31
  Tool calls: 30
  Tool results: 30
  Model/API errors: 0
  Tool errors: 3

Append-Only: inactive (setting: auto (openai-codex))

Tokens
  Input: 60,699
  Cache Read: 921,088
  Cache Write: 0
  Output: 17,668
  Non-cache tokens (Input + Output): 78,367
  Total: 999,455
  Cache-read rate: 93.82%

Requests
  Count: 31
  Average duration: 15.33s

Cost
  Tested agent: $1.294079
  Title-generation overhead: $0.002450
  Combined recorded: $1.296529
```
