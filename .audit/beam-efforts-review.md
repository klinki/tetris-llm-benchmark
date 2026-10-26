# Beam effort audits (low, medium)

Audit date: **2026-10-26 (Europe/Rome)**. Independent review of
`beam-free-low` and `beam-free-medium`, model **`opencode-go/beam-free`**,
in **T3 Code / OpenCode**, from the single prompt “Read the README.md file
and implement it”. The task is [`TETRIS.md`](../TETRIS.md).
The October xhigh [`beam`](../beam) remains **5.60**, unchanged.

## Method and calibration

Re-read the ranking rubric, weights, Methodology, conformance and coverage
tables, `ranking.json`, [audit index](README.md), and recent
[Opus efforts](opus55-efforts-review.md), [Terra](gpt56-terra-review.md),
[GPT-5.6 Sol](gpt56-sol-review.md) and [October Beam](october-review.md)
records and probe/browser/runner workflows. Reviewed every delivered source
and test, complete HTML/CSS, package/lock/config, server, README and
statistics file. Low has no authored server; its declared server is the
locked dev-only `http-server`. No transcript or T3 thread-reading tool was used.

Same **0–10 half-point scale**, weights **40/20/20/10/10**. Correctness
starts at 10: critical −4 and cap 4, major −1.5, minor −0.5; clamp at zero.
Each defect is deducted once, from correctness. Related scoring omissions
are one grouped major per run, following October Beam, Terra and Sol.
Tests reflect only the delivered own tests; these audit probes earn no
own-test credit. Tokens, cost, time, effort and isolation have no score effect.

Wrong SRS states/kicks, absent required features and wrong ordinary gravity
are major. Gravity-tick locking, replacement clocks, hidden lock-out,
non-blocking controls and phone clipping retain prior minor severities.
Medium's browser startup is critical, using Nemotron/GPT-5.6 Luna medium's
cap method. Its subsequent engine results are **diagnostics**, not delivery
passes. Scores for every existing run, including old Beam, are preserved.

## Delivery and scores

| Run | Build | Unchanged own workflow | Delivered Chromium |
|---|---|---|---|
| low | Pass | Prints `ok`; zero assertions | Starts; restart stops gravity |
| medium | Pass | Four assertions pass | Fails: `exports is not defined` |

| Run | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 0.0 | 0.0 | 7.0 | 9.0 | 6.5 | **2.95** | 7 major, 4 minor |
| medium | 0.0 | 3.5 | 8.0 | 8.5 | 6.5 | **3.80** | 1 critical, 4 major, 3 minor |

Correctness: low `max(0,10−7×1.5−4×0.5)=0`; medium
`max(0,min(4,10−4)−4×1.5−3×0.5)=0`.

- Low: `0×.40 + 0×.20 + 7×.20 + 9×.10 + 6.5×.10 = 0+0+1.40+.90+.65 = 2.95`.
- Medium: `0×.40 + 3.5×.20 + 8×.20 + 8.5×.10 + 6.5×.10 = 0+.70+1.60+.85+.65 = 3.80`.

### Low — 2.95

Summary: **Basic playable falling blocks; missing hold/ghost/next/SRS,
incomplete scoring, wrong gravity and broken restart**.

Tests **0.0**: the complete 18-byte `src/test.ts` is `console.log('ok');`.
`npm test` compiles then runs that file, without importing or exercising
the game and without any assertion. Successful compilation is recorded
as build evidence, not a gameplay test. This is below Terra medium's 1.5
text-presence checks, which at least inspect emitted content.

Code **7.0**, simplicity **9.0**: **93 source TS lines (92 newline characters)** in
one short DOM/global-state module. Its direct collision/rotation/clearing
helpers are understandable and have little machinery. `any` piece data,
compressed nested loops/handlers, separate mutable occupancy/color grids,
global RNG and DOM-coupled simulation weaken maintainability, consistent
with the earlier compact 7.0 implementations. Unused drop interval data
and no engine boundary are structural observations, not repeated bug penalties.
UX **6.5**: readable flat seven colors and DOM score/level/line state on a
large black board. No grid, keyboard legend, canvas label, pointer controls,
high-DPI adaptation or focus handling. The missing required mechanics and
phone defect are deducted in correctness only.

### Medium — 3.80

