# Hy4 Flash and Qwen4 Max — November 16, 2026

The independent reviewer is GPT-6.1 Sol (`gpt-6.1-sol`) at `xhigh`, running as
a T3 Code Codex subagent. T3 read-back confirms `relationshipToParent=subagent`,
model and explicit reasoning effort. The mapped native Codex rollout confirms
`gpt-6.1-sol`, `effort=xhigh`, and the benchmark checkout. Its native session is
`01a1e543-0c67-7443-8d00-47055ec01d14`. The review thread is
<t3-thread://v2/be26fbd3-1b19-4ec5-a479-19a35432c8a1/thread:delegated-task:command%3Amcp%3A3c3c15dd-be42-4a00-9480-ed5eb183bfdf%3Adelegate-task%3Anov16-sol61-xhigh-independent-review-and-accounting>.
The [numeric evidence](nov16-results.json) retains the provenance and findings.

The earlier four proposals came from the parent's Sol high self-review. This
review independently reread the delivered engines, geometry, scoring, inputs,
rendering, server/build configuration and own tests, then reran all five builds,
own suites, engine fixtures and real-browser checks. It confirms those four
weighted scores and adds Hy4 Flash none. The parent read the completed review, verified its T3/native provenance and
reports, accepted the findings, and completed the remaining project archival.

## Generation and preservation

The original generations ran sequentially in this exact order.

1. `opencode-go/hy4-flash-free`, `high`.
2. `opencode-go/hy4-flash-free`, `none`.
3. `opencode-go/qwen4-max`, `high`.
4. `opencode-go/qwen4-max`, `low`.
5. `opencode-go/qwen4-max`, `xhigh`.

Each used the unchanged task README and fixed prompt, full-access/default modes,
an isolated randomly named workspace, source permission locks and the existing
cleanup/import gates. The documented direct T3 registration fallback was used.
All five delivered implementations and own tests retain their original hashes.
The 86 historical registry and score entries and prior prices are preserved.

## Token reconciliation and import

Hy4 Flash none completed successfully after a recovered `provider.rate-limit`
overload. T3's original `turnTokenUsage.usageStatus` remains `partial` in its
database, the statistics report and the [native reconciliation](nov16-native-usage.json).
The run was imported with `--reconcile-native-usage`.

The reviewer independently opened `~/.local/share/opencode/opencode.db` read-only.
For `ses_e1c3cd4a8ffeFQJhTkbmNTSYLg`, all 48 `session_message` assistant records
have completed timestamps and full token components. Forty-seven finish with
`tool-calls`, and the final record finishes with `stop`. There are no assistant
errors, missing usage, child sessions or extra user prompts. The session's
model/provider/variant and directory match T3, and `idle_outcome=succeeded`.

| Recorded component | Assistant-message sum | Native session total | T3 total |
|---|---:|---:|---:|
| Uncached input | 42,089 | 42,089 | 42,089 |
| Cache read | 1,343,232 | 1,343,232 | 1,343,232 |
| Cache write | 0 | 0 | 0 |
| Output | 22,688 | 22,688 | 22,688 |
| Reasoning subset | 0 | 0 | 0 |
| Input including cache | 1,385,321 | 1,385,321 | 1,385,321 |
| Total | **1,408,009** | **1,408,009** | **1,408,009** |

The new collector path requires explicit per-run reconciliation metadata,
completed single-turn OpenCode identity, complete native assistant records,
a final stop, succeeded idle outcome and exact agreement of all components.
Every refresh rechecks the read-only native database. The ordinary partial-usage
rejection and import rollback remain active. The successful generation retains
its actual completion status and timing. No additional failed-request billing
is reported by these records. Harness overhead remains unverified.

## Scores and calibration

The same half-point rubric and 40/20/20/10/10 weights apply. Correctness starts
at 10, with critical failures capped at 4 before subtracting 1.5 per major and
0.5 per minor, then clamps at zero. Related manifestations are grouped once.

| Run | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Own checks |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hy4 Flash high | 5.5 | 7.0 | 9.0 | 8.5 | 7.5 | **7.00** | 25 pass |
| Hy4 Flash none | 0.0 | 7.0 | 9.0 | 8.5 | 6.5 | **4.70** | 19 pass |
| Qwen4 Max high | 7.0 | 8.0 | 9.0 | 8.5 | 8.5 | **7.90** | 23 pass |
| Qwen4 Max low | 6.0 | 7.0 | 9.0 | 8.5 | 8.0 | **7.25** | 21 pass |
| Qwen4 Max xhigh | 8.0 | 8.0 | 9.0 | 8.5 | 9.0 | **8.35** | 63 pass |

Hy high tests cover basic engine behavior, one I kick, clears, hold and floor
timing, with limited advanced integration. None has useful seed, bag, board,
scoring, hold and frame-lock tests. Its named T wall-kick case rotates in open
space, and its I case also succeeds at the identity offset. Those assertions
do not establish actual wall-kick selection. Neither Hy suite covers browser
delivery, spin/PC integration, reset boundaries or canonical L geometry.

Qwen high has meaningful SRS rejection, integrated spin-double, PC/combo and
lock-cap checks. Low's advanced scoring coverage mainly calls the scoring
helper. Xhigh has broader real timed-spin, B2B/PC, floor-clock and reset-cap
checks. Raw check counts use different units. None of the five own suites tests
browser input or presentation. Audit probes receive no own-test credit.

All five use readable typed modules, pure engines and dependency-free runtime
code. None additionally declares Node types as a development dependency. Code
and simplicity judgments assess structure. Browser UX 6.5 for none follows the
existing Nemotron/GPT Luna static-page calibration. Its critical startup failure
is deducted once in correctness, while UX assesses the delivered static layout.

