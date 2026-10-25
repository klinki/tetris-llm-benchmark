# GPT-6.1 Sol audits (low, medium, high, xhigh)

Audit date: **2026-10-25 (Europe/Rome)**. Four `gpt-6.1-sol` runs in
**T3 Code / Codex, standard service tier**, implementing
[`TETRIS.md`](../TETRIS.md) from the single prompt “Read the README.md file
and implement it”. Run IDs: `gpt-6.1-sol-{low,medium,high,xhigh}`. This
record supports [`ranking.json`](../ranking.json) and
[`RANKING.md`](../RANKING.md). Historical `sol-codex` and `sol-omp` keep
**8.20/8.30**.

## Auditor

GPT-6.1 Sol audited every other run in this benchmark. To avoid a model
grading its own output, these four runs were audited by **Claude Opus 5.5
(high effort)**. Scores follow the existing rubric, weights, severities,
evidence standard and calibration exactly; the auditor calibrated against
the existing scored runs and their records, not personal taste. A first
attempt by the same auditor stopped part-way at a Claude API rate limit. Its
draft scripts and scores were treated as drafts: the scripts were re-run,
every finding and score was re-verified, and two corrections were made (a
preview-scaling defect was added for low and medium, see below).

## Method and delivery

Re-read the rubric, weights, Methodology, conformance/coverage tables and
the top-ranked sections (Opus 5.5 9.05, Sonnet 5.5 xhigh 9.00, Luna OMP's
10.0 correctness), and the [Haiku](haiku-review.md), [Sonnet](sonnet-review.md),
[GLM](glm-review.md), [DeepSeek V4.1](deepseek-v41-review.md),
[GPT-6 Luna](gpt6-luna-review.md) and [GPT-5.6 Luna](gpt56-luna-review.md)
records with their probe/browser/runner scripts. Reviewed all sources, own
tests, HTML/CSS, configs, packages/locks, servers and supplied statistics.

Same **0–10 half-point scale**, weights **40/20/20/10/10**; correctness
starts at 10, critical −4/cap 4, major −1.5, minor −0.5. A bug is charged
once, to correctness. Own-test omissions determine tests; audit probes earn
no own-test credit. Tokens, cost, time, effort labels and supplied
isolation facts have no quality effect. Only one earlier run (Luna OMP)
holds 10.0 correctness, with no confirmed bug; high is awarded 10.0 on the
same basis after every engine and browser probe passed.

All installs/builds/tests/servers used random disposable temporary copies,
excluding dependencies, generated output and .git. **Node 26.0.0**, locked
cached TypeScript and installed **Chromium 156.0.8078.4** were used. Only
low's hard-coded server port literal changed in its temporary copy; the
other three servers accept `PORT`. All servers used free ports
**41000–49999**. Work stayed on `main`, with no commit/stash/reset/revert.
Implementations, registry, pricing, repository scripts/tests and site source
were not edited; no build output or dependencies were placed in run folders.

| Effort | Isolated install | Build | Own tests (`npm test`) | Delivered Chromium game |
|---|---|---|---|---|
| low | Pass | Pass | 11/11 pass | Starts |
| medium | Pass | Pass | 16/16 pass | Starts |
| high | Pass | Pass | 23/23 pass | Starts |
| xhigh | Pass | Pass | 37/37 pass | Starts |

Install is `npm ci --ignore-scripts --offline`; build is `npm run build`.
Low's two unseeded own tests check order-independent bag/hold invariants;
40 repeated runs had no failure. The other suites use fixed callbacks or
seeds. No seed-dependent own-test failure was found.

## Scores

| Effort | Correctness | Tests | Code | Simplicity | UX | Weighted |
|---|---:|---:|---:|---:|---:|---:|
| low | 8.0 | 7.0 | 7.0 | 8.5 | 8.0 | **7.65** |
| medium | 9.5 | 8.5 | 8.5 | 9.0 | 9.0 | **9.00** |
| high | 10.0 | 9.0 | 9.0 | 8.5 | 9.0 | **9.35** |
| xhigh | 9.5 | 9.5 | 9.0 | 8.5 | 9.0 | **9.25** |