Summary: **Build/tests pass but CommonJS prevents browser startup;
diagnostic SRS, scoring, gravity, lock clocks and supporting UI fail**.

Tests **3.5**: **16 lines / four assertions**, unseeded but order-independent:
initial active existence, exact one-column right movement, a loose post-drop
condition, and clearing one already-full row through the helper. The
post-drop condition (`current !== null || gameOver === false`) does not
establish a lock, replacement, score or cell count. The other three are
meaningful narrow smoke assertions. No bag, wall/rotation/kick, exact drop
points/cells, hold, ghost, integrated scoring, timing, gravity/levels,
top-out/restart, input or real browser assertion exists. Node CommonJS tests
never load the broken browser entry. Breadth fits the earlier 3.5 smoke suites.

Code **8.0**, simplicity **8.5**: **358 source TS LOC**, readable DOM-free
engine helpers/state plus a direct browser entry, strict TypeScript and no
browser runtime dependencies. `any` shape tables, mutable global randomness,
public mutable state, duplicate/unused spawn logic, unused lock fields and
an unused `over` variable add maintenance cost. This is clearer than compact
7.0–7.5 engines, below the strongly typed, injected-RNG 9.0 implementations.
UX **6.5** follows the earlier critical-delivery calibration: assess the
simple static page/source presentation; live gameplay cannot be evaluated.
The startup failure is deducted only from correctness, with no second UX
failure deduction. Diagnostic rendering shows a clear small board/ghost and
text stats; no legend, labels, pointer controls, high-DPI or focus handling.

## Confirmed low findings and exact fixtures

Coordinates are visible-field cells, x=0..9, y=0..19. Engine probes run
unchanged emitted action/RAF bodies in a VM with no-op DOM/canvas/RAF
surfaces; the same assertions repeat against the served script in Chromium.
Appended accessors only set fixtures/observe state; they repair no rule.

1. **Major: rotations and kicks are not SRS.** Compare all 28 coordinate
   sets with the independent oracle, allowing only one fixed origin
   translation per piece. **13 fail**: I1/I2/I3, J1/J2, L1/L2, S1/S2,
   T1/T2, Z1/Z2. Cropped rectangular matrices change pivots as they rotate.
   A floor T at (3,18), spawn orientation, rejects Up and stays unchanged;
   SRS rotates/kicks to r1,(2,17). No kick candidates are implemented.
2. **Major: hold is absent.** Actual C leaves the complete current pose
   unchanged; no hold state, hold method or preview exists. Engine and real
   browser key assertions agree. This includes the absent hold display.
3. **Major: ghost is absent.** Clear the stack, put T at (3,0), draw:
   exactly four active 31×31 block fills, zero translucent/outline ghost
   draws. There is one board canvas and no other ghost representation.
4. **Major: next preview is absent.** There is an internal bag but no next
   presentation. The same four-cell draw fixture and complete DOM/source
   inspection show only the board and score/level/lines. This is independent
   of the absent hold mechanic and the absent landing projection.
5. **Major, grouped scoring: drop and advanced scoring are missing.**
   O at (3,0): real Down moves to y=1 with **0**, then Space welds four
   cells and still scores **0**, instead of 1 plus twice hard distance.
   Normal zero-travel non-PC clears correctly score 100/300/500/800.
   A legal final CW T rotation into the full single pocket scores **100**,
   expected **800**. Two Tetrises with a no-clear O between total **1600**,
   expected **2000**; a second consecutive level-two single adds **200**,
   expected **300**. A horizontal I at (3,19) completing row 19 except
   x=3..6 empties the board and scores **100**, expected **900**. Spin,
   B2B, combo and PC state is absent. These receive one grouped deduction.
6. **Major: gravity uses 1000/level rather than the Guideline curve.**
   With an O at (3,0), invoke the real update at successive integer
   timestamps. First rows at levels 1/2/5/10 are **1001/501/201/101 ms**,
   versus 1000/793/356/65 ms at integer resolution. The one-ms threshold
   alone is not a second deduction; the materially different curve is major.
7. **Major: R restart does not restart the stopped animation loop.**
   Floor O at (0,18), blocker (3,0), incoming O: Space triggers game over.
   Consume the pending callback, which returns without scheduling another.
   Real R clears board/score/lines/level and spawns a piece but schedules
   **zero** callbacks. Advancing to timestamp 5000 leaves it at y=0.
   Engine scheduling-count and native-key browser assertions reproduce it.
