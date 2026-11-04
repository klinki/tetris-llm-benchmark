# GPT-6.1 Sol (max) audit

**2026-11-04 policy amendment:** [HD-SPIN-1](SPEC.md) now governs hard-drop
spin credit. See the [consistency amendment](hard-drop-rule-review.md) for
current scores, grouped findings and reproduced outcomes. Tables/ranks and
statements about unchanged historical scores below describe the original
audit date except where explicitly amended.

Audit date: **2026-11-03 (Europe/Prague)**. Run ID `gpt-6.1-sol-max`:
`gpt-6.1-sol` in **T3 Code / Codex, standard service tier, reasoning effort
max**, implementing [`TETRIS.md`](../TETRIS.md) from the single prompt
“Read the README.md file and implement it”. This record supports
[`ranking.json`](../ranking.json) and [`RANKING.md`](../RANKING.md).

## Auditor

The four earlier GPT-6.1 Sol efforts were audited by **Claude Opus 5.5 (high
effort)** rather than by Sol itself, to avoid a model grading its own
output ([GPT-6.1 Sol audit](gpt61-sol-review.md)). The same reviewer audited
this run: **Claude Opus 5.5 (`claude-opus-5-5`), high effort, fast mode
off**. That reviewer did the orchestration, the complete source and own-test
review, all fixtures, the screenshot inspection and every score and finding.
Only one other agent ran: the tested gpt-6.1-sol max agent itself, through
the repository's `batch` pipeline. Nothing was delegated for audit or review,
and Sol did not score its own run. No implementation transcript was used for
grading; generation metadata and isolation were examined separately, as
orchestrator.

## Method and delivery

Read every delivered file: the six source modules (`game`, `pieces`,
`scoring`, `input`, `renderer`, `main`; **965 TS lines**), the complete
**504-line** own suite, `index.html`, `styles.css`, `favicon.svg`,
`scripts/serve.mjs`, `package.json`, the complete `package-lock.json`,
`tsconfig.json`, `.gitignore`, the delivered README and the generated
statistics. The agent's git-ignored QA output (`output/`, `.playwright-cli/`)
is not part of the delivered source and was not graded.

Calibration used the current RANKING rubric, Methodology and conformance/
test tables, the [GPT-6.1 Sol review](gpt61-sol-review.md) with its runner,
probes and browser checks (primary comparison), the
[GLM-5.3 MAX review](glm53-max-review.md) for the current evidence standard,
and the [auditor-agreement rulings](auditor-agreement.md). Same **0–10
half-point** scale and weights **40/20/20/10/10**; correctness starts at 10,
critical −4/cap 4, major −1.5, minor −0.5. Each bug is charged once, to
correctness. Audit probes earn no own-test credit. Tokens, cost, time, effort
label and isolation facts have no quality effect.

| Install (`npm ci --ignore-scripts --offline`) | Build | Own tests (`npm test`) | Chromium 1280×800 / 390×844 |
|---|---|---|---|
| Pass | Pass | **42/42 pass** | Starts at both sizes |

## Score

| Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---:|---:|---:|---:|---:|---:|---|
| 9.0 | 9.0 | 9.0 | 8.5 | 9.0 | **8.95** | 2 minor |

`10−2×0.5=9.0`; `3.60+1.80+1.80+0.85+0.90=8.95`. Repository rank
**6/80**, between GPT-6.1 Sol (medium) 9.00 and GPT-6.1 Terra (max) 8.85;
site rank **6/73** under the existing site exclusions. No historical score or audit
body changed; only the ranking-heading ordinals below it move by one.

## Confirmed findings

Coordinates use visible x 0..9, y 0..19; the engine stores 20 hidden rows
above as y −20..−1. Every fixture reaches its pose through real engine calls
(and, in Chromium, real keys).

1. **Minor: a new lowest row neither restores lock delay nor refreshes spent
   resets.** O r0 at (−1,12) on a single support (0,14). Fifteen real
   rotations (Up in Chromium) spend every reset; after 490 ms, Right moves it
   off the ledge. Once `lockResets` reaches 15 and the piece has landed,
   `update()` keeps adding airborne time to `lockElapsed`, and `descend()`
   neither clears it nor the reset count. The O falls six rows, touches the
   floor at 5495 ms and welds at **5496 ms, 1 ms after contact instead of
   500**. With ten rotations plus the ledge move (eleven resets), the same
   fall leaves only **4** further grounded resets, not a fresh fifteen. The
   ordinary pre-cap ledge is safe (contact 5510, weld 6010). This is the
   precedent minor “A new lowest row retains exhausted lock time”
   (GPT-6.1 Terra max: 10 ms; Claude Opus 5.5 low: 9 ms), charged once.

