# Statistics

## Session

- Harness: OMP/PI
- Provider/model: `opencode-go` / `deepseek-v4-flash`
- Session ID: `019fe238-a6de-7000-9e4a-fa92e19ad158`
- User messages: 3
- Model responses: 112
- Tool calls: 130
- Tool results: 130
- Model/API errors: 0
- Tool errors: 25
- Start: `2026-08-08T16:33:26.458Z`
- End: `2026-08-08T18:04:06.120Z`
- Elapsed: 1h 30m 39.662s

The timing starts at the first benchmark user message and ends when the final
tested-model response completed.

> This run is not directly comparable with the one-prompt Codex and OMP runs:
> it contains three user messages, including follow-up interaction.

## Tested-agent usage

This is the primary benchmark figure.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 55,315 | 18,893,440 | 0 | 213,743 | **19,162,498** |

## Harness overhead

OMP generated two session titles under the same session ID. These requests are
not included in `stats.db`'s tested-agent aggregate.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Title generation (2 requests) | 705 | 128 | 0 | 802 | **1,635** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 56,020 | 18,893,568 | 0 | 214,545 | **19,164,133** |

## Normalized OMP output

```text
Messages
  User: 3
  Model responses: 112
  Tool calls: 130
  Tool results: 130
  Model/API errors: 0
  Tool errors: 25

Append-Only: inactive (setting: auto (opencode-go))

Tokens
  Input: 55,315
  Cache Read: 18,893,440
  Cache Write: 0
  Output: 213,743
  Non-cache tokens (Input + Output): 269,058
  Total: 19,162,498
  Cache-read rate: 99.71%

Requests
  Count: 112
  Average duration: 19.88s

Cost
  Tested agent: $0.120494
  Title-generation overhead: $0.000324
  Combined recorded: $0.120817
```
