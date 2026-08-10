# Statistics

## Session

- Harness: Codex Desktop
- Provider/model: OpenAI / `gpt-5.6-luna`
- Session ID: `019fe763-4679-7e92-902c-0ea1c4cc638f`
- User messages: 1
- Assistant messages: 6
- Tool calls: 28
- Tool results: 28
- Start: `2026-08-09T16:38:08.873Z`
- End: `2026-08-09T16:49:40.164Z`
- Elapsed: 11m 31.291s

The timing starts at the benchmark user message and ends at the root task's
completion event.

## Tested-agent usage

This is the primary benchmark figure. Codex reports cached input inside
`input_tokens`, so the normalized Input value is `input_tokens -
cached_input_tokens`.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 64,404 | 1,082,112 | 0 | 30,605 | **1,177,121** |

## Harness overhead

Codex created a `codex-auto-review` guardian child rollout while processing
approval requests. Its ID is `019fe76a-a36f-7892-911c-d70ed9e5a31e` and its
`parent_thread_id` matches the tested session.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Guardian | 25,786 | 41,728 | 0 | 713 | **68,227** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 90,190 | 1,123,840 | 0 | 31,318 | **1,245,348** |

## Raw Codex usage

Final cumulative token event for the tested agent:

```json
{
  "timestamp": "2026-08-09T16:49:40.147Z",
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "info": {
      "total_token_usage": {
        "input_tokens": 1146516,
        "cached_input_tokens": 1082112,
        "cache_write_input_tokens": 0,
        "output_tokens": 30605,
        "reasoning_output_tokens": 12648,
        "total_tokens": 1177121
      },
      "last_token_usage": {
        "input_tokens": 50265,
        "cached_input_tokens": 49920,
        "cache_write_input_tokens": 0,
        "output_tokens": 693,
        "reasoning_output_tokens": 516,
        "total_tokens": 50958
      },
      "model_context_window": 258400
    }
  }
}
```

Final cumulative token event for the guardian overhead:

```json
{
  "timestamp": "2026-08-09T16:48:02.231Z",
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "info": {
      "total_token_usage": {
        "input_tokens": 67514,
        "cached_input_tokens": 41728,
        "cache_write_input_tokens": 0,
        "output_tokens": 713,
        "reasoning_output_tokens": 456,
        "total_tokens": 68227
      },
      "last_token_usage": {
        "input_tokens": 15548,
        "cached_input_tokens": 4864,
        "cache_write_input_tokens": 0,
        "output_tokens": 59,
        "reasoning_output_tokens": 0,
        "total_tokens": 15607
      },
      "model_context_window": 258400
    }
  }
}
```
