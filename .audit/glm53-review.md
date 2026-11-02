# Full GLM-5.3 low/high audit

Audit: **2026-11-02, Europe/Prague; GPT-6.1 Sol, xhigh, standard tier**
in T3 Code / Codex. This auditor performed generation orchestration, source
review, probes and scoring itself. Only the two tested GLM agents were launched;
no audit/review delegation. All **76 historical scores are unchanged**.

## Method, calibration and scores

Reviewed every delivered file, including all eight low/seven high application
TS modules, the complete own tests, HTML/CSS, server, package/lockfile,
TypeScript configuration, ignore files, task README and generated statistics.
Quality grading used those files and independent outcomes, **no implementation
transcript**. Generation metadata/isolation records were inspected separately;
a minimal T3 metadata read was used to settle each completed thread.

Read the current RANKING rubric, conformance/coverage/methodology, audit index,
newest Qwen Max xhigh/Flash, Opus effort/rerun and auditor-agreement records.
The existing 0–10 half-point scale and weights **40/20/20/10/10** apply.
Correctness starts at 10; critical −4/cap 4, major −1.5, minor −0.5, clamp 0.
Each grouped finding is charged only to correctness. Own-test omissions set
the tests score; these audit probes earn no own-test credit. Time, tokens,
effort, subscription and pricing do not affect quality.

| Run | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| Full GLM-5.3 low | 7.0 | 7.5 | 9.0 | 8.5 | 8.5 | **7.80** | 6 minor |
| Full GLM-5.3 high | 5.0 | 7.0 | 9.0 | 8.5 | 8.5 | **6.90** | 1 major, 7 minor |

Low: `10−6×.5=7`; `2.80+1.50+1.80+.85+.85=7.80`.
High: `10−1.5−7×.5=5`; `2.00+1.40+1.80+.85+.85=6.90`.
Missing PC remains a minor, following Gemini/Opus/GLM Flash. High's malformed
J/L states are one SRS major, following Luna Codex/Space-bunny. Related
spin-history/classification edges are one low minor; above-buffer collision
and partial-lock manifestations are one high boundary-fidelity minor.
Soft-entry, contact clock, restart bag and phone clipping use recent Qwen/
Terra/Opus severities. No gravity-floor rule was introduced: the agreement
record explicitly leaves it open for all runs.

## Reproduction and passing scope

```sh
python3 .audit/run-glm53-audit.py --offline
```

The [runner](run-glm53-audit.py) uses a random disposable directory, installs
with the delivered lockfiles, explicitly builds, runs unchanged `npm test`,
executes [engine probes](glm53-audit.mjs), then runs both unchanged `npm start`
commands on free ports 41000–49999 with PORT. Both servers already honor PORT;
**no application/server/build/test repair or copied port edit** is needed.
Omit `--offline` for uncached packages; `--effort low|high`, `--engine-only`
and `--review` are available. The latter waits for inspection before deleting
all evidence; there is no retained-copy option.

Both builds pass. Own tests: **low 11 cases/189 lines**, **high 57 checks/228
lines**, no failures observed. Chromium **156.0.8078.4**, **1280×800** and
**390×844**, starts both games. All four screenshots were inspected locally.
No failed application asset or page error; favicon 404 is excluded.
The runner verifies every delivered hash before/after: **18 low/17 high files**
(including statistics), and identical copied source hashes after own workflows.

Probes compare 28 canonical states (only a fixed O-origin translation), 48
ordered rejected-candidate kick lists, and **672 actual first-fitting CW/CCW
outcomes per run** against the shared independent oracle. Low states/tables
are canonical; its **59 outcome differences** are ceiling-buffer cases
(J19/L18/S10/T5/Z7). High has J1/J3/L1/L3 wrong and **50 differences**:
J23/L23 plus S2/Z2 above-buffer wall cases. These counts explicitly retain
failures; they are not conformance passes. The review makes no inference of
correctness from a passing own suite.

