# Full GLM-5.3 MAX audit

Audit: **2026-11-03, Europe/Prague; GPT-6.1 Sol xhigh, standard tier**,
T3 Code / Codex. This auditor did the orchestration, complete source/test
review, fixtures, screenshot inspection and scoring itself. Only the single
tested GLM MAX agent ran; no audit/review delegation or other model run.
All **78 historical scores and prior audit evidence remain unchanged**.

## Method, calibration and score

Reviewed every delivered file: all eight application TS modules, the complete
462-line own suite, HTML/CSS, server, package/complete lockfile, both TS
configurations, ignore file, task README and generated statistics. Source is
998 physical TS lines excluding tests. Quality grading used these files and
independent outcomes, without an implementation transcript. Generation
identity, usage and isolation were examined separately as orchestrator; the
minimal T3 read returned metadata and one character of the fixed user prompt.

Used the current RANKING rubric, conformance/test comparison and Methodology,
[low/high review](glm53-review.md), recent Qwen/Opus calibration and
[auditor-agreement rulings](auditor-agreement.md). Half-point criteria,
weights **40/20/20/10/10**; correctness starts at10, critical −4/cap4,
major −1.5, minor −0.5, clamped at0. Each finding is charged only once to
correctness. Audit probes add no own-test credit. Tokens, effort, duration,
isolation and price do not change quality.

| Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 8.0 | 7.5 | 9.0 | 8.5 | 8.5 | **8.20** | 4 minor |

`10−4×.5=8`; `3.20+1.50+1.80+.85+.85=8.20`.
Repository rank **25/79**; local results-site rank **21/72**, under its
existing exclusions. No historical score or audit body was revised; only
necessary ranking-heading ordinals move.

## Reproduction and coverage

```sh
python3 .audit/run-glm53-max-audit.py --offline
```

The [runner](run-glm53-max-audit.py) makes a random disposable copy, performs
locked `npm ci --ignore-scripts --offline`, explicit `npm run build`, unchanged
`npm test` (**24/24 pass**), [engine probes](glm53-max-audit.mjs) and
[Chromium checks](glm53-max-browser.cjs). Omit offline for uncached packages.
`--engine-only` explicitly skips browsers; `--review` pauses for local image
inspection before deleting evidence. No retained-copy option.

Both **1280×800** and **390×844**, Chromium **156.0.8078.4**, start and pass
the exact conforming and defective outcome assertions. Both screenshots were
inspected locally. No application asset or page error; harmless favicon404
is excluded. All **19 delivered hashes** remain identical before/after; all
**18 authored files** also match the archived generation workspace byte for
byte. Source, own tests, build configuration and implementation are unedited.

Coverage, repeated against served modules in both browser sizes:

- **28 canonical states**, allowing one fixed O-origin translation; **48
  ordered rejected-candidate kick lists**; **672 actual first-fitting CW/CCW
  comparisons**, including walls, floors, obstructions and above-buffer
  candidates. **Zero mismatches**,88 rejected rotations. All28 states and
  tables pass independently of the actual-outcome comparison.
- **100 actual seven-bags**, restricted/post-lock hold and rotated-piece
  retrieval in spawn orientation; seven independently obstructed ghosts,
  exact drop points/four welded cells, nonadjacent-row compaction.
- Existing-ground **499/500 ms**, successful reset, full fifteenth reset,
  sixteenth cannot reset, failed wall actions cannot reset; ordinary and
  exhausted ledges cannot lock in air. Both land6000 ms after the ledge move
  and lock6500. Reaching a new lowest row clears15 spent resets and grants a
  fresh full499/500 reset. Hold gets a fresh gravity clock; grounded soft
  input still waits500 ms.
- Gravity at all20 levels agrees with the formula's integer-millisecond
  thresholds; 600 ms at level10 gives9 rows at60/144 Hz. Real Down after800 ms
  normal time gives the intended **one immediate row/one point**, no jump.
  Release resumes normal cadence. Direct `update(1,true)` without the input
  transition gives16 rows; the real input calls `softDropStep` and clears
  that accumulator, so this API-only observation is **not a gameplay bug**.
