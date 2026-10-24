# GLM-5.3-Flash audits (low, high, max)

Audit date: **2026-10-24 (Europe/Rome)**. Three independent runs of
`glm-5.3-flash-free` (OpenCode's free GLM-5.3-Flash) in T3 Code / OpenCode,
each from “Read the README.md file and implement it”. Run IDs are
`glm-5.3-flash-free-{low,high,max}`. This record supports
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

## Scope, method and comparability

Re-read the ranking rubric, weights, methodology, conformance and coverage
tables, [`TETRIS.md`](../TETRIS.md), the recent [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md), [Gemini high](gemini-high-review.md) and
[Muse contributor](muse-review.md) reviews and their probe/browser/runner
workflows. Reviewed all three implementations' complete source, own tests,
HTML/CSS, packages/lockfiles, TypeScript configurations and supplied servers.
The same half-point scale and **40/20/20/10/10** weights apply. Correctness
starts at 10: critical −4 with cap 4; major −1.5; minor −0.5. Earlier scores
were preserved. Tokens, cost, time and effort labels do not affect quality.

Every install, build, test and server used a random disposable temporary
copy. Copies exclude `node_modules`, `dist`, `dist-test`, `build` and `.git`.
Low's pre-existing tracked `build/tests` JavaScript remains untouched; its
tests were freshly compiled in the copies. Only the temporary low/high
server's hard-coded port constant changed; max accepts `PORT`. Routes, MIME
handling and application source were preserved. All audit servers used free
ports **41000–49999**. Named Chromium sessions, the independent T3 tab and
server process groups were closed, and temporary copies/artifacts removed.
Work stayed on `main`, without commit, stash, reset or revert. No implementation
files, registry, pricing, repository scripts or repository tests were edited.

All three initial unseeded declared `npm test` workflows passed, including
their builds. Low prints ten unconditional assertions and skips its optional
movement/rotation/drop block after reaching game over. High passes **14 cases**;
max passes **23 cases**. Max additionally has a reproducible **own-test
failure**, described below. The runner declares seed 1 for max's unchanged
workflow and independently asserts its seed-16 failure. This is transparent
test-quality evidence, with no engine-correctness deduction.

## Scores and rationale

| Run | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted | Confirmed bugs |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 2.0 | 3.5 | 8.5 | 8.5 | 8.0 | **4.85** | 5 major, 1 minor |
| high | 7.5 | 7.0 | 9.0 | 8.5 | 8.5 | **7.90** | 5 minor |
| max | 8.0 | 7.5 | 9.0 | 8.0 | 9.0 | **8.20** | 1 major, 1 minor |

Totals are `0.40C + 0.20T + 0.20Code + 0.10S + 0.10UX`:
low `0.80+0.70+1.70+0.85+0.80=4.85`;
high `3.00+1.40+1.80+0.85+0.85=7.90`;
max `3.20+1.50+1.80+0.80+0.90=8.20`.

Each confirmed defect is deducted once from correctness. Audit-added probes
do not earn implementation-owned test credit. Missing tests affect tests,
and no implementation finding is charged a second time to code or UX.
Low's missing per-piece hold, blocked-spawn behavior, advanced scoring and
severely wrong ordinary gravity are broken required features. Its separate
frame-loop defect stops all simulation at a common high refresh rate; it is
a major independently of the engine's wrong rate. Max's much faster ordinary
gravity also receives a major. These differ from the minor soft-transition
edge cases in high and previous cohorts. Mini, perfect-clear, whole-piece
lock-out and presentation findings retain the recent audits' minor severities.
Low's soft points belong to its grouped scoring omission; its soft speed
belongs to its gravity finding. Neither is charged twice.

### Low — 4.85

Summary: **Canonical SRS, but hold, gravity/frame timing, scoring and blocked
spawn fail; previews overlap and clip**.

Tests **3.5**: the **79 test lines** assert dimensions, four-cell counts for
selected orientations, initial active piece/queue, hold flags and a clear of
an already-full row. They never test a complete bag, actual kick, ghost,
exact movement/drop/score, post-lock hold, lock timing/cap/ledge, gravity rate,
levels, blocked spawn, hidden lock-out, restart or browser behavior. The
“gravity locks pieces” assertion accepts `over || piece !== null`, which
does not establish a lock. After 2,000 ticks, the game is already over, so
movement/rotation/hard drop are skipped in the observed runs. Even if reached,
the hard-drop assertion is literally `true`. Two successive holds check only
that the flag remains true, rather than that the second action preserves the
piece. This is narrower than Beam's 4.5 or Muse minimal's 4.5 suites.

Code **8.5**, simplicity **8.5**: **737 source TS lines** in four focused
geometry, game, DOM and bootstrap files, strict checking including unused
locals/parameters, no runtime dependencies, and direct methods. Numeric
piece IDs and unrestricted coordinate arrays require caller discipline;
snapshots alias board/piece, and a maintained held-key set has no consumer.
Those structural limitations are separate from the confirmed rule defects.
UX **8.0** reflects readable colors/outline ghost, labeled hold/next/stats,
four previews, high-DPI scaling and a small complete board that fits the
phone viewport. There is no visible keyboard legend, canvas label, grid,
custom DAS/ARR or touch input. The preview defect is charged only below.

Confirmed findings, in deduction order:

1. **Major: hold stays disabled after its first use (−1.5).** Script T,I,O.
   Rotate T and hold; hard-drop I. The incoming O still has `holdUsed=true`.
   Another hold leaves O and held T unchanged. `lockPiece`/`spawn` never
   restore availability. Correctness **10.0 → 8.5**.
2. **Major: normal and soft gravity are far too fast (−1.5).** O starts at
   y=−1; one tick moves it to 0 at level one, and another tick at level two
   moves it to 1. The floor `Math.max(gravityCellsPerFrame(level),1)` means
   at least one cell per nominal 60 Hz tick, instead of 1000/793 ms per row.
   An empty-board O soft-drops 19 rows in one tick. Correctness **8.5 → 7.0**.
3. **Major: high-refresh animation stops simulation (−1.5).** The unchanged
   actual frame callback receives 120 frames, evenly spaced across 1000 ms.
   It calls `Game.tick` **zero** times; O stays at y=0 and no blocks lock.
   Sixty subsequent 17 ms frames call it **60** times. `floor(delta/16.67)`
   discards the remainder on every frame. Thus gravity and timed locking
   stop at 120 Hz, independently of the engine rate. Correctness **7.0 → 5.5**.
4. **Major: advanced scoring and soft points are absent (−1.5).** Legal
   final-rotation full/mini zero/single locks score **0/100**, versus full
   **400/800** and mini **100/200**. Two Tetrises with a no-clear lock between
   score **1600**, versus **2000**; level-two combo single **200**, versus
   **300**; single perfect clear **100**, versus **900**. Nineteen soft rows
   earn **0** points. Normal clears and hard-drop points work. One grouped
   scoring deduction, matching prior broad omissions. Correctness **5.5 → 4.0**.
5. **Major: blocked spawns relocate above the stack (−1.5).** Fill visible
   row 0 and call the ordinary T spawn. Its origin is moved up to **y=−2**,
   ghost is also −2, and status remains `playing`; only a later hidden lock
   ends the game. In Chromium, a non-full occupied spawn-region fixture
   likewise needs an extra Space after the blocked incoming spawn. The
   search from y=−4 finds empty air rather than rejecting the blocked spawn.
   Correctness **4.0 → 2.5**.
6. **Minor: hold/next previews overlap and clip I (−0.5).** The 360 px
   canvas draws the final I next cell at **x=358,width=17**, losing 15 px.
   Held I's fourth cell **x=310–327** overlaps next I's first **x=301–318**
   at y=50. Unchanged forwarded draw calls and a detail screenshot confirm
   both outcomes of the same insufficient preview space. Correctness
   **2.5 → 2.0**.

### High — 7.90

Summary: **Working core with mini/PC scoring gaps, hidden lock-out,
soft-drop jump and phone sidebar clipping**.

Tests **7.0**: **14 cases / 167 lines** cover one unseeded seven-bag, partial
exact T/I/O geometry, selected kick-table entries, board wall/floor/clear
helpers, exact level-one falling, gravity formula helpers, exact hard-drop
points and integrated normal single, manually flagged three-corner scoring,
hold restriction/post-lock availability, grounded delay, bounded eventual
lock under repeated grounded movement, blocked spawn and restart. The
“wall kicks” board case never performs an engine rotation. The spin case
sets the rotation flag directly; it does not establish a legal rotation.
No own assertion covers an actual kick displacement, independent ghost,
soft drop, level crossing, full spin integration, mini, B2B/combo/PC,
post-lock held-piece retrieval/orientation reset, exact reset cap/ledge,
hidden lock-out or browser input/layout. This is meaningful but narrower
than the 7.5–8.5 integration suites in the recent audits.

Code **9.0**, simplicity **8.5**: **704 source TS lines**, seven focused
typed modules, DOM-free engine, direct board/bag/geometry helpers and one
millisecond clock. Public mutable fixture state and duplicated piece reset
assignments are modest costs; the split remains proportionate. UX **8.5**
reflects the clear desktop grid/ghost, centered complete previews, DOM stats,
visible keyboard legend, custom DAS/ARR and correct game-over overlay.
There is no canvas accessibility label, high-DPI sizing or touch input.
The phone defect is charged only to correctness.

Confirmed findings:

1. **Minor: mini spins receive full scores (−0.5).** Legal final CW into a
   grounded mini slot scores **400/800** for zero/single clears, via both
   hard drop and timed lock, versus **100/200**. Full spins score correctly.
   Correctness **10.0 → 9.5**.
2. **Minor: no benchmark perfect-clear bonus (−0.5).** Zero-travel horizontal
   I at (3,18) completes row 19. Board becomes empty but score is **100**,
   versus **900**. Correctness **9.5 → 9.0**.
3. **Minor: wholly hidden legal locks continue (−0.5).** From real T spawn
   (3,−1), next I, add blockers (2,0),(3,1),(4,1). CW, CCW, left, left
   reach rotation 0,(0,−2), wholly hidden and grounded. Incoming I's actual
   spawn is independently open. Zero-travel hard drop leaves `over=false`.
   Blocked spawn works. Correctness **9.0 → 8.5**.
4. **Minor: soft drop consumes earlier normal time (−0.5).** Fifty 16 ms
   updates accumulate 800 ms without moving O. Real Down then 1 ms moves
   **16 rows**, awarding **16 points**. The ordinary 100 ms soft fixture
   correctly moves/scores two rows. Correctness **8.5 → 8.0**.
5. **Minor: phone supporting state clips (−0.5).** At 390×844, document
   width **464 px**, board **300×600 at x=45**, hold canvas **x=−74**,
   next **x=360,width=104**. Full board fits; hold/stats and next/legend
   extend off-screen. Both CLI and independent T3 inspection agree.
   Correctness **8.0 → 7.5**.

### Max — 8.20

Summary: **Broad rules and responsive UI; wrong gravity curve and no
perfect-clear bonus**.

Tests **7.5**: **23 cases / 352 lines** meaningfully cover four unseeded
bag uniqueness invariants plus twenty-bag distribution, board bounds/row
shifts, all four exact T orientations, actual far I and T floor kicks,
blocked rotation, exact hard/soft points and welded cells, floor ghost,
walls, hold restriction/post-lock retrieval, blocked spawn/restart, exact
normal double and combo totals, level crossing, legal final-rotation full
and mini zero-clear spin integration, and fifth-kick classification helper.
Lock testing checks 300/600 ms rather than exact 499/500, with no movement
reset/cap/ledge assertion. There is no obstructed ghost, full 28-state
oracle, B2B continuity/break, PC, higher-level combo, hidden lock-out, hold
orientation reset, input or browser assertion. Missing tests are separate
from implementation findings.

One own hard-drop assertion is **flaky**. It replaces the active piece with
I and asserts that the next random piece is not I. That next piece can
legitimately be I. With the fixed LCG
`s=(Math.imul(s,1664525)+1013904223)>>>0; return s/2**32`, seed **16**
reproduces **22 passed / 1 failed**, solely “next piece already spawned”.
Seed **1** passes all 23. The runner uses seed 1 for the declared workflow,
then asserts the seed-16 failure in the engine script. It neither changes
the tests nor retries failures until they pass. This limitation affects the
test score, without being counted as a gameplay bug or build failure.

Code **9.0**, simplicity **8.0**: **1,121 source TS lines** in focused field,
geometry/kicks, randomizer, game/scoring, input, renderer, constants and
bootstrap modules, strict types, small direct helpers and no runtime
dependencies. Separate normal/soft accumulators avoid high's transition
jump. Public mutable state, repeated setup and a redundant reset/restart
alias add modest weight. UX **9.0** reflects clear high-DPI blocks/grid/ghost,
a labeled canvas, complete legend, hold dimming, score messages and a fitting
responsive canvas at both sizes. It renders four previews; the task does
not prescribe a preview count. Phone text and board shrink together; no
touch controls are provided. No second UX penalty follows from the rule bugs.

Confirmed findings:

1. **Major: gravity uses the wrong curve (−1.5).** In ≤16 ms updates,
   level-one O does not move at **266 ms** and falls at **267 ms**;
   level two falls at **217 ms**, versus the established **1000/793 ms**
   profile. The hard-coded 267,217,167… table changes ordinary play
   substantially. Ten-line level progression works. Correctness **10.0 → 8.5**.
2. **Minor: no benchmark perfect-clear bonus (−0.5).** Horizontal I at
   (3,20) fills row 21 at zero drop distance. One row clears and the board
   empties; score is **100**, versus **900**. Normal/full/mini/B2B/combo
   fixtures pass. Correctness **8.5 → 8.0**.

The prior audits' selected gravity equation and whole-piece lock-out rule
are also in sections 7 and 10 of the
[2009 design guideline transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline).
The task's Fandom link again returned HTTP 402. Perfect-clear scoring remains
the established benchmark convention, not a claim about every licensed game.

## Reproduction and engine evidence

```sh
python3 .audit/run-glm-audit.py --offline
```

Omit `--offline` when locked packages are not cached. The default command
rebuilds/tests/probes all three and runs [`glm-browser.cjs`](glm-browser.cjs)
through Playwright CLI / Chromium. [`glm-audit.mjs`](glm-audit.mjs) asserts
conforming outcomes and the documented defects. A passing audit is not a
claim that the games are bug-free. `--engine-only` explicitly skips browser
findings; `--effort` selects one run. `--playwright-cli` and
`--playwright-config` override the browser setup. Installed Chromium is reused
without downloading another browser. `--artifacts-dir` may retain JSON/PNGs
**outside** the checkout; default output is disposable. The runner rejects
nonzero commands, CLI error sections, absent final results and changed findings.

Equivalent probes use emitted private properties only for deterministic
fixture setup; production source is not repaired. Low loads its fresh declared
CommonJS test build, while the browser runs its unchanged ESM delivery.
Assertions cover:

- All **28 canonical states**, fixed O-origin translation only; seven distinct
  colors; every CW/CCW kick table; concrete T/I wall kicks both ways and a
  third-test obstacle kick. All three conform.
- Ten seeded **actual engine bags**, wall limits, queue order, first hold and
  restriction, post-lock retrieval/orientation reset where supported, and
  all seven obstructed ghost geometries with four distinct cells, independent
  fit/floor checks and exact hard-drop points/welded coordinates. Low's
  unavailable post-lock hold is asserted as a defect.
- **499/500 ms** grounded boundary, fifteen-reset cap and safe ledge movement
  in high/max. Low uses its fixed clock's **29/30 ticks**. The standard O
  one-cell ledge waits near 500 ms then moves right across the old deadline;
  all three later lock on the floor. Low additionally uses a taller one-cell
  ledge so its erroneous one-row/tick gravity still leaves it airborne at
  the old deadline. No mid-air lock defect was found.
- Exact normal single/double/triple/Tetris, full/mini zero/single after legal
  final rotation via **both hard drop and timed locking**, B2B continuity
  through a no-clear lock and break on a single, higher-level combo,
  pre-clear-level scoring and a single perfect clear. Max's fifth-kick
  classification helper upgrades mini to full; an open position stays non-spin.
- Normal and soft cadence, normal-to-soft timing, ten-line level crossing,
  occupied-spawn behavior, inert game-over actions, full reset and entirely
  hidden lock-out with next spawn independently open. Hidden fixtures use
  public actions from actual spawn, injecting only stack cells.

| Scoring fixture (drop points excluded) | Expected | low | high | max |
|---|---:|---:|---:|---:|
| Normal single/double/triple/Tetris | 100/300/500/800 | Same | Same | Same |
| Full spin zero/single, hard and timed | 400/800 | 0/100 | 400/800 | 400/800 |
| Mini zero/single, hard and timed | 100/200 | 0/100 | 400/800 | 100/200 |
| Two Tetrises with no-clear lock between | 2000 | 1600 | 2000 | 2000 |
| Level-two combo single | 300 | 200 | 300 | 300 |
| Perfect-clear single | 900 | 100 | 100 | 100 |

Spin fixtures use box origin `(3,bottom−2)`, initial T rotation 3, blockers
`(5,bottom−2),(3,bottom)` plus `(3,bottom−2)` for full or `(5,bottom)` for
mini. Fill row `bottom−1` outside columns 3–5 for a single. Real CW reaches
rotation 0 at the same origin and ghost, then hard drop travels zero rows or
timed lock expires. Perfect clear uses I rotation 0 at `(3,bottom−1)` and
bottom-row blockers outside columns 3–6. Bottom is 19 in low/high, 21 in max.

## Chromium evidence

Playwright skill / CLI, installed **Chromium 156.0.8078.4**, desktop
**1280×800** and mobile **390×844**, supplied servers in disposable builds.
T3 status/open were checked; CLI follows the explicitly requested prior audit
workflow. A separate incognito T3 tab independently confirmed high's phone
measurements and unobscured active overlay. No saved login profile was used.
All six viewport screenshots plus low's detail image were visually inspected.

| Run | Desktop board content | Phone document width | Phone board content | Supporting state | Application errors |
|---|---|---:|---|---|---|
| low | 240×480 at x=460 | 390 | 240×480 at x=15 | Fits; preview drawing overlaps/clips at either size | None |
| high | 300×600 at x=490 | 464 | 300×600 at x=45 | Hold x=−74; next x=360,width=104 | None |
| max | 320×640 at x=353 | 390 | ≈202.43×404.87 at x≈13.45 | Entire combined canvas fits | None |

Max's desktop canvas is 598×664 at x=341; phone canvas is ≈378.30×420.05
at x≈5.86. Low's combined canvas is 360×480. High's board border box is
302×602 at x=489 desktop / x=44 phone. Fractional Y/font differences are
not asserted. Clipping measurements distinguish playfield content from
combined canvas and border boxes.

Actual keys **Left, Right, Up, X, Z, Left Control, Down, Space, C** assert
horizontal displacements, all four rotation bindings, soft movement/points,
four hard-locked cells and hold restriction. The delivered frame callback is
retained while its scheduling is driven explicitly for deterministic probes;
real DOM handlers and drawing remain installed. Down is held for 120 ms;
the explicit soft-time observation uses 100 ms for high/max, one fixed tick
for low. High moves/scores two rows; max seven; low moves to the floor with
zero soft points. Fresh normal-to-soft fixtures independently reproduce high's
16-row/point jump and max's absence of a jump after 250 ms normal + 1 ms soft.

The actual low frame callback is additionally exercised at synthetic 120 Hz
and 17 ms spacing, forwarding every engine tick unchanged. A blocked incoming
spawn fixture uses real Space; low's relocated hidden piece needs one more
Space to end. **Real R** resets all three to empty board/hold/score and available
hold. High's overlay changes `none → flex → none`. Low preview observations
forward unchanged `fillRect` calls. No page exceptions, application console
errors or failed application assets occurred; missing favicons are excluded
consistently with earlier audits.

## Generation and isolation context (no score effect)

These facts are supplied by the parent/import record; this quality audit did
not independently rescan implementation session logs or recollect usage:

- **High:** benchmark turn 1 ended at **14:51:03.729 UTC**. Parent cleanup
  stopped the game server it had left running. OpenCode posted “Background
  task completed.”, delivered by T3 as a user message, starting **turn 2**.
  In that turn the agent only restarted `node server.mjs` and checked it with
  `curl`; it changed **no files**. The registry explicitly declares ordinal 2
  in `t3_notification_turns`, and `STATISTICS.md` excludes it from usage/time.
  The audited implementation is the **turn-1 output**.
- **Low and max:** no outside access, T3 tool calls or benchmark lookups;
  leftover servers and `/tmp` scratch were cleaned after each run.
- Runs executed **one at a time**. No contrary implementation evidence was
  found; these facts have no quality-score effect.

Read from the existing statistics and registry, without altering them:

| Run | T3 thread | Native session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:97935acd-cc67-4bd8-b906-2c5be72b1077` | `ses_e91b24a8fffeyU22eLkvbWN2Qu` | 4,356,489 | 10m 15.035s |
| high | `mcp:f45e7f7b-d5bb-4879-ab37-553e6ac91c7d` | `ses_e91a89012ffe6dt74Fh0dlMHWV` | 2,363,761 | 14m 37.371s |
| max | `mcp:46192be9-d6b1-4129-928d-ddd6ce57b912` | `ses_e91985c62ffeAUPZ5eXqUksQ0d` | 4,253,523 | 19m 50.224s |

All have one benchmark user prompt. Effective backend reasoning budgets,
complete harness overhead, normalized model-request/tool counts and actual
cost remain unverified; unknown is not zero. Usage, timing and pricing do
not enter the quality score.

## Limits and repository checks

This is focused conformance evidence, not exhaustive state-space coverage,
a long-duration playtest, another-browser comparison, or physical touch / OS
repeat / display-hardware testing. The refresh-rate defect is established by
the actual callback with controlled timestamps, not a physical 120 Hz monitor.
No suspected issue was entered as a bug without a reproducible probe.

Required checks after report regeneration:

- `python3 scripts/benchmark.py render`: passed.
- `python3 scripts/benchmark.py verify`: passed.
- `node .audit/verify-ranking.mjs`: passed; 181 local links, 29 score rows, deductions/order/tables.
- `python3 -m unittest discover -s tests`: passed; 52 tests, OK.
- `git diff --check`: passed.

The final full fresh-copy runner, JavaScript/Python syntax, new Markdown
links/tables, allowed file scope and cleanup were also checked. No dependency
or build output was placed in an original run directory. Parent owns the commit.