Other coverage: **100 actual bags per run**, wall/floor obstruction outcomes,
restricted/post-lock held retrieval and orientation, seven independent
obstructed ghosts with exact drop points/four welded cells, nonadjacent-row
compaction, 499/500 ms existing-ground lock, successful and failed reset,
full fifteenth reset and rejected sixteenth reset, ordinary/exhausted ledges,
new-lowest reset allowance, fresh hold gravity clock, blocked soft drop,
levels 1–20 cadence and 60/144 Hz, normal clears, pre-clear level crossing,
level-two combo, consecutive and no-clear/broken B2B, all PC sizes and B2B PC,
full/mini zero/single and full double via timed/hard lock, four T facings,
real fourth/fifth kicks and natural/manual downward spin-credit paths,
legal whole-hidden/partial locks, blocked spawn, terminal guards and restart.

All engine assertions repeat against served modules in **both** browser sizes.
[Chromium checks](glm53-browser.cjs) also use actual Left/Right/Up/X/Z/Left Ctrl/
Down/Space/C/R, held movement, direction change and blur release, unchanged
main/input/RAF/render bodies, and exact phone geometry. Real keys separately
repeat J rotation, soft entry, landing timing, PC, downward/deep-kick spin,
ceiling/partial-buffer findings and restart opening bags. The route appends
only a test handle to main.js; it changes no application body. RAF/time and
forwarded canvas calls provide deterministic observation.

## Confirmed findings

Coordinates use visible field x=0..9,y=0..19; negatives are hidden. Native y
is field y+2. High's cropped O origin is translated by one fixed x offset.
All fixtures establish stack/pose/clocks; none assigns spin credit or repairs
rules. All findings below repeat in Node and served Chromium.

### Shared: four minor findings per run

1. **No perfect-clear bonus.** Zero-travel I r0,(3,18) completes row19
   outside x3..6 and leaves zero cells: **100**, expected additive **900**.
   PC single/double/triple/Tetris give **100/300/500/800**, expected
   **900/1500/2300/2800**. Tetris/no-clear/Tetris-PC totals **2000**, expected
   **5200**. Ordinary no-clear B2B total **2000**, consecutive Tetrises
   **2050**, subsequent normal single **150**, level-two combo single **300**
   and nine-to-ten-line crossing **100 at the pre-clear level** all pass.

2. **Normal-to-soft entry spends preceding normal time.** O r0,(3,0),
   800 ms in ≤16 ms steps, real Down then 1 ms: **16 rows/16 points** rather
   than zero new rows after 1 ms. Both reuse the normal accumulator with the
   new 50 ms interval. Ordinary timed soft points and grounded delay pass.

3. **Landing frames charge pre-contact time to lock delay.** O one row
   above floor, advance990 in ≤16 ms parts, then16 and483: no welded cells
   at1489; another1 ms welds four at**1490**, expected1500. With 1 ms frames,
   a ledge descent receives499 ms after contact. These are one contact-clock
   defect. Ordinary499/500, successful/failed resets, full fifteenth cap,
   airborne ledge safety and new-lowest allowance pass.

4. **Restart retains the old randomizer's partial bag.** After actual repeated
   hard drops to game-over, R/reset clears board/HUD/hold but reuses its
   randomizer. First seven pieces after restart have only **six distinct
   types** for seeds1,2,42. Seed42 Node openings: low `I O J Z Z T L`, high
   `S O L L J T I`. Real R after Chromium's T-start game gives low
   `L I J O S Z S`, high `T I O S Z L Z`, also six. Fresh games pass100 bags.

### Low: two further minors

5. **Spin history and a fourth-kick mini are incorrect.** Stack
   `(0,17),(0,19),(2,19)`, T r0,(0,3), real CW reaches r1. Natural descent
   fourteen rows then zero-drop earns mini100 correctly. Nonzero hard drop
   instead earns only**28** drop points (expected128 under the latest audit
   profile); it clears rotation credit solely because travel>0. Manually
   soft-dropping fourteen rows leaves stale credit: zero-drop adds**100**
   beyond fourteen soft points, expected0. Separately, T r1,(3,17), stack
   `(3,15),(3,17),(5,17),(3,18),(6,19)`, actual CCW uses fourth candidate
   `(0,−2)` to r0,(3,15). Only one front corner is occupied: mini**100**
   expected, low awards**400** because it promotes index>=3 instead of only
   fifth index4. These related spin-edge defects form one minor. The legal
   fifth CW fixture and ordinary four-facing full/mini zero/single/double
   tests pass; zero-travel hard drop preserves credit.