2. **Minor: Space starts a new game from the game-over screen.** At top-out
   the frame loop focuses the overlay's “Play again” button. `Input` ignores
   Space on a focused button, so the browser activates the button and
   `start()` runs. Reached by eleven real Space hard drops at both sizes:
   releasing the Space that caused the top-out does nothing, and
   Left/Up/C/Down are inert. But **the next Space press**, or a Space held
   until it auto-repeats and then released, **immediately clears the board,
   final score and overlay** and starts a new game. The task binds only R to
   restart after game over (the README and help add Enter). This is the
   cohort's “inert game-over drop controls” requirement, and the same
   focused-control class as GPT-6.1 Sol xhigh's Space-capture minor; one
   minor. Real R restarts with a fresh seven-bag.

## Conformance evidence (passing)

- **All 28 canonical states** (exact cells, no origin translation), seven
  distinct colors, **all 48 ordered rejected-candidate kick lists** captured
  from real `rotate()`, and **672 actual first-fitting CW/CCW outcomes**
  against an independent oracle over walls, floor, random obstructions and
  hidden-buffer candidates: **0 mismatches**, 125 rejected rotations.
  Ceiling T (stack (3,0),(4,0)) takes canonical test 3 to r1,(2,−3); the
  above-buffer S wall fixture matches the oracle.
- Spawn r0,(3,−1) after the immediate one-row step from the hidden rows (no
  spawn-row ruling applied). **100 actual seven-bags** (ten seeds × ten
  bags through real spawns/locks). Hold: rotated piece held, restriction,
  post-lock retrieval at r0,(3,−1); blocked hold spawn tops out. Seven
  obstructed ghosts at y14 with exact 2-per-row drop points and four welded
  cells; two non-adjacent rows clear with correct compaction.
- Lock: existing ground **499/500 ms**; successful move reset 499/500; full
  fifteenth reset survives 499 ms, the sixteenth move cannot reset; failed
  wall moves never reset. **Natural contact** (O one row up, 990 ms in
  16 ms steps, 16, 483, 1, 9, 1) welds at **exactly 1500 ms**, with no frame
  lag, because `update()` steps to gravity/lock events. Grounded soft drop
  waits 500 ms and scores nothing.
- Gravity: first-row times at **all 20 levels** equal the Guideline formula
  at 1 ms resolution (1000, 793, 618 … 2, 1, 1); the 20G floor (0.833 ms) is
  below one frame, so no gravity-floor question arises. Gravity awards no
  points. Level 10 for 600 ms gives 9 rows at 60 and 144 Hz in the engine
  and through the unchanged RAF callback.
- Soft drop: 20× gravity. Real Down after 800 ms of normal time gives
  **1 row/1 point**, because `softDrop()` clears the gravity clock first;
  release resumes normal cadence (row 2 at 999 ms). A raw
  `update(1, true)` without the key path moves 16 rows. That is API-only
  (the real key always calls `softDrop()` first), so it is recorded, not
  deducted, as in the GLM-5.3 MAX audit. Hold starts a fresh gravity clock.
- Scoring at zero travel: single/double/triple/Tetris **100/300/500/800**;
  PC **900/1500/2300/2800**; consecutive Tetrises 2050; Tetris/no-clear/
  Tetris 2000; following single 2150; level-two combo increment 300;
  nine-to-ten-line crossing 100 at the old level, then level 2;
  Tetris/no-clear/Tetris PC **5200**. Real final rotations: full/mini
  zero/single **400/800/100/200** by hard drop and by timed lock; full
  double 1200 both ways; all four facings mini 100/full 400; fourth-kick
  mini 100; fifth-kick upgrade to full 400; corner lock without rotation 0.
- Stored buffer: wholly hidden lock (T moved Left×3 to r0,(0,−2)) tops out;
  a partially visible lock (r0,(7,−1)) continues with all four cells kept.
  The I spawned under (5,0),(3,0),(6,1) takes CW fifth kick to r1,(4,−4),
  grounds at (4,−3) and welds **all four** cells (one visible) and play
  continues. Blocked spawn ends play; terminal move/rotate/drop/hold/soft/
  time are inert; reset restores score/lines/level/hold/combo/B2B; three
  seeds top out naturally and restart with seven distinct opening pieces.

### Observations not deducted