8. **Minor: lock delay follows a failed gravity tick.** Floor O at
   (3,18), update(500): zero welded cells. Move right, update(1001): four
   weld. There is no elapsed grounded 500 ms clock or capped reset policy.
   These manifestations share the established lock-policy deduction.
9. **Minor: Left Ctrl does nothing.** T in open space responds to Up/X/Z;
   real ControlLeft leaves its complete pose unchanged. The handler has
   no `Control` branch. This is separate from geometric SRS fidelity.
10. **Minor: terminal movement remains enabled.** In the actual blocked
    incoming-O game-over fixture above, Right moves the blocked active
    O by one column even while gameOverFlag is true. Engine and real UI
    handler both lack the terminal guard except for R.
11. **Minor: the phone clips the playfield and stats.** At 390×844,
    document width **399**; bordered canvas x=**−8.796875**, 324×644.
    The 320×640 field starts at **−6.796875**, clipping its left edge;
    the stats extend past the right viewport. Desktop canvas x=436.203125.
    Geometry is pinned within .03 px, with screenshots inspected.

The full-spin pocket uses blockers (5,17),(3,19),(3,17), row 18 outside
x=3..5 and the run's actual three-CCW T matrix at (3,17), then actual Up
and zero-distance Space. The grouped-score wells use vertical I at
(4,16), bottom n rows except x=4, plus (0,10) to prevent accidental PC.

## Confirmed medium findings and exact diagnostics

1. **Critical: delivered CommonJS cannot start in the browser.** `tsconfig`
   emits `Object.defineProperty(exports,...)` and `require('./game')`, but
   index.html loads main with a plain script. At both sizes Chromium
   throws exactly **`exports is not defined`** before any initialization.
   HUD is empty; canvas keeps its default **300×150** backing; RAF count
   is zero; all ten required keys including R leave the HUD empty. Required
   HTTP assets succeed; the script format is the failure. Cap correctness at 4.
2. **Major: six states and generic kicks differ from SRS.** The 28-state
   oracle fails **I2/I3/S2/S3/Z2/Z3**; these pieces store only two states.
   Floor T r0,(3,18), CW becomes r1,**(3,17)** rather than **(2,17)**:
   tryRotate uses one generic nine-offset list for all pieces/transitions.
3. **Major, grouped scoring: spin/B2B/combo/PC are absent.** The real
   final-rotation full single scores **100** instead of 800. Two Tetrises
   separated by a no-clear O total **1600** instead of 2000; a second
   consecutive logical-level-two single adds **200** instead of 300.
   Single PC is **100** instead of 900. Normal clears and exact soft/hard
   points otherwise work. Use the same pocket/well as above, with T index
   2, canonical r3, and vertical I index 0,r1,(2,16).
4. **Major: gravity uses an NES-style table.** Logical levels 1/2/5/10
   (internal 0/1/4/9) return **800/717/467/100 ms**, rather than the
   established Guideline curve. This matches prior wrong-table major findings.
5. **Major: hold and next are never displayed.** Headless hold restriction,
   retrieval and orientation reset work, and five queued entries exist.
   In the unchanged diagnostic renderer, forcing held O and five next I
   pieces changes **neither any draw call nor HUD text**. There is just
   one board canvas. This single missing supporting-state presentation
   deduction covers both unavailable previews, independently of startup.
6. **Minor: locking follows gravity failure, without delay/reset cap.**
   Real emitted tick with a floor O: tick(500) leaves zero cells; move
   right, tick(800) welds four. `lockTimer`/`onGround` fields are unused;
   successful movement does not establish a new 500 ms lock interval.
7. **Minor: hold inherits the outgoing gravity phase.** Fresh O at y=0,
   tick(600), actual hold, tick(800): replacement has already fallen one
   row after only **200 ms**, instead of a fresh 800 ms native interval.
8. **Minor: a legal entirely hidden lock continues play.** Stack only
   **(4,2),(2,1),(8,2),(5,3),(0,0),(3,3)**; actual exported T spawn;
   **CW×4, Left, CW×4** reaches r0,(0,−2), all four cells hidden and
   ghost at −2. Incoming I at (3,0) is independently open. Zero-travel
   hard drop discards hidden cells, leaves six stack cells and
   **gameOver=false**, rather than ending the game. No pose/spin flag is
   injected in this path.