6. **The ceiling rejects a legal SRS kick.** Stack `(3,0),(4,0)`, actual T
   spawn r0,(3,−2); the blocker prevents low's automatic spawn descent.
   CW tests0/1 are blocked; canonical test2 fits r1,(2,−3). Low returnsfalse
   and remains r0,(3,−2), since any native y<0 is treated solid. This is
   an above-buffer edge, one minor following the ceiling-buffer calibration,
   not a second ordinary-kick major. A legal wholly hidden lock correctly
   ends play; a partially visible lock in the stored two-row buffer continues.

### High: one major and three further minors

5. **Major: four J/L orientations are wrong.** `J1/J3` contain canonical
   `L1/L3`, and `L1/L3` contain `J1/J3`, while their spawn/180° states retain
   the original handedness. Real J CW in open space therefore changes its
   handed shape. Exact state comparison and first-fitting obstructed rotations
   reproduce this. All48 ordered kick lists themselves are canonical. One
   grouped SRS major, no additional deduction for its downstream placements.

6. **Minor: manual soft descent preserves stale spin credit.** The shared
   fourteen-row T fixture adds mini**100** after14 soft points, expected0.
   Natural descent and both zero/nonzero hard-drop paths follow the latest
   audited profile correctly (**100** and **128**); ordinary four-facing
   full/mini and fourth/fifth kicks also pass.

7. **Minor: above-buffer boundaries accept an out-of-wall rotation and reject
   a legal partial lock.** For a collision-free S r1,(−1,−2), stack
   `(2,−2),(0,0)`, real CCW accepts r0,(−1,−4), including x=−1. Canonical
   fourth candidate fails the wall; fifth yields x=0,y=−4. `isBlocked`
   returnsfalse for native y<0 before checking x. Separately, actual I spawn
   with stack `(5,0),(3,0),(6,1)`, CW uses fifth kick to r1,(4,−4), then
   1000 ms descent grounds it at(4,−3), with one visible cell at(6,0).
   Incoming T spawn is independently open. Zero-travel Space ends play
   because any native y<0 is rejected by lockPiece. One grouped buffer-edge
   minor covers these boundary manifestations. Normal stored-buffer whole
   hidden lock-out and partial continuation, and blocked spawn, pass.

8. **Minor: the fixed phone layout clips the playfield.** At390×844,
   document width**475**, height1041. Board border302×602 at **x=−61,y=70**;
   leftmost61 px cannot be seen. Hold122×122 at x261,y89; next122×452 at
   x261,y244; stats/legend extend past the viewport. Desktop board x384,y70
   fits, but overall document height1041 puts later controls below the fold.
   One layout deduction; no second UX penalty. All24 hold/five-next cells
   paint completely and proportionally. Low's644×620 canvas scales uniformly
   to341.984×329.25 at x24,y240.094, document width390; its field and all
   supporting panels fit, although canvas text is small.

## Own tests, code and UX rationale

**Low tests7.5:** bag helper fourteen-draw aggregate counts; board bounds/
line shift; random-piece wall stops; actual999/1000 ms gravity and exact50 ms
soft row/point; empty-floor ghost; one exact actual T kick; a real final
rotation/full zero-line spin; three exact Tetris/B2B/combo totals including
ten-line crossing at the old level; restricted/post-lock held retrieval;
400 ms grounded waits and **fifteen actual400 ms reset survivals**, then a
sixteenth action cannot defer lock; blocked spawn. The PC Tetris fixtures
assert totals without bonuses. There is no canonical state/list oracle,
I/CCW/blocked rotation, exact independently obstructed drop cells/ghost,
mini/B2B-no-clear/break/PC or higher-level combo, held orientation, precise
499/500 contact/ledge, hidden/partial/restart or real-input/browser assertion.
Breadth matches the7.5 Sonnet medium/Qwen Max low cohorts; these omissions
keep it below8+ suites. Its cap and advanced scoring coverage exceed the6.0
Opus low calibration. Audit findings do not lower this test score again.

