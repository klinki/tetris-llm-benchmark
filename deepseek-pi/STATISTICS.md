# Statistics

## Session

- Harness: OMP/PI
- Provider/model: `opencode-go` / `deepseek-v4-flash`
- Session ID: `019fe238-a6de-7000-9e4a-fa92e19ad158`
- User messages through implementation: 2
- Model responses through implementation: 108
- Tool calls: 127
- Tool results: 127
- Model/API errors: 0
- Tool errors: 25
- Start: `2026-08-08T16:33:26.458Z`
- Implementation end: `2026-08-08T17:18:39.489Z`
- Raw first-message-to-implementation span: 45m 13.031s
- Excluded wait for the second user message: 1m 1.613s
- Comparable implementation elapsed: **44m 11.418s**

The primary boundary is the completed response to the second user message,
when the game implementation was finished. The first message did not produce
an implementation: the agent made two `read` calls and one `glob`, with no
writes, edits, shell commands, build, or test. The comparable elapsed time
includes this unsuccessful first turn and all work after the second message,
but excludes the interval in which the agent was waiting for that message:

```text
45m 13.031s - 1m 1.613s = 44m 11.418s
```

> This run is still not directly comparable with the one-prompt Codex and OMP
> runs because completing the implementation required a second user message.

## Tested-agent usage

This is the primary benchmark figure. It includes tested-agent requests from
the first two user-message phases and stops at the completed implementation.

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 54,766 | 17,850,880 | 0 | 212,946 | **18,118,592** |

## Harness overhead

OMP generated two session titles before the implementation cutoff. These
requests are not included in `stats.db`'s tested-agent aggregate.

| Source | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Title generation (2 requests) | 705 | 128 | 0 | 802 | **1,635** |

## Combined recorded usage

| Input | Cache Read | Cache Write | Output | Total |
|---:|---:|---:|---:|---:|
| 55,471 | 17,851,008 | 0 | 213,748 | **18,120,227** |

## Normalized OMP output

```text
Messages
  User through implementation: 2
  Model responses: 108
  Tool calls: 127
  Tool results: 127
  Model/API errors: 0
  Tool errors: 25

Append-Only: inactive (setting: auto (opencode-go))

Tokens
  Input: 54,766
  Cache Read: 17,850,880
  Cache Write: 0
  Output: 212,946
  Non-cache tokens (Input + Output): 267,712
  Total: 18,118,592
  Cache-read rate: 99.69%

Requests
  Count: 108
  Average duration: 20.41s

Cost
  Tested agent: $0.117274584
  Title-generation overhead: $0.000323618
  Combined recorded: $0.117598202
```

## Full three-message session (non-primary)

The original session continued after a 45m 3.424s user-wait interval. Its
third message caused one shell call, one edit, and one read over 23.207s. The
only changed file was `README.md`; no implementation source, test, build, or
browser behavior changed. This documentation-only phase is excluded from the
primary implementation boundary.

| Phase | Elapsed | User messages | Responses | Tool calls | Tool errors | Input | Cache Read | Output | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Initial unsuccessful turn | 2m 13.115s | 1 | 3 | 3 | 0 | 18,791 | 18,560 | 260 | 37,611 |
| Implementation after message 2 | 41m 58.303s | 1 | 105 | 124 | 25 | 35,975 | 17,832,320 | 212,686 | 18,080,981 |
| README-only follow-up | 23.207s | 1 | 4 | 3 | 0 | 549 | 1,042,560 | 797 | 1,043,906 |
| **Full tested-agent session** | **44m 34.625s active** | **3** | **112** | **130** | **25** | **55,315** | **18,893,440** | **213,743** | **19,162,498** |

The full session ran from `2026-08-08T16:33:26.458Z` through
`2026-08-08T18:04:06.120Z`: 1h 30m 39.662s including 46m 5.037s of user-wait
time. With the same 1,635-token title overhead, its combined recorded total was
19,164,133. Detailed phase evidence and reproduction queries are in
[`.audit/deepseek-session-analysis.md`](../.audit/deepseek-session-analysis.md).