Each source diagnostic repeats in Chromium using the **unchanged emitted
CommonJS bodies** with explicit exports/require bindings supplied in a
separate evaluation, after photographing/asserting the real startup failure.
That evaluation is never described as repaired or delivered gameplay.
Node independently runs the same engine and emitted-clock assertions.

## Reproduction, browser results and limits

```sh
python3 .audit/run-beam-mimo-audit.py --offline
```

The shared [runner](run-beam-mimo-audit.py), [engine probes](beam-mimo-audit.mjs)
and [Chromium assertions](beam-mimo-browser.cjs) cover these runs and
[MiMo](mimo-v26-flash-review.md). Omit `--offline` when npm cache is missing.
`--effort low|medium|mimo` selects a run; `--engine-only` explicitly skips
browser assertions. Passing asserts exact defective and conforming outcomes.

Installs/builds/unchanged own suites/servers run only in random disposable
copies, excluding node_modules/dist/dist-test/.git. **Node 26.0.0**, locked
TypeScript **5.9.3**, installed Playwright **1.64.0**, Chromium
**156.0.8078.4**. All servers use their declared **npm start** workflow;
only the hard-coded **8321 port literal** changes in low's copied package
and medium's copied server. MiMo honors PORT unchanged. Only free
**41000–49999** ports are used; routes/MIME/app bodies stay intact.
The requested prior-audit Playwright-library workflow is used; T3 preview
status/open was checked and its own incognito tab closed.

Both Beam pages lack viewport metadata. Measurements use CSS viewport
390×844 with the prior audits' desktop user agent, not physical mobile
emulation. Low desktop field is 320×640, bordered 324×644; medium's
delivered canvas is blank default 300×150 at x=490 desktop/x=45 phone,
phone document width 390. Six screenshots across all three runs were
visually inspected. Low has no application exceptions; medium's one exact
startup exception is asserted. No unexpected console errors or required
asset failures; favicon 404s are excluded.

Probes additionally cover 100 bag permutations for each Beam, medium's
seven independently obstructed ghost landings with exact drop points/four
welded cells, first/restricted/post-lock held retrieval/orientation, normal
scores and public hidden path. Low's random-comparator shuffle preserves
seven-type batches; unbiased permutation frequencies are not certified.
This is not exhaustive state-space, long-duration, physical touch/HiDPI,
native repeat or another-browser certification. No hidden-lock path is
claimed for low's no-kick geometry; medium's live browser cannot be tested.

## Supplied generation and isolation context (no score effect)

Both isolation checks report **no access outside the workspace**, supplied
by the parent and recorded without reopening transcripts. Statistics are
unchanged; unknown overhead/cost/request/tool counts remain unknown.

| Run | Native OpenCode session | T3 thread | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `ses_e88b8dd26ffexZj7cO24zJtWzp` | `mcp:1b154e65-9076-4a49-a51a-a5a7a4d1c4bf` | 82,729 | 16.402s |
| medium | `ses_e88b869deffet1EBLMkaNH1HiX` | `mcp:65f86f3c-4dc0-471e-87b5-c66ffc02e61f` | 419,090 | 38.039s |

This session's **high and xhigh attempts were discarded** and receive no
score. The [attempt record](beam-attempts.md) documents the first high's
outside disk search, xhigh's Space-bunny project copy and the second high's
permission bypass/October Beam copy. Max was never started. These facts
are context only and do not change either imported run's quality score.
The older October xhigh Beam keeps its historical **5.60** calibration.

## Validation and cleanup

The complete offline runner passed all three fresh installs/builds/own
workflows, engine assertions and six Chromium viewport passes. Final
`python3 scripts/benchmark.py render`, `python3 scripts/benchmark.py verify`,
`python3 -m unittest discover tests` (**66 tests, OK**),
`node .audit/verify-ranking.mjs` and `git diff --check` passed.

Every disposable copy, screenshot/log evidence folder and owned server/
Chromium session was deleted or closed. The runner keeps its own evidence
inside its TemporaryDirectory and cleans on success/failure/interruption.
No implementation, scripts/tests, registry or pricing file was edited;
no existing score changed. Work stayed on main; no commit, stash, reset,
revert or push. The parent commits.