**High tests7.0:** ten unseeded helper bag permutations, queue types/length,
L1/L2 helper values and monotonicity, single/double row compaction, one exact
actual T kick/O in-place rotation, restricted/post-lock held retrieval,
exact O hard distance points/new spawn, empty I ghost, legal Tetris and
single/combo totals, grounded499/move-reset/eventual lock, exact twenty soft
rows/points, blocked spawn and wholly-hidden lock-out. Its cap test performs
16 moves with no elapsed time and then waits500: it does **not** prove a cap,
since unlimited reset would pass. Its sole spin test directly assigns
`lastActionWasRotation`, so it earns classification/scoring credit without
rotation-history integration credit. No canonical geometry/I/CCW/blocked
kick, exact welded drop cells, real normal gravity, full B2B/mini/correct PC,
pre-clear crossing, held orientation, reset bag, contact/ledge, partial or
browser assertion. Comparable to Qwen Max medium7.0; narrower than low's real
spin/B2B/cap integration. Assertion count57 is not57 independent scenarios.

**Code9.0/simplicity8.5 both:** low 973/high 829 source TS lines excluding tests,
strict compiler checks, direct board/bag/geometry/game/input/render/entry
modules, injected RNG or PieceSource, DOM-free engine, consistent millisecond
units, no browser runtime dependencies and standard tsc/server workflows.
Mutable public state/private emitted fields require caller discipline; rule
and render machinery remains proportionate. Confirmed rule errors are not
charged again here.

**UX8.5 both:** clear seven colors, grid/ghost/beveled pieces, hold dimming,
five complete proportional previews, score/lines/level, clear/spin labels,
keyboard legends, custom horizontal DAS/ARR and blur release. Low implements
DPR backing; high has fixed backing. Neither supplies pause, canvas accessible
labels or pointer controls; none was required as a new correctness condition.
Phone/desktop layout measurements and small low text inform the judgment;
the confirmed high clipping is charged only to correctness.

## Generation, pricing and isolation (non-scoring)

Executed exactly:

```sh
python3 scripts/benchmark.py preflight
python3 scripts/benchmark.py batch opencode-go/glm-5.3 low high --instance opencode
```

No `--commit`, worktree, repo checkout, model substitution, added prompt,
retry or failed benchmark attempt. Fresh workspaces initially held **only
README.md**, copied from TETRIS.md. Exact prompt: `Read the README.md file and
implement it`; full access; options `variant=low` / `variant=high`;
`generateTitle:false`. Provider instance **opencode**, raw model selection
**opencode-go/glm-5.3**; the existing registry stores provider `opencode-go`
and model `glm-5.3` separately, without rewriting either raw component.
The launcher used the documented API; no fallback or isolation override.

Spec SHA256 **36e2097a78fe8b5646e6216338640831cff0a284cc823c4b1f658991c8d40294**,
commit **a178e6a56feaf8d1b9d51b05f1b5c4cd560323ea**, spec modified=false.
Preflight found no leftover process/common-port conflict. Low had94 locked
paths; high95 (including imported low), every checked lock mode000. Locks
remained active throughout generation; the batch unlocked only after final
provider completion. Cleanup/import/archive happened before the next launch.
Both exact-run `benchmark.py isolation` checks report **no outside access**;
`overlaps glm-5.3-low glm-5.3-high` reports **no shared /tmp entry or localhost
port**. Both imports enforced identity/effort/full-access and unchanged own
tests without allow-outside/build-failure/test-failure flags. Threads settled.

| Field | Low | High |
|---|---|---|
| Pending key | `glm-5.3-low-389680ea7e30` | `glm-5.3-high-2266bea69ed7` |
| Registered run | `glm-5.3-low` | `glm-5.3-high` |
| T3 project | `9f9ab44a-eff6-47d3-b14c-2875e220e957` | `72f5d36b-366c-47fa-93d4-2997bd58b4d4` |
| Native session | `ses_e61f3087dffecfZ0FhaEh9CBiq` | `ses_e61e75fc6ffeJK4Ux4m2Ic21t1` |
| Original workspace | `/Users/david/tetris-bench/runs/389680ea7e30/tetris` | `/Users/david/tetris-bench/runs/2266bea69ed7/tetris` |
| UTC start | `2026-11-02T20:56:51.948Z` | `2026-11-02T21:09:36.338Z` |
| UTC implementation end | `2026-11-02T21:09:29.791Z` | `2026-11-02T21:29:26.307Z` |
| Elapsed | **12m37.843s** | **19m49.969s** |
| Input/cache read/cache write/output | **84,739 / 1,052,773 / 0 / 74,098** | **89,130 / 1,568,055 / 0 / 31,247** |
| Tested-agent total | **1,211,610** | **1,688,432** |
| Reasoning subset already in output | **57,583** | **14,744** |
| Estimated public API cost | **$0.71838678** | **$0.66996310** |