- Normal1–4 clears100/300/500/800, real full/mini zero/single via timed/hard
  locks400/800 and100/200, real full double1200, all four T facings,
  fourth-kick mini100/fifth-kick full400. Consecutive Tetrises2050 including
  combo; Tetris/no-clear/Tetris2000; following single2150; level-two combo
  increment300; nine-line crossing100 at the old level, then level2.
  All PC sizes and B2B PC are probed. Actual rotation precedes downward
  natural/soft/hard paths; no fixture assigns rotation/spin credit.
- Real stored-buffer wholly-hidden lock-out and legal partial continuation,
  blocked spawn, terminal mutation guards, reset board/HUD/hold and three
  independent restart seeds, each with seven distinct opening pieces.
  Ceiling T and S wall paths accept the canonical candidates. The separate
  above-buffer partial path below records a dropped cell rather than hiding
  the defect behind a successful continuation.

Real browser keys exercise Left/Right/Up/X/Z/Left Ctrl/Down/Space/C/R,
DAS/ARR, opposite-direction precedence and release fallback, blur release,
game-over overlay/restart, soft transition/grounded delay/contact, PC,
downward spin paths, fourth/fifth kicks and hidden/buffer findings. Unchanged
main/input/RAF/render bodies execute; routing injects only an observation
handle inside main. Controlled RAF/time, seeded RNG and forwarded canvas
draw calls provide repeatable observation. All24 hold/five-next preview cells
paint inside their backing canvases at proportional dimensions.

## Four confirmed minor findings

Coordinates below use visible x0..9,y0..19; native y is visible y+2.

1. **Perfect-clear bonuses are absent.** Independently emptying the field
   with single/double/triple/Tetris gives100/300/500/800, expected the existing
   additive profile900/1500/2300/2800. Tetris/no-clear/Tetris-PC totals2000,
   expected5200. `lastLock.perfectClear` and the UI label are set, but scoring
   never adds the bonus. One isolated minor, matching low/high/Gemini/Opus.
   Real horizontal-I zero-travel Space yields100 and an empty board.

2. **A travelling hard drop erases valid spin credit.** Stack
   `(0,17),(0,19),(2,19)`, T r0,(0,3), actual CW, then fourteen-row Space
   reaches the mini pocket for **28**, expected **128**. `hardDrop` changes
   lastAction to fall when distance>0. Zero-travel full/mini locks and deep
   kicks work. Natural descent gives0 extra spin points, manual soft descent
   correctly gives0; these observations are recorded without a separate
   gravity-only ruling or second deduction. The recent full-GLM low audit
   deducts this same travelling-hard-drop defect as one spin-history minor.

3. **A legal above-buffer partial lock discards one cell.** Stack
   `(5,0),(3,0),(6,1)`, real I spawn, CW uses fifth kick to r1,(4,−4).
   After1000 ms the grounded pose is r1,(4,−3), occupying
   `(6,−3),(6,−2),(6,−1),(6,0)` with one visible cell. Incoming T is open.
   Zero-travel Space continues but welds only **three** cells; the first
   lies at native y−1 and is omitted by `if (y>=0)`. Existing stack3 plus
   placed3 leaves **six**, rather than seven, occupied cells. Engine and
   actual Chromium keys agree. Ordinary partial locks inside the stored
   buffer preserve all four; wholly-hidden lock-out works. One boundary
   fidelity minor follows the existing discarded-hidden-cell precedent,
   separate from normal stored-buffer behavior.

4. **The fixed phone layout clips the field and supporting panels.** At
   390×844 document width**423**. Board border321×640 at **x−32.5,y92** loses
   32.5 px on the left. Panel x304.5,width118 extends to422.5; hold/next
   96 px at x315.5 extend to411.5. Controls spanx−32.5..422.5. Desktop board
   x412.5,y70 and panel/controls fit1280×800. All24 preview cells paint fully
   into backing canvases. One responsive-layout minor, with no second UX
   deduction for the same clipping.

Natural contact fixture990 ms (<=16 ms steps),16 ms to observed landing,
then499/1 ms locks at**1506** overall, not prematurely at1490. This is
ordinary frame-delayed contact observation, accepted in the Opus/MiMo
calibration; **no new contact deduction**. No new gravity-floor/spawn-row/
held-key-repeat rule was introduced.

## Own tests and qualitative criteria