Totals: low `3.20+1.40+1.40+0.85+0.80=7.65`; medium
`3.80+1.70+1.70+0.90+0.90=9.00`; high `4.00+1.80+1.80+0.85+0.90=9.35`;
xhigh `3.80+1.90+1.80+0.85+0.90=9.25`.

Calibration notes. Tests: high's 23 exact cases match Opus's 9.0 breadth
(ordered kicks, timing/cap, full/mini, B2B/combo/PC, hidden lock-out,
restart). Xhigh's 37 add B2B PC, level-two combo, spin cancellation, blocked
hold spawn, frame-rate equivalence and real Input DAS/key-map/blur cases:
the broadest own suite in the benchmark, hence 9.5. Medium (8.5) lacks
mini, hidden lock-out, the curve and input; low (7.0) is narrower. Code:
low's compressed one-line methods match the 7.0 given to the compressed
GPT-6 Luna and GPT-5.6 Luna low runs. Medium's two-module design scores
simplicity 9.0; high/xhigh's larger UIs score 8.5.

## Findings and rationale

### low — 7.65

Summary: **Compact canonical SRS engine with full scoring; B2B-PC, hidden
lock-out, soft timing and preview distortion; compressed code**.

1. **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, a
   no-clear lock, then a zero-distance Tetris PC total 4000 instead of
   5200 (1200 B2B clear + 2000 ordinary PC instead of 3200). lock() reads
   `[0,800,1200,1800,2000]` with no B2B variant.
2. **Minor: A wholly hidden legal lock does not end the game.** The actual T
   spawn is field (3,−2), wholly in the two hidden rows. With stack (8,0)
   only, four right moves ground it at x=7; zero-distance hard drop locks
   all four cells above the field, the open I spawns and over stays false.
   lock() only checks cells above its 22-row array.
3. **Minor: Starting soft drop consumes accumulated normal-gravity time.**
   After fifty 16 ms updates (800 ms accumulated) real Down moves one row;
   the next 1 ms frame reaches y=17 with 17 points. Engine and Chromium.
4. **Minor: Hold and next previews are stretched non-uniformly.** Fixed
   144×88/144×350 backings are drawn into 55×70/50×250 CSS px on the phone
   (cell width/height 0.48/0.486; a held O is a tall 1×2 rectangle) and
   148×250 on desktop next (1.44). Same class as the GPT-6 Luna squashed
   preview finding. The board scales uniformly.

### medium — 9.00

Summary: **Every engine probe passes; strong deterministic suite, compact
readable engine, touch UI; stretched previews**.

1. **Minor: Hold and next previews are stretched non-uniformly.** Fixed
   144×90/144×310 backings: desktop next 124×225 px (1.186) and hold
   124×70 (1.107) render wide; phone hold 77×60 (0.802) renders a held O
   taller than wide. Smaller than low's distortion but plainly visible in
   the desktop queue; charged once, as a minor presentation defect.

Soft drop resets the gravity timer (1 row/point after the transition
fixture). Soft drop uses a 40 ms interval at level one rather than 50 ms;
no earlier audit charged soft-drop speed, so none is charged here.

### high — 9.35

Summary: **Every engine and browser probe passes; Opus-level suite,
event-ordered clock and polished responsive UI**.

**No confirmed bug in the audited scope.** One observation is recorded but
not deducted: after 800 ms of normal gravity, real Down plus a 1 ms frame
moves/scores **2 rows** (the keydown row plus one timed row) because
update() zeroes fallTime after one step instead of spending the remainder.
The extra movement is bounded by one 50 ms soft interval, the timer phase
any soft clock carries; the charged Sonnet/Haiku/low defect is a multi-row
jump (16–17 rows) from consuming the whole accumulator.

### xhigh — 9.25

Summary: **Every engine probe passes with the broadest own suite; focused
header buttons swallow Space**.