## Findings and independent objections

The [ranking details](../RANKING.md#november-16-2026-cohort) contain every grouped
deduction and exact reproduction. Expected and actual results remain distinct
in the machine-readable evidence.

- Hy high has two majors and three minors. It repeatedly spawns at visible
  -20/-19, omits spin/PC scoring and breaks B2B on a no-clear, discards landing
  time, mishandles reset allowance and clips the phone board. The added ledge
  probe confirms that the spent allowance also survives a genuinely lower row.
  This extends the existing reset-state group and leaves the total at 7.00.
- None has one critical failure, two majors and six minors. Its delivered
  CommonJS output throws `exports is not defined` before initialization in
  both browser sizes. Diagnostic Node probes find L state 3 shifted one column
  right, 32/672 rotation mismatches, missing spin/PC scores, one-row-per-frame
  gravity, inverted airborne/reset state, premature partial lock-out, lost
  above-buffer minos and sticky held input after blur. Its static phone page
  overflows to 438px, with the hold canvas above the reachable top. Correctness
  clamps to zero and the weighted result is 4.70.
- Qwen high retains its six minors, including HD travel credit, early landing
  lock, soft-entry jump, buffer loss, restart bag and clipped phone panels.
- Qwen low retains its eight minors, including combined hard/soft spin history,
  late landing lock, soft-entry jump, gravity cap, old-lowest reset renewal,
  partial lock-out, phone clipping and overlapping stats ink.
- Qwen xhigh retains its four grouped minors, including zero-HD/soft-spin
  history, soft-entry jump, buffer loss and restart bag. Its landing remainder
  and responsive phone geometry pass.

HD-SPIN-1 uses actual rotations. Travel scores are 28/28/128/128/28 in generation
order. Zero-travel mini/full hard locks score 0/0, 0/0, 100/400, 100/400, 0/0.
Timed controls give 0/0 for both Hy runs and 100/400 for each Qwen run. Qwen
failed lateral moves preserve mini/full credit in the additional controls.
Automatic-gravity spin history retains the specification's unresolved status.

All four earlier implementations match all 28 shapes, 48 ordered kick lists
and 672 actual SRS rotations. None's L3 mismatch is independent of its matching
kick tables. All five pass 100 actual dealt bags. None resets a fresh randomizer
and preserves no-clear B2B, correcting any inference that it necessarily shares
Hy high's B2B defect. Its frame ticks retain the expected landing time.

The first additional ledge fixture still overlapped a support column, so it
could not test descent. The reviewer corrected the fixture by moving beyond
both support columns before recording the final comparison. Qwen's three
variants then pass the genuinely lower-row control, while both Hy runs fail.
A Node-only adapter exposes none's scoring fields and converts elapsed time to
60Hz ticks. It leaves every delivered rule method intact. It proves diagnostic
engine outcomes only, and supplies no evidence of playable browser delivery.

## Browser and reproduction

The [complete runner](run-nov16-audit.py) installs locked dependencies offline,
builds and runs all unchanged suites in disposable copies, executes the
[shared fixtures](nov16-engine.mjs) and [additional reviewer probes](nov16-reviewer-extra.mjs),
then runs served-module checks through the [browser runner](run-nov16-browser.py).

```sh
python3 .audit/run-nov16-audit.py --offline
```

The Playwright skill CLI uses the cached Chrome for Testing Chromium-1248
executable, version 156.0.8078.4, at 1280x800 and 390x844 with DPR 2. The shared
T3 preview opened none's page, but its snapshot timed out twice. The cached
Chromium fallback produced all ten inspected screenshots and numerical logs.
The [none browser fixture](nov16-none-browser.template.js) serves the original
classic-script build without a CommonJS shim, bundler or module conversion.
It records the startup exception, transparent canvases, unchanged statistics
and inert required keys plus R in both views.

For the four playable builds, the [browser fixture](nov16-browser.template.js)
exercises actual left/right, Up/X, Z/left-Ctrl, Down, Space, C and R events.
Routes only expose the game instance and shared audit module. The copied server
listen port is adapted where required. Stack, pose and clock fixtures leave
spin eligibility and rule bodies untouched. Node and both Chromium views agree
on every shared fixture. Known defects remain marked as conformance failures.

Phone document widths are 453/438/539/525/390px in generation order. Hy high's
board starts at x=-39. Qwen high's board fits at x=45 while its supporting panels
are clipped. Low's 660px canvas starts at -135, and its measured label/value
ink overlaps. Xhigh reflows the supporting panels below its fitting board.

## Validation and completion handoff

The evidence records repository tests, report/source verification, 91 ranking
rows with exact detail headings, local links, historical preservation and site
checks. All five source sets match pre-review hashes, including none's 17
original archived files. Temporary implementation copies, servers and browser
sessions are removed after verification. Artifacts remain under ignored
`output/playwright/nov16/`.

The full historical site game build retains its existing MiniMax xhigh root
`index.html` failure. Page generation with `site --skip-games` and the site
browser check cover the index and 84 included run pages. The five new games
were independently served at both requested sizes, including none's documented
runtime failure. This is a focused Chromium/engine review with physical touch,
other browsers and exhaustive state-space coverage outstanding.

All five dedicated run projects are archived, with read-back timestamps in
the evidence. The parent independently confirmed the reviewer turn completed
at 2026-11-16T17:07:33.646Z and verified its actual Sol xhigh
model/effort and native session mapping. Reports, source accounting, all 78
repository tests, and ranking validation passed before the remaining Hy4 none
project was archived. Its confirmed `archivedAt` is
`2026-11-16T17:10:04.282Z`. The main benchmark project was untouched.
No implementation was rerun or changed. All work remains uncommitted.