**Tests7.5:**24 cases/462 lines. Bag helper checks one seven-piece permutation
and aggregate counts over70 additional draws. Exact geometry covers **17/28
states**, spawn columns, board bounds/one-row compaction; actual999/1001 ms
gravity and helper values at five levels; random-piece wall travel, empty
ghost, immediate/held soft points, exact hard points/new spawn. Actual I/T
floor kicks check exact cells; real final rotations produce full zero/double
and mini single. Integrated Tetris/B2B/combo/single/level crossing totals,
PC detection (no bonus assertion), restricted/post-lock held retrieval,
blocked spawn and fully-hidden lock-out have assertions.

The fifteen-reset case does elapsed wiggles and checks the final lockVersion,
so unlimited reset fails, but its intermediate `active!==null` assertions
would also accept a newly spawned piece after an early lock; it does not
prove all15 survival windows preserve the original piece. No full geometry/
ordered kick oracle, blocked/CCW I outcome, independent obstructed ghost/
welded-cell oracle, fourth/fifth mini integration, no-clear B2B preservation,
higher-level combo, PC bonus, contact/ledge/new-lowest, partial-buffer,
restart-bag, actual input or browser assertion. Broad coverage matches the
7.5 recent Qwen/Opus/GLM low cohort; below8+ deterministic suites. Audit probes
do not repair its coverage or lower tests again for confirmed game defects.

**Code9.0, simplicity8.5:**998 readable source TS lines; strict checks with
unused/fallthrough guards, clear board/bag/rules/shapes/game/input/render/
entry separation, DOM-free engine, explicit units and cached tiles, standard
tsc/static-server workflows, no browser runtime dependencies. Mutable public
state and global RNG require caller/test discipline. Machinery remains
proportionate. Rule defects are not deducted again from these categories.

**UX8.5:**clear palette/grid/ghost, legible HUD and labels, complete hold and
five-next previews, hold dimming, keyboard legend, DAS/ARR, blur release,
explicit game-over/R guidance, canvas labels and DPR backing. Desktop fits
fully. No touch controls or pause; neither adds a new correctness requirement.
Confirmed phone clipping is charged only to correctness.

## Generation identity, accounting and isolation (non-scoring)

```sh
python3 scripts/benchmark.py preflight
python3 scripts/benchmark.py batch opencode-go/glm-5.3 max --instance opencode
```

No --commit, checkout/worktree, added prompt/context, retry, substitution,
failed generation attempt or import exemption. Fresh workspace initially
contained **only README.md**, an exact copy of TETRIS.md. Prompt exactly
`Read the README.md file and implement it`. API request: full access,
variant=max, `generateTitle:false`, root workspace strategy. Native provider
identity independently verified: instance/driver **opencode**, provider
**opencode-go**, model **glm-5.3**, effort **max**. MAX is a provider-specific
configuration label, not a verified token reasoning budget.

| Field | Value |
|---|---|
| Registered run | `glm-5.3-max` |
| Pending/imported key | `glm-5.3-max-1c896e6a8739` |
| T3 project | `f55337a2-210e-41f8-b86c-9f259f406d78` |
| Native session | `ses_e5fca540cffe45nKzYrtT06MCO` |
| Original workspace | `/Users/david/tetris-bench/runs/1c896e6a8739/tetris` |
| Archived workspace | `/Users/david/tetris-bench/archive/1c896e6a8739/tetris` |
| UTC start | `2026-11-03T07:00:34.065Z` |
| UTC implementation end | `2026-11-03T07:32:41.128Z` |
| Elapsed | **32m7.063s** |
| Input / cache read / cache write / output | **235,771 / 4,498,951 / 0 / 171,808** |
| Tested-agent total | **4,906,530** |
| Reasoning subset already included in output | **150,254** |
| Estimated public API cost | **$2.25576186** |

