# Statistics

## Session

- Harness: Codex Desktop
- Provider/model: OpenAI / `gpt-5.6-sol`
- Session ID: `019fea5f-5c72-7df2-bf83-3a3edfbf7192`
- User messages: 1
- Assistant messages: 7
- Tool calls: 29
- Tool results: 29
- Start: `2026-08-10T06:32:39.029Z`
- End: `2026-08-10T06:39:01.046Z`
- Elapsed: 6m 22.017s

The timing starts at the benchmark user message and ends at the root task's
completion event.

## Tested-agent usage

This is the primary benchmark figure. Codex reports cached input inside
`input_tokens`, so the normalized Input value is `input_tokens -
cached_input_tokens`.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 50,936 | 843,264 | 0 | 14,835 | **909,035** |

## Harness overhead

Codex created a `codex-auto-review` guardian child rollout while processing
approval requests. Its ID is `019fea63-1466-7b12-9a36-fdd3f81aba9a` and its
`parent_thread_id` matches the tested session.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Guardian | 26,301 | 14,592 | 0 | 478 | **41,371** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 77,237 | 857,856 | 0 | 15,313 | **950,406** |

## Raw Codex usage

Final cumulative token event for the tested agent:

```json
{
  "timestamp": "2026-08-10T06:39:01.032Z",
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "info": {
      "total_token_usage": {
        "input_tokens": 894200,
        "cached_input_tokens": 843264,
        "cache_write_input_tokens": 0,
        "output_tokens": 14835,
        "reasoning_output_tokens": 1438,
        "total_tokens": 909035
      },
      "last_token_usage": {
        "input_tokens": 36756,
        "cached_input_tokens": 35584,
        "cache_write_input_tokens": 0,
        "output_tokens": 563,
        "reasoning_output_tokens": 163,
        "total_tokens": 37319
      },
      "model_context_window": 258400
    }
  }
}
```

Final cumulative token event for the guardian overhead:

```json
{
  "timestamp": "2026-08-10T06:37:55.643Z",
  "type": "event_msg",
  "payload": {
    "type": "token_count",
    "info": {
      "total_token_usage": {
        "input_tokens": 40893,
        "cached_input_tokens": 14592,
        "cache_write_input_tokens": 0,
        "output_tokens": 478,
        "reasoning_output_tokens": 352,
        "total_tokens": 41371
      },
      "last_token_usage": {
        "input_tokens": 15371,
        "cached_input_tokens": 4864,
        "cache_write_input_tokens": 0,
        "output_tokens": 110,
        "reasoning_output_tokens": 56,
        "total_tokens": 15481
      },
      "model_context_window": 258400
    }
  }
}
```