- **Spin credit and downward travel.** `hardDrop()` clears rotation credit
  when it travels, and so do gravity and soft-drop rows. Real CW at (0,3)
  then a fourteen-row Space into the mini pocket scores **28** (drop points
  only); natural descent then zero-travel drop adds 0; manual soft descent
  adds 0.   [HD-SPIN-1](SPEC.md) now explicitly adopts the earlier adjudication:
  the travelling hard-drop result is conforming, so no deduction applies.
  Zero-travel full/mini controls still pass. Gravity is recorded without a
  new ruling. The [consistency amendment](hard-drop-rule-review.md) resolves
  the later GLM/Qwen expectation without changing Sol max's 8.95 score.
- After the pre-cap ledge move, the falling O keeps the gravity phase it
  accumulated while grounded (first fall 510 ms after the move). This is
  ordinary continuous gravity and the lock clock is correct.

## Own tests and qualitative criteria

**Tests 9.0.** 42 `node:test` cases over the emitted engine: 700 seeded
draws in complete bags with drought bound; four distinct cells per
orientation and four-turn cycles (invariants, not the canonical oracle);
exact spawn/hidden buffer; 999/1000 ms gravity and curve monotonicity;
held 20× soft drop and points; 20G and soft at level 30 stopping at the
stack and honoring lock delay; grounded soft drop; obstructed ghost; exact
hard-drop points/cells/next spawn; walls/floor/cells; JLSTZ and I wall
kicks at both walls, T and I floor kicks, fully blocked rotation; hold
restriction/retrieval/queue; natural contact plus 500 ms lock, move reset,
failed moves, the fifteen-reset cap; hidden-row compaction; 2/3/4-line
scores and B2B; pre-clear level crossing; B2B Tetris plus combo; Tetris PC
and B2B Tetris PC; full/mini zero/single through real rotations; movement
cancelling a spin; fifth-kick full spin and fifth-kick double/triple;
multiplier units; pause; blocked spawn and blocked hold; wholly hidden
lock-out; restart; invalid deltas; 30 seeded games to top-out with board
invariants. Gaps: exact 28-state/ordered-kick oracle, ledge and new-lowest
(the finding), partial above-field locks, restart-bag freshness, refresh
equivalence, and any Input/DAS/DOM/browser test. That places it between
Sol high's 9.0 and Sol xhigh's 9.5, whose suite added real Input DAS/key
map/blur cases; scored **9.0**.

**Code 9.0, simplicity 8.5.** 965 strict TS lines (`strict`,
`noUncheckedIndexedAccess`, `noUnused*`, `verbatimModuleSyntax`) in six
focused modules: rotation states generated from spawn cells by one pivot
formula, separate kick tables, a DOM-free engine with injectable RNG and an
event queue, a pure scoring function, shared DAS/ARR for keys and touch, a
revision-gated renderer with DPR scaling, and an entry module. No runtime
dependencies; standard tsc plus a 42-line static server that honours
`PORT`. The event-stepped `update()` loop (grounded gravity modulo,
`hasLanded`, capped lock clock) is compact but subtle, and is where the
new-lowest defect lives. `main.ts` mixes copy and `innerHTML` state strings.
Equal to Sol high/xhigh.

**Browser UX 9.0.** Polished, legible board with outlined ghost, hold with
used-state dimming, five previews, score/best/level/lines/progress/time/
pieces, clear and B2B/combo toasts, keyboard legend, pause button and P/Esc,
How to play dialog, blur/visibility pause, persistent best, live-region
announcements, focusable labeled playfield, DAS 167/ARR 33 with
opposite-direction priority and release fallback, native repeats ignored
(held Space drops once), and a fitting phone layout with seven touch
controls. Equal to Sol high/xhigh. The game-over focus defect is charged
only to correctness.

## Reproducible evidence

```sh
python3 .audit/run-gpt61-sol-max-audit.py --offline
```