Completed thread:
[Read the README.md file and implement it](t3-thread://v1/thread:project:f55337a2-210e-41f8-b86c-9f259f406d78:bf0be126-3858-4f86-a580-f580dea14bdd).
Provider run:
`run:thread:thread%3Aproject%3Af55337a2-210e-41f8-b86c-9f259f406d78%3Abf0be126-3858-4f86-a580-f580dea14bdd:ordinal:1`.

Spec SHA256 **36e2097a78fe8b5646e6216338640831cff0a284cc823c4b1f658991c8d40294**,
commit **26676be56c382a25afed8b8cba2af484932ecf09**, modified=false.
Preflight was clean. **96 paths** were locked at000; checked at launch,
mid-run and about25 minutes, with no unexpected mode. Locks remained active
until provider completion; the pipeline then cleaned, imported and archived.
Import enforced identity/effort/full access, own tests and isolation without
allow-outside/build-failure/test-failure flags. Exact-run isolation reports
no outside access; low/high/MAX overlap check reports no shared /tmp entry
or localhost port. No additional T3 user message/notification turn/subagent.
The completed thread is settled.

Rechecked official [Z.ai Latest Models pricing](https://docs.z.ai/guides/overview/pricing)
on **2026-11-03**: full GLM-5.3 $1.40 input/$0.26 cached input/$4.40 output
per million. Reused the existing full-model entry unchanged, never Flash.
Estimate: `.33007940+1.16972726+.75595520=$2.25576186`. No cache writes;
no separate token-write rate is published, cached storage is limited-time
free. This is a public-API estimate, **not OpenCode Go subscription billing**.
Whole-turn main_agent usage is complete, hasSubagents=false. Request/tool
counts, API/tool errors, harness overhead/combined totals and billed cost
remain **unverified**, not zero. Title generation was disabled; zero harness
overhead does not follow from that fact.

## Reproducibility limits and cleanup

The own server hard-codes8321 and ignores PORT, unlike low/high. As in recent
audits, the runner changes **only that copied listen constant** to honor
PORT41000–49999, runs the unchanged npm start command, then restores it
before copied-source hash comparison. Build, routing, MIME and app bodies
remain intact. This portability limitation is explicit; no delivery repair
is credited. The root copy is untouched.

Generation/usage re-verification depends on the local T3 database/provider
records and archived workspace; these are not committed with the result.
Offline audit additionally needs the npm cache and the repository's installed
Playwright/Chromium. A clean machine must install those dependencies first.
Screenshots are inspected in --review and deleted, so exact numeric outcomes
and fixtures, rather than retained PNGs, are the durable evidence. This
reproducibility dependency remains a limitation of the existing workflow.

Two exploratory browser fixture failures were corrected only in audit code:
direction-release fallback had no immediate shift and needed450 rather than
400 ms to reach the far wall;650 ms soft time could leave one row due to
floating-point accumulation, so700 establishes ground before zero-travel
Space. Neither changed game source or justified a finding. Both failed
audits cleaned their copies/processes through finally/context managers.
The final full Node/browser run passed and both screenshots were inspected.

Focused conformance, not exhaustive state-space/long-duration play. Chromium
only; no physical-phone/touch/cross-browser certification. Permission locks
discourage discovery but are not an adversarial same-user boundary; scripts/
metadata remain readable, web mode is open, and scanning establishes only
recorded tool access. No observed contamination or weakened isolation check.

All owned audit copies, screenshots/logs and browser/server groups are
removed on success/failure/handled interruption. Generation is archived and
its thread settled. Final repository validation is recorded below. HEAD and
the two existing local commits remain intact. **No commit, push, PR or
publication.**


## Final repository validation

- `python3 -m unittest discover -s tests -v`: **70/70 pass**.
- Complete MAX runner: locked install, explicit build, unchanged24/24 own
  cases, Node fixtures and both Chromium views pass; both screenshots inspected.
- `benchmark.py verify`, plus exact-source/usage verifies for MAX, low and
  high: pass. All79 audit headings and generated reports agree.
- Full `benchmark.py site`: succeeds,72 included runs/71 playable artifacts.
  MAX metadata matches rank21,score8.20,4,906,530 tokens and$2.25576186.
  `npm run check:site`: **144 successful checks**, zero unexpected failures
  or warnings; historical documented browser failures remain documented.
- Preservation assertions: all78 historical ranking/registry entries and
  per-implementation audit bodies unchanged, except necessary heading ordinals.
  Prior audit files, pricing, task and historical implementations unchanged.
- `git diff --check` passes. Final preflight reports nothing left running,
  common game ports free; MAX isolation and low/high/MAX overlap checks clean.
  No pending run or active source lock, no disposable audit/site copies,
  screenshots, owned browser/server groups or temporary orchestration logs.
- Generation archive contains all18 authored files identical to the imported
  result; original active workspace is absent. Benchmark thread settled at
 2026-11-03T07:33:07.872Z. HEAD remains
  **26676be56c382a25afed8b8cba2af484932ecf09**, main two ahead of origin;
  both pre-existing commits preserved. Requested changes are uncommitted;
  local ignored _site regenerated. **No commit, push, PR or publication.**