Low thread:
[Read the README.md file and implement it](t3-thread://v1/thread:project:9f9ab44a-eff6-47d3-b14c-2875e220e957:d98bda80-cbff-4016-813b-adc93fdf2802).
High thread:
[Read the README.md file and implement it](t3-thread://v1/thread:project:72f5d36b-366c-47fa-93d4-2997bd58b4d4:a76aba05-2c4b-4295-aaf9-d3e46128aba7).

Official pricing verified **2026-11-02** at
[Z.ai pricing, Latest Models](https://docs.z.ai/guides/overview/pricing):
full GLM-5.3 **$1.40 input/$0.26 cached input/$4.40 output per million**, cached
storage limited-time free. `pricing.json` added `glm-5.3` **before import**;
no Flash rates copied. No cache-write tokens occurred; no separate token
write rate is published (null). Costs are public-API estimates, **not OpenCode
Go subscription bills**. T3 whole-turn main_agent usageStatus=complete,
hasSubagents=false. Overhead/combined totals, request/tool counts, errors and
billed cost remain **unverified**, not zero. Title generation was disabled by
the launch request; this does not establish zero harness overhead.

## Limits and cleanup

Focused conformance, not exhaustive state-space or long-duration play.
Two-row buffer and spawn conventions retain their existing calibration;
above-buffer edge findings are separated from normal hidden locks. Low's
rounded gravity table deviates from formula by small lower-level fractions
and yields first-row thresholds262 vs263 atL6,95 vs94 atL9 and6/4/3/2/2 vs
5/3/2/1/1 atL16–20 under the existing1 ms comparison floor. Values are recorded;
**no new gravity-floor/table-rounding deduction**, following the unresolved
agreement rule rather than changing the profile for this cohort. The latest
published downward-spin fixtures, including hard-drop preservation, are used
without retroactively changing historical scores.

Chromium only; no physical phone/touch/HiDPI/cross-browser certification.
Permissions locks prevent casual discovery, not a same-user adversary;
metadata files/scripts remain readable as documented. Post-hoc tool scanning
can establish only recorded access, not an OS security boundary. Web mode is
open. No observed contamination, no isolation exemption or weakened check.

Audit setup failures were corrected only in audit code: a vertical-I PC
fixture left extra cells; low's immediate spawn descent required an extra
blocking cell; preview draw counting initially counted bevel highlights as
cells. Every failed audit cleaned up via finally/context managers. The final
complete run passed. Copies, logs/screenshots, owned browser/server groups
are deleted on success, failure and interruption; generation workspaces are
archived under the documented unlistable archive, not left in active runs.
No implementation changed, no workflow gap required a documentation change,
and main's pre-existing commit remains. No commit, push, PR or publication.

## Final repository validation

- Final complete `run-glm53-audit.py --offline`: both builds, unchanged own
  suites, Node and both Chromium views pass with the recorded findings;
  18/17 delivered hashes and all copied source hashes remain identical.
- All 17/16 authored low/high files also match their archived generation
  byte for byte (statistics is generated after import).
- `python3 -m unittest discover -s tests -v`: **70 tests pass**.
- `benchmark.py verify`, `verify glm-5.3-low`, `verify glm-5.3-high`: pass;
  exact usage/source checks, generated reports and all 78 audit headings agree.
- Full `benchmark.py site` succeeds. `npm run check:site`: **142 successful
  index/run-page/game checks**, zero unexpected failures or warnings, including
  the documented historical failures. Local site has 71 included runs/70 game
  artifacts; its existing exclusions renumber low/high to 34/50. Repository
  ranks are 39/57; all 76 historical scores and audit bodies are preserved
  (only required historical heading ordinals change).
- `git diff --check` passes. Final preflight finds no leftover benchmark
  server/common-port conflict; no pending runs or active source lock.
  Disposable audit/site copies, screenshots and owned browser/server groups
  are removed; generation workspaces are archived and their threads settled.
  Temporary orchestration logs are deleted after validation.
- HEAD remains **a178e6a56feaf8d1b9d51b05f1b5c4cd560323ea**, main one ahead
  of origin. Requested files remain uncommitted. Local `_site` is regenerated;
  no commit, push, PR or publication occurred.