The [runner](run-gpt61-sol-max-audit.py) copies the run (without
dependencies, build output or the agent's ignored QA output) into a random
temporary directory, runs locked `npm ci --ignore-scripts --offline`,
`npm run build`, the unchanged `npm test` (asserting 42/42), the
[engine fixtures](gpt61-sol-max-audit.mjs) and the
[Chromium checks](gpt61-sol-max-browser.cjs), then asserts that all 17
delivered files (16 authored plus `STATISTICS.md`) are byte-identical before
and after, in the repository and in the copy. The delivered server already
honours `PORT`; it runs unchanged on a free port 41000–49999. Options:
`--engine-only`, `--review` (pause before evidence is deleted; EOF deletes)
and `--archive PATH` (compare the authored files with the archived
generation workspace). Omit `--offline` when packages are not cached.

The browser script appends only `window.__app = { game, input, renderer,
resetClock }` to the served `dist/main.js`, captures requestAnimationFrame
so the unchanged frame callback runs at exact timestamps, and records
forwarded `roundRect`/`fill` canvas calls. It reruns the complete engine
fixture set on the served modules inside each page, then uses real keys for
Enter start, every required binding, DAS/ARR/fallback, blur pause, held
Space, RAF refresh, soft entry, grounded soft, contact, the exhausted ledge,
PC, downward spins, deep kicks, buffer locks, header-button focus, top-out
and post-game keys, R restart and its bag. Canvas checks: the four ghost
cells drawn exactly at the independent ghost pose, and 24 hold/next preview
cells square and inside their backings. Layout checks: no horizontal
overflow, all canvases and panels inside the viewport, a 1:2 board, the
desktop board fully above the fold, touch controls only on the phone, no
page errors or failed assets.

| View | Board (CSS px) | Document width | Previews | Touch controls |
|---|---|---:|---|---|
| 1280×800 | 215×430 at x 547, bottom 678 | 1280 | 24 square cells inside backings | hidden |
| 390×844 | 214×428 at x 94 | 390 | 24 square cells inside backings | 7 visible |

Final run (2026-11-03): all 16 authored files match the archive; 42/42 own
cases; engine assertions; Chromium **156.0.8078.4** at both sizes; 17 hashes
unchanged. Both full-page screenshots were inspected locally (board, ghost,
hold, five previews, rails and phone controls render and fit) and then
deleted with the rest of the evidence.

Two harness corrections were made during development, to audit code only:
the start check needed one captured frame before reading the overlay, and
the How to play check needed a short wait for the dialog's queued `close`
event, which refocuses the board. With real timing, Got it, × and Escape all
return focus to the board and Space hard-drops at both sizes, so that is not
a finding.

## Generation identity, accounting and isolation (non-scoring)

```sh
python3 scripts/benchmark.py preflight
python3 scripts/benchmark.py batch gpt-6.1-sol max --instance codex
python3 scripts/benchmark.py import --allow-outside gpt-6.1-sol-max-5d87b1d0b379
```

`batch` ran without `--commit`: preflight (nothing running, ports free),
`new`, source lock, launch through T3's API, wait, unlock, cleanup and
import. The import stopped at the isolation check, as designed. After the
findings below were reviewed, it was completed with `--allow-outside`,
which stores them with the run. No worktree or checkout was made, and no
prompt or context was added, retried or substituted. The fresh workspace held only
`README.md` (SHA-256 **36e2097a…d40294**, identical to `TETRIS.md`, commit
`24f0bac`, unmodified). T3 recorded the thread with title and first message
`Read the README.md file and implement it`, `runtimeMode: full-access`,
`interactionMode: default`, `modelSelection` codex / `gpt-6.1-sol` /
`reasoningEffort: max` / `serviceTier: default`, no worktree. Title
generation was off (explicit title, as `--launch` sends). The native Codex
session context independently records model `gpt-6.1-sol`, effort `max`,
approval `never`, sandbox `danger-full-access`, no service-tier override
(standard) and originator T3 Code (Codex CLI 0.166.0-alpha.5.1). `max` is a
provider effort label, not a verified reasoning budget.

| Field | Value |
|---|---|
| Registered run | `gpt-6.1-sol-max` |
| Pending/imported key | `gpt-6.1-sol-max-5d87b1d0b379` |
| T3 project | `8a121387-ed07-49be-a398-73f5cc0448dd` |
| T3 thread | `thread:project:8a121387-ed07-49be-a398-73f5cc0448dd:d21e492c-691d-4cf2-8693-0bad224d5c75` |
| Codex session | `01a1a299-2997-7b80-bf0f-ce12ba7418fe` |
| Original workspace | `/Users/david/tetris-bench/runs/5d87b1d0b379/tetris` |
| Archived workspace | `/Users/david/tetris-bench/archive/5d87b1d0b379/tetris` |
| UTC start / implementation end | `2026-11-03T18:08:29.058Z` / `2026-11-03T18:27:40.000Z` |
| Elapsed | **19m 10.942s** |
| Uncached input / cache read / cache write / output | **82,475 / 3,236,864 / 0 / 67,644** |
| Tested-agent total | **3,386,983** (reasoning 28,489 is inside output) |
| Model responses (native log, orchestrator count) | 37; largest request 134,550 input tokens |
| Estimated API cost | **$1.1650764** |

One user turn and no notification turn or subagent. The agent stopped its
own server, and `cleanup` found nothing left. The thread is settled. The
native log's per-response usage sums exactly to T3's whole-turn totals.

**Pricing.** The existing `gpt-6.1-sol` entry was rechecked against the
[official model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
on 2026-11-03: $2 input, $0.10 cached input, $2.50 cache write, $10 output
per million, standard tier. Above 272K input tokens per request, input and
cache rates double and output is 1.5×. The entry was reused unchanged.
`0.16495 + 0.3236864 + 0.67644 = $1.1650764`. No request exceeded 272K
input tokens, so the long-context surcharge does not apply and the
estimate is exact at list price. It is a public-API estimate, not the
account's actual billing (Codex in T3 may use subscription limits).
Harness overhead, the combined total and tool-call/error counts remain
**unverified**, not zero, as in the generated statistics.

**Isolation.** During generation the repository sources, `.git`, the
archive, `.bench/imported|held|abandoned` and `/Users/david/projects/own/tetris`
were permission-locked (**99 paths**). Two paths were added to the
untracked `.bench/lock-extra` before launch:

- `~/.bench-scratch`, a stale partial copy of the earlier Sol audit with
  its scores;
- a September Luna T3 timing experiment in
  `~/Documents/ChatGPT/Playground/t3-timing/tetris-run`.

The second folder's permissions were reset to 0700 within seconds, apparently
by a process watching Documents, so the lock did not hold. It was moved into
a temporary 000 folder outside Documents during the run and restored with
mode 755 afterwards.

The import scan reported 41 references outside the workspace, reviewed
from tool-call metadata only:

- Codex's standard `[ -f AGENTS.md ]` test up the parent chain; none exist
  and nothing was listed.
- Reads of Codex's own Sites and Playwright skill docs under `~/.codex`.
- The Playwright skill script, with Chromium from the ms-playwright cache and
  `@playwright/cli` from the npx cache, used to check its own page on
  localhost:8321.
- Three `../dist/*.js` imports inside its own test file.

Its web searches were Tetris Guideline/SRS wiki pages only. There was no
benchmark, T3-data, other-run or external-app access. The conclusion is
stored as `isolation.review`. `overlaps` with GLM-5.3 MAX and Sol xhigh
reports no shared /tmp entry or port.

## Limits

This is focused conformance evidence, not a state-space proof,
long-duration playtest, physical touch/phone, high-DPI, native OS key-repeat
timing or other-browser certification. Held Space auto-repeat is emulated
with a second Playwright keydown (`repeat: true`). Re-verifying generation
usage needs the local T3 database, Codex log and archive, which are not
committed. Offline reproduction needs the npm cache and the repository's
Playwright Chromium. Permission locks deter discovery but are not a
same-user security boundary. Screenshots are deleted, so the numeric
assertions are the durable evidence.

All owned copies, logs, screenshots, servers and browser processes were
removed. Final repository validation is recorded below. **No commit, push,
PR or publication.**

## Final repository validation

- `python3 .audit/run-gpt61-sol-max-audit.py --offline --archive …/5d87b1d0b379/tetris`:
  **passed**: 16 authored files match the archive, locked install, build,
  42/42 own cases, engine assertions, Chromium 156.0.8078.4 at 1280×800 and
  390×844, 17 delivered hashes unchanged, all evidence removed.
- `python3 scripts/benchmark.py render` and `verify`: **passed**.
  `node .audit/verify-ranking.mjs`: 476 local links, 80 score rows,
  deductions, ordering and tables in 6 documents.
- `python3 -m unittest discover -s tests`: **70/70 pass**. `git diff --check`: clean.
- Full `python3 scripts/benchmark.py site`: succeeded, 73 included runs,
  72 playable games. Sol max: **site rank 6/73**, score 8.95, 3,386,983
  tokens, $1.1650764, 19m 10.942s. `npm run check:site`: **146 ok** checks,
  with the three historical documented browser failures and nothing
  unexpected.
- Preservation: `ranking.json` and `benchmark-runs.json` are append-only;
  outside the new sections, RANKING.md changes only the implementation
  count, the generated table and per-implementation heading ordinals 6–79 →
  7–80. No prior audit file, pricing entry, task file or implementation changed.
- `preflight`: nothing left running, game ports free. `isolation`: the 41
  reviewed references only. `overlaps` with GLM-5.3 MAX and Sol xhigh: none.
  No pending run, active lock, run workspace, disposable copy, screenshot or
  owned browser/server process remains; the generation workspace is archived
  and its thread settled.