1. **Minor: A clicked header button captures Space instead of hard drop.**
   Mid-game, mouse-click Sound, or How to play then Got it. Focus stays on
   the button, and Input deliberately ignores Space/Enter on focused
   buttons. Real Space then toggles sound back (`aria-pressed` true→false)
   or reopens the dialog (pausing play); the T does not drop at either
   size. Play/Pause refocus the board; Sound and the dialog's restored
   focus do not. Low, medium and high hard-drop in the same check, with
   their sound state unchanged.

## Reproducible engine evidence

```sh
python3 .audit/run-gpt61-sol-audit.py --offline
```

Omit `--offline` when npm packages are not cached. The
[runner](run-gpt61-sol-audit.py) rebuilds and runs the unchanged own suites
(asserting 11/16/23/37 passes), the [engine probes](gpt61-sol-audit.mjs) and
the [Chromium assertions](gpt61-sol-browser.cjs) for all four. A passing
audit asserts the documented defects as well as conformance.
`--engine-only` skips browsers; `--effort` selects one run;
`--artifacts-dir` may retain screenshots/JSON **outside** the checkout.

Adapters call the emitted engine methods; private fields are touched only
to place deterministic fixtures. Equivalent probes cover:

- **All 28 canonical coordinate sets** against the same oracle, seven
  distinct colors, all **48 ordered non-O CW/CCW kick candidate sequences**
  captured from real rotate(), walls and concrete T/I wall/floor kicks.
- **100 engine bags** (ten seeds × ten bags through real spawns), hold
  restriction and post-lock retrieval in spawn orientation, seven obstructed
  ghosts with hard-drop points and welded cells.
- **499/500 ms** grounded boundary, natural landing (1000 ms) then lock
  (500 ms), the fifteen-reset cap (locks on the sixteenth hold) and the
  **ledge-move mid-air lock probe**: O rests on one support for 490 ms,
  moves right off it, stays airborne past the old deadline, then locks on
  the floor. All four pass ledge safety. Grounded soft drop never locks.
- Zero-travel scoring: single/double/triple/Tetris 100/300/500/800; full
  spin zero/single 400/800 and mini 100/200 through **hard drop and timed
  lock**; no-rotation corner lock 0; manual soft drop after rotation adds
  no spin; two Tetrises with a no-clear between 2000; B2B break 2150;
  consecutive Tetrises 2050; level-two combo single 300; nine-to-ten-line
  single 100; single PC 900; single PC after B2B 1700; B2B Tetris PC 5200
  (low 4000).
- Actual first-row times at levels **1,2,5,9,10,14,15,20**: 1000, 793, 356,
  94, 65, then low 16/16/16 (accepted fast floor), medium 12/8/5, high and
  xhigh 12/8/1 ms, against `1000×(0.8−(level−1)×0.007)^(level−1)`. Gravity
  awards no points. **800 ms normal / real Down / 1 ms** transition: low
  17, medium 1, high 2, xhigh 1 rows/points. Equal **1480.001 ms** at level
  two agrees at **60/144 Hz**.
- **Public-action wholly hidden lock-out**: medium/high use stack
  (6,1),(7,1),(8,0) and right, right, CCW, CW from the actual T spawn;
  xhigh adds (3,1). Each ends T r0 at (6,−2) wholly above row zero and
  tops out. Low spawns at (3,−2) and needs only (8,0) and four right
  moves; it continues. Blocked spawn, inert game-over input and full reset
  pass for all four.

## Chromium evidence

Playwright library with installed **Chromium 156.0.8078.4**, **1280×800**
and **390×844**. The served `dist/main.js` only gains an appended
`window.__game = game` accessor; requestAnimationFrame is captured so the
unchanged frame callback runs at exact timestamps. All eight full-page
screenshots were visually inspected outside the checkout and deleted.

