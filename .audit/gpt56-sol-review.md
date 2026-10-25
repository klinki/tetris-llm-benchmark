# GPT-5.6 Sol audits (low, medium, high, xhigh)

Audit date: **2026-10-25 (Europe/Rome)**. Four independent `gpt-5.6-sol`
runs in **T3 Code / Codex, standard service tier**, each from the single
prompt “Read the README.md file and implement it”, implementing
[`TETRIS.md`](../TETRIS.md). Run IDs are `gpt-5.6-sol-{low,medium,high,xhigh}`.
This supports [`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).
Historical `sol-codex` and `sol-omp` remain **8.20/8.30** in the repository;
the existing site replacement policy excludes those historical runs.
Tokens, cost, time and effort labels have **no quality-score effect**.

## Method and calibration

Re-read `RANKING.md`'s rubric, weights, Methodology and conformance/coverage
tables; the recent [GPT-5.6 Luna](gpt56-luna-review.md),
[GPT-5.6 Terra](gpt56-terra-review.md), [Qwen Max](qwen38-max-review.md),
[GPT-6 Luna](gpt6-luna-review.md), [Haiku](haiku-review.md),
[Sonnet](sonnet-review.md) and [GPT-6.1 Sol](gpt61-sol-review.md) records,
with their engine/browser/runner patterns. The latter was audited by
**Claude Opus 5.5 (high effort)**. Reviewed all four complete sources, own
suites, HTML/CSS, package/lock/config/server files and supplied statistics.
No predecessor finding was presumed to apply to these independent runs.

Same **0–10 half-point scale**, weights **40/20/20/10/10**: correctness
starts at 10; critical −4/cap 4; major −1.5; minor −0.5; clamp at zero.
A bug is deducted once, from correctness. Missing own assertions determine
tests; audit probes earn no implementation-owned test credit. Related
missing full-spin/hard-drop/PC scoring is grouped as a major, as in
Qwen medium, Muse xhigh and Terra. Otherwise isolated mini, PC/B2B-PC and
stale manual-spin errors remain separate minors, as in GPT-5.6 Luna xhigh.
Wrong physical SRS states/kicks are major; hidden/partial lock-out, capped
reset policy, replacement clocks, refresh remainder and distorted previews
retain their established minor severities. No old score was changed.

The ordinary gravity equation is
`1000*(0.8-(level-1)*0.007)^(level-1)` milliseconds per row. As in prior
audits, fast terminal floors alone are accepted: medium 16 ms, high
16.67 ms (one 60 Hz frame), xhigh 20 ms (one 50 Hz frame). Low's **45 ms**
floor, like Terra's rejected 50 ms floor, makes later play substantially
slower (about 22 rather than 50–60+ rows/second), and is a major progression
defect. This preserves the earlier distinction between a fast terminal
optimization and a substantially slower high-level curve. The benchmark's
additive perfect-clear convention is unchanged; no new scoring rule is added.

All installs/builds/tests/servers ran only in random disposable temporary
copies excluding `node_modules`, `dist`, `dist-test` and `.git`.
**Node 26.0.0**, locked cached TypeScript and installed
**Chromium 156.0.8078.4** were used. `npm ci --ignore-scripts --offline`,
`npm run build` and unchanged `npm test` all pass. All own fixtures use
fixed callbacks/sequences; no seed-dependent own failure was found.
Low's uncounted script, medium's six node:test cases, high's six functions
and xhigh's 83 assertions are different units, not comparable case counts.

Only low/high's hard-coded server port literals change in their temporary
copies; routing/MIME/application behavior remains unchanged. Other servers
honor `PORT`. All servers use free **41000–49999** ports. T3 preview
status/open was checked and its new incognito tab closed; the user's
explicit prior-audit workflow uses the repository's Playwright library.
The checkout stayed on `main`; no commit, stash, reset or revert was made.
No implementation source, registry, pricing, repository scripts/tests or
site source was changed. A pre-existing ignored high `dist-test` tree was
timestamped **2026-10-25 20:16:36 +0100**, before this audit; generated output
was removed at final cleanup, without changing any authored run file.

## Delivery and scores

| Effort | Build | Own workflow | Chromium |
|---|---|---|---|
| low | Pass | Fixed-random assertion smoke passes | Starts |
| medium | Pass | All 6 node:test cases pass | Starts |
| high | Pass | All 6 smoke functions pass | Starts |
| xhigh | Pass | Smoke passes, 83 reported assertions | Starts |

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 3.0 | 4.5 | 8.5 | 9.0 | 8.5 | **5.55** | 3 major, 5 minor |
| medium | 7.0 | 5.5 | 9.0 | 8.5 | 8.5 | **7.40** | 1 major, 3 minor |
| high | 8.0 | 6.0 | 9.0 | 8.5 | 9.0 | **7.95** | 1 major, 1 minor |
| xhigh | 8.0 | 6.5 | 9.0 | 8.0 | 9.0 | **8.00** | 4 minor |

Correctness: low `10−3*1.5−5*0.5=3`; medium `10−1.5−3*0.5=7`;
high `10−1.5−0.5=8`; xhigh `10−4*0.5=8`.
Weighted totals: low `1.20+.90+1.70+.90+.85=5.55`; medium
`2.80+1.10+1.80+.85+.85=7.40`; high `3.20+1.20+1.80+.85+.90=7.95`;
xhigh `3.20+1.30+1.80+.80+.90=8.00`.

### Low — 5.55

Run ID: `gpt-5.6-sol-low`. Summary: **Inverted kicks, incomplete scoring and slow gravity; lock/reset clocks, hidden lock-out and stretched phone hold**.

Scores (correctness/tests/code/simplicity/browser UX): **3.0/4.5/8.5/9.0/8.5**.

Tests **4.5**: the fixed-random 28-line assertion script checks dimensions, a varied six-piece prefix (not a complete bag), one exact right move, locked presence and positive hard-drop points, first/restricted hold and four cleared pre-filled rows with score >=800. The line fixture locks an I above already complete rows, rather than completing a legal Tetris. There are no exact drop points/cell count, whole bag, wall/rotation/kick, independent ghost, held retrieval, integrated line/advanced scoring, timing/cap/ledge, gravity/levels, top-out/restart or browser assertions.

Code **8.5**, simplicity **9.0**: **220 source TS lines** in a DOM-free engine and direct entry. Strict types, injected RNG, small direct methods and no runtime dependencies keep it proportionate. The renderer/input and several scoring/queue methods are densely compressed, public board/state rely on caller discipline, and simulation timing is owned by main. This is more readable than the 37–71-line compressed 7.0 implementations, below the clearer 9.0 engines. UX **8.5**: clear board/grid/ghost, hold, four next previews, DOM stats, a full desktop legend, pause/restart and pointer buttons. Native repeat, fixed canvas backings and no blur cleanup; the confirmed preview defect is charged only to correctness.

Confirmed findings:

- **Major: Vertical SRS kick offsets are applied in the opposite direction.** All 28 states pass after fixed origin translation, but all 48 ordered non-O kick sequences fail. At field (3,18), floor I r0 cannot rotate CW (SRS reaches r1,(4,16)); floor T reaches (3,16) rather than (2,17). Tables already use Y down while rotate subtracts kick Y.

- **Major: T-spin scoring and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single locks award 0/100 through both hard drop and timed lock, rather than full 400/800 or mini 100/200. Full T-spin double is 300 rather than 1200; single perfect clear is 100 rather than 900. Normal clears, B2B and combos pass. These related scoring omissions receive one grouped major deduction.

- **Major: High-level gravity stops accelerating at 45 ms per row.** Actual first-row boundaries match the curve through level ten but levels 14/15/20 all take 45 ms, versus 12/8/1 ms at integer resolution or the accepted fast terminal floor. gravityMs clamps to 45 ms, substantially slower than the prior roughly one-frame floors.

- **Minor: Grounded actions reset lock delay without a cap or success check.** Thirty alternating successful moves spaced 490 ms apart keep a floor O unlocked; fifteen resets should exhaust the allowance. Repeated failed left-wall actions also keep it unlocked at 1000 ms. Ordinary 499/500 ms locking, natural contact and ledge mid-air safety pass.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over exactly 600 ms, the unchanged callback moves O nine rows at 60 Hz and eight at 144 Hz. Both the no-op-DOM engine-clock probe and real Chromium reproduce it; lastFall is assigned now after each fall.

- **Minor: A wholly hidden legal lock does not end the game.** From actual T spawn at field (3,-2), stack only (7,0), four right moves and zero-travel hard drop lock all T cells above visible row zero. The incoming I at (3,-2) is independently open, but gameOver remains false.

- **Minor: Hold retains the outgoing piece gravity phase.** After 800 ms of normal gravity, real C replaces the piece but its first row falls only 200 ms later. The unchanged engine-clock and browser callbacks reproduce one row; lastFall is not reset by hold/spawn.

- **Minor: The phone hold preview is stretched non-uniformly.** At 390x844, the 112x80 hold backing is drawn into a 70x65 CSS box. Its cell width/height ratio is 0.769; a held O is visibly taller than wide. Desktop hold, the next queue and board scale uniformly, and no panel is clipped.

### Medium — 7.40

Run ID: `gpt-5.6-sol-medium`. Summary: **Reversed T orientations; full spins and core clocks work, but mini/PC scoring and hidden lock-out fail**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/5.5/9.0/8.5/8.5**.

Tests **5.5**: all **6 deterministic node:test cases / 56 lines** pass: dimensions/four active cells, one complete initial bag, exact hard-drop points with locked presence, first/restricted/post-lock hold availability, an exact non-PC integrated single, and blocked spawn. There is no wall/rotation/kick, exact four-cell lock, independent ghost, held retrieval/orientation, advanced score, timing/cap/ledge, gravity/levels, hidden lock-out, restart, input or browser assertion. This matches the meaningful but narrow 5.5 suites; audit probes earn no own-test credit.

Code **9.0**, simplicity **8.5**: **500 source TS lines**, a readable DOM-free engine and direct drawing/audio/input entry, injected RNG, strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes, consistent milliseconds and no runtime dependencies. The snapshot copies active/queue but exposes the mutable board; dense rendering lines and public state need discipline. UX **8.5**: clear colored board/ghost, hold/five previews, DOM stats, sound/pause/restart and fitting phone pointer controls. It uses native repeat and fixed backings with no focus cleanup. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Major: All four T states are reversed relative to canonical SRS.** After one fixed origin translation, the independent 28-state oracle fails T0/T1/T2/T3: each is the canonical state two rotations later. Other pieces and the indexed kick lists pass, but those lists now apply to the wrong physical T orientations. A physically up-facing floor T (engine r2) kicks right to field (4,17), rather than canonical left to (2,17).

- **Minor: Mini T-spins receive full-spin scores.** Legal final CW rotation into the mini pocket, then zero-distance hard drop or timed lock, awards 400/800 for zero/single instead of 100/200. The classifier is binary. Full zero/single/double, B2B and combo fixtures pass.

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I empties the board with a single but scores 100 instead of 900. Tetris/no-clear/Tetris-PC totals 2000 instead of 5200. Ordinary normal/full-spin/B2B/combo scoring passes; this isolated omission is a minor finding.

- **Minor: A wholly hidden legal lock does not end the game.** From actual T spawn at field (3,-2), stack only (7,0), right,right,CW,CW,right,right reaches engine r2,(7,-2), wholly above the field and grounded. The incoming I is independently open; zero-travel hard drop leaves status playing.

### High — 7.95

Run ID: `gpt-5.6-sol-high`. Summary: **Canonical core and responsive high-DPI UI; hard drop loses spins, perfect clears and hidden lock-out are missing**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/6.0/9.0/8.5/9.0**.

Tests **6.0**: all **6 deterministic functions / 90 lines** pass: one complete bag through actual spawns, both walls, exact hard-drop points, first/restricted/post-lock held retrieval, a legal single with score >=100, an actual T CCW wall kick with in-bounds assertion, and blocked spawn. This is stronger than Terra xhigh's 5.5 suite in exact drop points, both walls and held retrieval. It has no canonical geometry/exact kick offset, independent ghost/locked-cell coordinates, soft drop, exact normal/advanced score, timing/cap/ledge, gravity/levels, hidden lock-out, restart, input or browser assertion.

Code **9.0**, simplicity **8.5**: **718 source TS lines**, clear strict engine/entry modules, generated rotations, injected RNG, small helpers and a consistent millisecond engine clock. Mutable board snapshots and per-frame full rendering add modest maintenance/work, with no measured performance defect. UX **9.0**: labeled high-DPI board/previews, outline ghost, full desktop legend, live status, pause/resume/restart, custom held repeat, blur pause/release and fitting phone controls. The scoring/lock-out findings are charged only to correctness.

Confirmed findings:

- **Major: Hard drop cancels T-spins and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single hard drops score 0/100 instead of full 400/800 or mini 100/200. Timed locks classify and score them correctly; full double is 300 hard versus 1200 timed. Single perfect clear is 100 rather than 900. These related scoring errors receive one grouped major deduction.

- **Minor: A wholly hidden legal lock does not end the game.** Actual T spawn at field (3,-2), stack only (7,0), four right moves and zero-travel hard drop lock all four cells in hidden rows. Incoming I is independently open, yet status remains playing; lock checks above the array rather than the hidden-row boundary.

### Xhigh — 8.00

Run ID: `gpt-5.6-sol-xhigh`. Summary: **Canonical core and responsive UI; mini/B2B-PC scoring, stale soft-drop spin credit and partial lock-out fail**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/6.5/9.0/8.0/9.0**.

Tests **6.5**: the deterministic **114-line smoke script reports 83 assertions**, of which 56 check only four distinct cells per orientation, not exact SRS geometry. Meaningful assertions cover a bag helper permutation, preset five-piece queue, exact left-wall stopping, a real I wall kick (final rotation/in-bounds), restricted/post-lock held retrieval, exact hard-drop points/four locked cells, an integrated perfect-clear single with score >=900, blocked spawn, gravity-helper ordering, pause freeze and actual level-one fall. There is no exact geometry/kick, independent obstructed ghost, soft points/timing, exact normal/full/mini/B2B/combo/PC total, lock boundary/cap/ledge, levels/crossing, hidden/partial lock-out, restart, input or browser assertion. Raw assertion count does not earn extra credit.

Code **9.0**, simplicity **8.0**: **893 source TS lines** across focused engine/input/renderer/entry modules, strict types, injected RNG, copied board snapshots, direct helpers, one engine clock and no runtime dependencies. The larger renderer, event/toast, best-score and help/input machinery is proportionate but less minimal than the two-module runs, matching similarly sized Sonnet suites. UX **9.0**: labeled high-DPI board/previews, dashed ghost, visible stats/hold/five previews, help, pause, custom held input/blur cleanup and phone pointer controls. Phone supporting panels reflow below the board and are scroll-reachable, not clipped. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Minor: Mini T-spins receive full-spin scores.** Legal final-rotation mini zero/single fixtures score 400/800 through both hard drop and timed lock instead of 100/200. The three-corner classifier returns only a boolean; ordinary full spins, B2B and combos pass.

- **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** Tetris, no-clear lock, then zero-travel Tetris PC total 4000 rather than 5200. The final placement earns 1200 B2B clear plus 2000 ordinary PC, instead of 1200 plus 3200. Ordinary single PC is correctly 900.

- **Minor: Manual soft drop preserves stale T-spin credit.** Rotate T CW in open space, then manually soft-drop fourteen rows into the three-corner pocket and hard-drop zero rows. The engine adds 400 spin points to the fourteen soft points, although the last successful manual action was downward movement; stepDown(true) retains lastMoveWasRotation.

- **Minor: A partially hidden legal lock incorrectly ends the game.** From actual T spawn at field (3,-1), stack only (8,1), four right moves and zero-travel hard drop lock T at (7,-1), with one hidden and three visible cells. Incoming I at (3,-1) is independently open, but gameOver becomes true because lockPiece rejects any negative cell, rather than a wholly hidden piece.

## Reproducible engine evidence

```sh
python3 .audit/run-gpt56-sol-audit.py --offline
```

Omit `--offline` if packages are not cached. The
[runner](run-gpt56-sol-audit.py) rebuilds and executes each unchanged own
suite, then the [engine probes](gpt56-sol-audit.mjs) and
[Chromium assertions](gpt56-sol-browser.cjs) for all four. A passing audit
asserts every recorded finding, including defective outcomes. `--engine-only`
explicitly skips browser evidence, `--effort` selects one run and
`--artifacts-dir` can retain screenshots/JSON/logs **outside the checkout**.
The runner uses installed Playwright/Chromium and downloads no browser.

The engine adapters import unchanged emitted `game.js`. Low's main owns
its clock: a VM supplies no-op DOM/canvas/RAF surfaces and a controlled
`performance.now`, preserving its emitted loop/action bodies. Only imported
constructor/RNG bindings and environment surfaces are supplied; engine rules
are not repaired. Ordinary private properties are accessed only to place
fixtures, observe state or capture rejected rotation candidates. Candidate
interception is discarded before real gameplay probes.

- **All 28 canonical SRS coordinate sets**, seven distinct colors and all
  **48 ordered non-O kick sequences**, both directions, plus wall bounds
  and actual T/I wall/floor kicks. Only a fixed per-piece origin translation
  is allowed: medium (-1,-1) and low I (0,-1). Medium's T states remain
  wrong after that translation; their two-state offset is not normalized
  away. Low alone fails the 48 indexed candidate sequences.
- **100 actual engine bags per effort** (ten seeds × ten bags), clearing
  only the board between actual hard-drop/spawn calls. Hold restriction,
  post-lock retrieval and spawn-orientation reset pass; every actual
  game-over/restart also starts a fresh seven-type opening. Seven obstructed
  ghost poses independently fit with a collision one row below; all four
  welded cells and exact twice-distance drop points match.
- Grounded **499/500 ms** boundary, natural landing/contact, fifteen-reset
  cap, successful/failed action resets and blocked soft descent. All four
  pass ordinary delay and **ledge-move mid-air safety**: O rests on a
  one-cell support for 490 ms, moves one cell off, crosses the old deadline
  airborne for 20 ms, then eventually locks on the floor. Only low permits
  indefinite successful resets and even resets after failed wall actions.
- Exact normal single/double/triple/Tetris, real final-rotation full/mini
  zero/single through **hard and timed locks**, full double through two
  rotations, no-rotation corner lock and manual soft movement after a
  rotation. B2B continuity through a no-clear lock, ordinary-clear break,
  consecutive Tetrises, mini after B2B, level-two combo, pre-clear-level
  scoring at nine-to-ten lines, single PC, single PC after B2B and B2B
  Tetris PC are all exercised. Medium's physical T pocket uses engine
  rotations 1→2 (canonical 3→0); no spin flag is assigned.
- Actual first-row boundaries at levels **1,2,5,9,10,14,15,20**, no gravity
  points, normal/Down transition, piece replacement clocks, and free falling
  at **60/144 Hz** for level-two 1480.001 ms and level-ten/fifteen 600 ms.
  Normal **800 ms / Down / 1 ms** moves one row/point for every run; no
  Haiku/Sonnet-style multi-row transition was found. Browser callbacks
  independently reproduce low's 9/8 refresh result and 200 ms held-piece
  first fall; other runs agree and reset the replacement phase.
- **Public-action hidden lock-out**: a bounded seeded stack/action search
  finds a collision-free, grounded wholly hidden T with incoming I
  independently open; its exact path is replayed from the real spawn and
  pinned in explicit expected evidence. Low/high use stack (7,0) and four
  right moves from field (3,-2); medium uses that stack with
  right,right,CW,CW,right,right. All three continue. Xhigh's replay uses
  stack (7,0),(2,0),(4,3),(3,3),(3,1),(6,2),(5,1), then right,CCW,CCW,right
  from (3,-1), ending r2,(6,-3), and correctly ends. Its separate partly
  visible fixture incorrectly ends. Blocked spawn, inert game-over actions
  and full board/hold/score/lines/level reset pass all four.

| Scoring fixture (zero hard-drop travel unless stated) | Expected | low | medium | high | xhigh |
|---|---:|---:|---:|---:|---:|
| Normal single/double/triple/Tetris | 100/300/500/800 | Same | Same | Same | Same |
| Full zero/single via hard drop | 400/800 | 0/100 | 400/800 | 0/100 | 400/800 |
| Full zero/single via timed lock | 400/800 | 0/100 | 400/800 | 400/800 | 400/800 |
| Mini zero/single via hard drop | 100/200 | 0/100 | 400/800 | 0/100 | 400/800 |
| Mini zero/single via timed lock | 100/200 | 0/100 | 400/800 | 100/200 | 400/800 |
| Full double via hard / timed lock | 1200/1200 | 300/300 | 1200/1200 | 300/1200 | 1200/1200 |
| Tetrises separated by no-clear lock | 2000 | 2000 | 2000 | 2000 | 2000 |
| Consecutive non-PC Tetrises | 2050 | 2050 | 2050 | 2050 | 2050 |
| Level-two combo single | 300 | 300 | 300 | 300 | 300 |
| Nine-to-ten-line single | 100 | 100 | 100 | 100 | 100 |
| Single PC | 900 | 100 | 100 | 100 | 900 |
| Tetris / no-clear / Tetris PC total | 5200 | 2000 | 2000 | 2000 | 4000 |
| Manual soft after rotation: extra spin points | 0 | 0 | 0 | 0 | 400 |

Spin pockets use field T at (3,17), rotation 3, blockers (5,17),(3,19)
and either (3,17) for full or (5,19) for mini. The single adds row 18
outside x=3..5; real CW reaches r0 grounded. Medium's physical equivalents
use its reversed states. PC single fills row 19 except x=3..6 and places
horizontal I at (3,18); Tetrises use an x=4 four-row well. These are the
same independent reference fixtures as the recent audits.

## Chromium evidence

Playwright library, **Chromium 156.0.8078.4**, **1280×800** and **390×844**.
Each supplied server serves its actual build. Entry responses gain only
appended accessors to existing lexical bindings; RAF scheduling and the
clock are controlled so unchanged frame bodies run at exact timestamps.
No input, renderer, frame or engine body is repaired. All eight full-page
screenshots were visually inspected outside the checkout.

| Effort | Desktop board (CSS px) | Phone document width | Phone board | Supporting state / evidence |
|---|---|---:|---|---|
| low | 310×620 at x=403.5 | 390 | 210×420 at x=90 | Hold 70×65 from 112×80 backing, aspect 0.769; four next previews fit |
| medium | 296×592 at x=492 | 390 | 258×516 at x=16 | Hold and five separate previews fit; aspect within 0.02 of square |
| high | 328.5×657 at x=475.75 | 390 | 228×456 at x=81 | Hold/five previews fit; high-DPI backings preserve square cells |
| xhigh | 324×648 at x=473 | 390 | 299×598 at x=45.5 | Hold/five previews reflow below board (y=877), reachable by scrolling |

All required bindings **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C**
receive real key events at both sizes, asserting displacement, all four
rotation bindings, soft row/point, four hard-locked cells and hold. Real
Space causes blocked-spawn game over; subsequent movement/rotation/drop/hold
keys are inert; **real R** empties board/hold/score/lines and resumes. The
real callbacks also repeat the ledge safety, soft transition, held-piece
phase and three refresh-duration checks. Custom 600 ms held Down yields
11 rows/points at both rates in high and 14 in xhigh; low/medium depend on
native OS repeat, which is not certified by synthetic elapsed frames.

All canvases stay within viewport width. Low's desktop page scrolls to
902 px, medium to 847 and xhigh to 898; high fits 800. Xhigh's phone page
is 1104 px high; vertical reflow is not a clipping defect. Forced I previews
paint nonzero pixels in every preview canvas. Low's phone hold distortion
is measured from canvas/backing geometry and visually confirmed. No
application exception, console error or failed required asset occurred;
external Google Fonts and harmless favicon noise are excluded consistently
with prior audits. Other font availability may change vertical positions.

## Supplied generation and isolation context (no score effect)

These are parent/import facts, recorded rather than reconstructed from
provider logs. Statistics/registry/pricing were read without recollection
or accounting changes; unknown harness overhead remains unknown.

- **All four** read Codex's built-in **Sites** documentation under
  `~/.codex/plugins/cache`: `SKILL.md` and `references/preview/local.md`.
  They made **no Sites app calls**. Import used `--allow-outside`, so the
  reads are recorded per run. No other outside access, T3 thread tools or
  benchmark lookups were reported. This is harness documentation, not
  benchmark implementation reference assistance; no quality effect follows.
- **cleanup found nothing left running after any run**. Runs executed
  **one at a time**; `preflight` confirmed free ports before each. Workspaces
  were registered through T3's project tool.
- The four new runs use OpenAI's promotional GPT-5.6 Sol rate effective
  **2026-08-21**, **$4 input / $20 output per million**. Historical August
  Sol runs retain **$5/$30** under dated `pricing.json` periods. Pricing
  and usage/time do not affect any quality score.

| Effort | T3 thread | Native Codex session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:feffd4ce-8853-4bf5-8ce2-0e0a8abcbf7f` | `01a17473-2c2f-7173-8305-04a25830e186` | 734,959 | 2m 42.865s |
| medium | `mcp:98d720e4-7dc6-4661-a55b-d7f2720be77e` | `01a17475-f956-7302-84d6-49d5d1cf4250` | 1,475,552 | 3m 59.996s |
| high | `mcp:9570b177-231a-4bc0-a06f-32fb7df1f448` | `01a1747a-0c0d-7013-a339-c27d1c05aa06` | 1,816,541 | 5m 3.056s |
| xhigh | `mcp:97df827d-9f71-493c-b0ad-d7b11b350933` | `01a1747e-ff77-7761-880c-66fe3eeca609` | 2,931,919 | 7m 29.604s |

## Limits and validation

Focused conformance evidence, not an exhaustive state-space proof,
long-duration playtest, physical touch/HiDPI hardware test, native OS-repeat
measurement or another-browser certification. Representative full/mini,
B2B/combo/PC paths are tested; every possible spin/kick/PC arrangement and
all focus/multi-key combinations remain unverified. Ghost geometry is
independently probed for all seven types; ghost drawing is source-reviewed
and visually checked, without a per-cell browser draw-call oracle. Supplied
session-isolation facts were not independently reconstructed. Every recorded
bug has an exact engine or browser assertion; no suspected issue is scored.

Final checks after recording/regeneration:

- `python3 .audit/run-gpt56-sol-audit.py --offline`: **passed**, all four
  fresh installs/builds/own suites, exact engine outcomes and eight viewport
  passes, including the recorded defects.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**, 58 score rows, fixed
  deductions, ordering, tables and 320 local links.
- `python3 -m unittest discover -s tests`: **passed**, 65 tests, OK.
- `git diff --check`: **passed**.

JavaScript/Python syntax, new-record links/tables, whitespace, allowed file
scope and clean run directories were also checked. All **54** historical
ranking entries are unchanged as parsed data; only four entries are added.

All started browsers/server process groups and disposable copies are closed
or removed. Retained temporary screenshots/logs are deleted after inspection.
No authored implementation or historical score changes; parent owns the commit.