| Effort | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 243×486 at x=518.5 | 390 | 223×446 at x=86 | Panels and touch buttons fit; previews stretched (phone 0.48, desktop next 1.44) | None |
| medium | 240×480 at x=520 | 390 | 237×474 at x=132 | Panels and touch buttons fit; previews stretched (desktop next 1.186, phone hold 0.802) | None |
| high | 236×472 at x=537 | 390 | 236×472 at x=24 | Five separate previews, touch buttons; all fit | None |
| xhigh | 238×476 at x=521 | 390 | 241×482 at x=24 | Panels/touch buttons fit; Space captured by a clicked header button | None |

Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** run at both
sizes for all four, asserting displacement, all four rotation bindings,
soft points, four hard-locked cells and hold. Real Space blocks the
incoming spawn and shows the game-over overlay; Left/Up/Space/C are inert;
**real R** resets board, hold, score and lines and hides the overlay. The
unchanged frame callbacks agree at 60/144 Hz and reproduce the same soft
transitions as the engine (17/1/2/1 rows). No document overflow, every
canvas within the viewport, no application exceptions, console errors or
failed assets (low's external Google Fonts stylesheet is excluded).

## Supplied generation and isolation context (no score effect)

These facts come from the parent/import record; they were recorded, not
independently reconstructed from provider logs.

- **low, medium, high:** after each run, `cleanup` stopped the agent's
  leftover `npm start` server. Codex then posted a background-command
  notification that T3 delivered as a user message, starting a short second
  turn in which the agent only replied (no file changes). These turns are
  declared as `t3_notification_turns`, excluded from usage and time and
  listed in `STATISTICS.md`. The audited code is the first turn's output.
- **low:** one isolation finding, `../dist/game.js`, was a false positive
  (an `import` in the agent's own test file); imported with
  `--allow-outside`. The check now ignores module specifiers (commit
  **b6e8612**). Medium was imported after that fix with no findings.
- **high, xhigh:** Codex checked for `AGENTS.md` files in each folder above
  the workspace (none exist, nothing was read); xhigh also read two files of
  Codex's own built-in “Sites” skill under `~/.codex/plugins/cache`. Both
  were imported with `--allow-outside`, so the lookups are recorded. No
  benchmark lookups or T3 thread tools.
- Runs executed one at a time; `preflight` confirmed free ports before each.

| Effort | T3 thread | Codex session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:2254a1c1-5658-461f-8243-1279f45c74bc` | `01a171d5-0924-7b70-9b08-6ec2bf0c95e1` | 380,287 | 3m 37.809s |
| medium | `mcp:4669b0a2-f010-4619-b6f0-e87c7152beb3` | `01a171d9-7b51-7ba0-9594-66016ab40a4c` | 576,119 | 6m 4.302s |
| high | `mcp:c9e291d8-6a21-4adb-a0fb-03d16814d175` | `01a171df-d877-7363-a55a-1828af3c3ef7` | 1,433,435 | 11m 37.239s |
| xhigh | `mcp:0f1b8a97-2076-4774-99bd-1fed917f24c1` | `01a171eb-3f32-7491-ad8e-b2f97ed217ac` | 1,181,592 | 14m 15.041s |

## Limits and validation

This is focused conformance evidence, not an exhaustive state-space proof,
long-duration playtest, physical touch-device test, high-DPI device test,
native OS key-repeat check or other-browser certification. Every recorded
bug has a reproducible assertion. Ghost drawing was checked visually in
screenshots, not by canvas-call assertions. High's 10.0 means no confirmed
bug in this audited scope, not proven bug freedom. Earlier implementations
were not rescored; all 44 earlier ranking entries are unchanged.

Final validation after recording and regeneration:

- `python3 .audit/run-gpt61-sol-audit.py --offline`: **passed**, all four
  fresh installs/builds/own suites, engine assertions and eight viewport
  passes, including every recorded finding.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**.
- `python3 -m unittest discover -s tests`: **passed**.
- `git diff --check`: **passed**.

All audit servers/browsers and temporary copies/artifacts were closed or
deleted. No commit, stash, reset or revert was made; the parent commits.
