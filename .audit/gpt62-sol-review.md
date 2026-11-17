# GPT-6.2 Sol low / medium / high independent audit

**2026-11-17, Europe/Prague. Reviewer: GPT-6.1 Sol, xhigh, Codex / T3 Code.**
Performed independently in the requested order **low → medium → high**, without
further delegation or reading generation transcripts. All three imported
implementations are playable; low and high implement custom polyomino games
instead of standard Tetris. Generation speed, token use, requested effort,
pricing and the accepted outside-access reviews have no quality-score effect.
No commit, push or PR. The 91 existing scored entries remain identical.

The [evidence](gpt62-sol-evidence.json) contains the review thread link, native
session `01a1eb4b-c6ce-7a20-9ba5-234984b26439`, and actual native
`turn_context` values **model=gpt-6.1-sol, effort=xhigh**, read from the
reviewer's session record. T3's current-thread configuration independently
agrees. Only this review's metadata was inspected. The parent must confirm
this review turn completed and perform the required isolated-project archival;
this reviewer did not archive projects or modify the run registry.

## Scores and calibration

| Effort | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Confirmed groups |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 5.5 | 4.5 | 8.5 | 9.5 | 8.0 | **6.55** | 2 major, 3 minor |
| medium | 9.0 | 6.5 | 9.0 | 9.0 | 9.0 | **8.50** | 2 minor |
| high | 4.5 | 5.5 | 9.0 | 9.0 | 9.0 | **6.50** | 3 major, 2 minor |

Same half-point scale, **40/20/20/10/10** weights, major−1.5/minor−0.5.
Geometry and generic kicks form one major per custom-piece game, following
GPT-5.6 Luna low and MiniMax max's related shape/SRS grouping. Their absent
spin/PC/B2B features and associated line arithmetic form one scoring major,
following MiniMax max / Qwen Max xhigh; no separate deduction for each absent
bonus or for a Tetris that the shape set cannot make. Custom field dimensions
are one nonblocking fidelity minor each. High's different low-level gravity
curve and six-line progression form a major, following the wrong-curve Luna
precedent. Its 450ms/eight-reset and retained-clock variants share one lock
minor. Low's retained spent clocks and reset budget share one minor; its
partial-hidden lock-out is a separate boundary minor. Medium's isolated PC
omission and fifteenth-reset early lock are established individual minors.
No critical startup/unusable-engine finding applies to these playable games.
No deductions for native repeat, spawn position, high-level gravity floors,
missing optional touch UI, or automatic-gravity spin history. A defect is
charged only once; added audit tests earn no own-test credit.

## Reproduce and preservation

```sh
python3 .audit/run-gpt62-sol-audit.py --offline
python3 .audit/run-gpt62-sol-audit.py --offline --effort medium --engine-only
# Interactive screenshot inspection before cleanup:
python3 .audit/run-gpt62-sol-audit.py --offline --review
```

[Runner](run-gpt62-sol-audit.py), [engine fixtures](gpt62-sol-audit.mjs),
[browser fixtures](gpt62-sol-browser.cjs), [complete evidence](gpt62-sol-evidence.json).
`--record` intentionally refreshes actual numeric evidence; normal execution
compares complete engine outcomes with the pinned records, including defects.
A passing runner is a reproducibility check, not a conformance certificate.

Read TETRIS.md, all of SPEC.md including HD-SPIN-1, AGENTS.md's reviewer gate,
RANKING's methodology and recent cohort calibration, the complete Hy4 and
MiniMax runners/fixtures/reviews, the independent canonical Opus oracle, and
auditor-agreement decisions. Read every delivered source and own test plus
HTML/CSS, server/asset scripts, README, configs, complete lockfile, ignore and
statistics files: **11 low + 13 medium + 15 high = 39 files**. SHA-256 hashes
of every delivered file are in `runs.<effort>.hashes` in the evidence JSON;
all were checked unchanged after every final disposable workflow. The audit
never builds/installs/serves in delivered folders.

Fresh disposable copies use locked `npm ci --ignore-scripts --offline`, an
explicit `npm run build`, and unchanged `npm test`: **4/4, 10/10, 7/7 pass**.
All lockfiles resolve TypeScript5.9.3. Environment versions are in evidence.
Root Playwright1.64.0 / Chromium156.0.8078.4 are used. Offline reproduction
needs cached dependencies and installed root Playwright/Chromium.

Only the low/medium copied servers' hardcoded `.listen(8321,...)` constants
are temporarily adapted to honor PORT, then restored before hash checks.
High already honors PORT. All use declared `npm start`. Served main responses
append observation handles; no source body, own assertion or rule is replaced.
Browser fixtures forward canvas calls, capture RAF/performance clocks and
replace scenario game instances with real seeded engines. Clock/pose/stack
setup never assigns spin eligibility, kick success or scoring bodies.
Sacrificial `fits` rejection is used only to enumerate ordered kick candidates,
never to measure actual rotations or scoring.

The sandbox initially denied local port binding; the same runner then ran
with approved execution permissions. Shared preview returned
`ERR_CONNECTION_REFUSED` twice and reported no open tabs; the requested
Playwright library workflow completed every view. A first own-suite parsing
assertion expected TAP's `# pass` while Node printed `ℹ pass`; only audit
parsing changed. A first pause fixture pressed Space on medium's focused
Resume button, which naturally resumes play; the corrected paused control
uses Left. Early ledge fixtures spent fewer than the full reset allowance;
final fixtures support both alternating poses and explicitly record spent
15/8. These are harness corrections, not implementation failures or retries.
All disposable copies, logs, screenshots and owned server/browser groups are
removed on completion and handled failures/interruption. All six final PNGs
were visually inspected before cleanup.

## Low findings

1. **Major — The seven shapes and rotations are not standard Tetris/SRS.**
   `src/game.ts` defines kind0 with **3 cells** and kinds1–6 with **5 cells**;
   there is no four-cell tetromino in any orientation. All28 diagnostic state
   comparisons fail by cardinality alone, independent of origin/identity.
   `rotate()` tries nine generic direction-dependent offsets instead of
   separate I/JLSTZ transition tables; all48 diagnostic ordered lists differ.
   Native actual rotations and real Up/X/Z/LeftCtrl work on these custom shapes,
   but cannot establish SRS conformance. Kind0 ghost/hard-drop welds exactly
   three cells, independently verified in Node and browser.

2. **Major — Advanced Guideline scoring is absent.** There is no spin history,
   spin detector, PC bonus, combo or B2B state. Native two-row perfect clear
   (kind2 r0, origin4,21, complement filled in rows20/21) empties the board for
   **300**, expected additive PC **1500**. Native three-row PC gives500,
   expected2300. Two successive non-PC singles add100 each, expected the
   second150 at level1. Normal1/2/3 scores100/300/500 are correct. No shape
   spans four rows, so a four-line Tetris and the canonical T-spin fixtures
   cannot be expressed. Missing recognition is recorded as missing coverage
   of an absent feature, never as an HD-SPIN-1 pass.

3. **Minor — Field dimensions are 12×22 rather than 10×20.** Exported WIDTH12
   and HEIGHT22 drive collision, full-row clearing and the visible grid.
   This is independently visible in both screenshot sizes.

4. **Minor — Exhausted lock timing and resets survive a new lowest row.**
   Native kind0 r0 at(0,12), supports(0,14),(1,14); alternate successful
   Right/Left15 times, wait490ms, Right twice off the support. It remains
   airborne correctly, lands8000ms after leaving, then locks at8010ms,
   instead of receiving500ms after contact. The ordinary ledge locks8500ms.
   A second control reaches the new floor with `resets=15`, waits400ms,
   successfully moves Right, then100ms welds the three blocks (5 occupied
   including supports), instead of granting a fresh delay and retaining just
   the two supports. Existing-ground500, exact landing1500 and the ordinary
   fifteenth reset/cap otherwise work. No airborne lock is claimed.

5. **Minor — A partially visible lock ends play before storing its cells.**
   Support(0,1), kind0 r0 at(0,−1), zero-travel hard drop. Its bottom cell is
   visible at(0,0), yet `place()` sets over=true and writes none of the three
   cells because any y<0 ends play. Occupied count stays1. The wholly-hidden
   control at y−2 over support(0,0) also ends play, as expected. These are legal
   direct boundary setups, not claimed public spawn-to-pose replays.

## Medium findings

1. **Minor — Perfect-clear bonuses are missing.** Final grounded native
   I0/O0/T1/I1 placements with the complement of their cells filled in the
   bottom1/2/3/4 rows empty the entire board. Score deltas are
   **100/300/500/800**, expected **900/1500/2300/2800**. At9 lines the PC single
   gives100 rather than900 and advances correctly to level2. A real Tetris,
   no-clear placement, then PC Tetris totals2000 rather than5200. These are
   manifestations of the same absent bonus, one minor, not separate deductions.

2. **Minor — The fifteenth successful reset locks immediately.** I r0 at
   (4,18), level1, wait100ms, then15 alternating successful Right/Left moves.
   The fifteenth welds four cells immediately instead of providing the full
   reset500ms. Both Node and actual Chromium keys reproduce it. `tryMove`
   increments `resets` to15 and `lockAtResetLimit` immediately calls `lock`.
   This behavior is also encoded in the delivered own test. First14 resets,
  499/500 boundary, exact1500 contact, failed-wall timing, ordinary/exhausted
   ledges and a new-lowest reset control otherwise pass.

**HD-SPIN-1 passes.** Stack(0,17),(0,19),(2,19), T0(0,3), actual CW toT1,
independently checked ghost y17, Space14 rows: **28**, no stale spin bonus.
Zero-travel controls T3(3,17), stack(5,17),(3,19),(5,19), actual CW toT0:
**100** mini; replacing(5,19) with(3,17): **400** full. Timed500ms locks agree.
Full/mini single200/800, full double1200, all four facings, fourth-kick mini100,
fifth-kick full400, two-corner0, no-rotation0, failed-action full400 and manual
soft-travel cancellation pass. Travel and zero-travel controls repeat with
actual keys in both viewports; all engine fixtures also run against served
browser modules. Automatic descent clears credit; no new rule is inferred.

## High findings

1. **Major — Custom pieces and generic rotations replace tetrominoes/SRS.**
   `pieces.ts` has beam/elbow with3 cells and hook/crown/switch/cross/kite with5.
   No four-cell piece exists. All28 diagnostic state comparisons and48 ordered
   candidate lists differ. Cross rotation is deliberately inert; other kinds
   try the same generic nine offsets in either direction. The observed
   three-cell beam hard-drop weld is internally consistent but not Tetris.

2. **Major — Line/scoring rules replace Guideline scoring.** Non-PC1/2/3/4
   clears give**100/400/900/1600**, expected100/300/500/800, from
   `100*cleared**2*level`. Native PC1/3/4 scores100/900/1600 with an empty board,
   rather than900/2300/2800. Two four-row clears separated by a no-clear lock
   total3200 instead of2000. Ordinary combo singles do work. No spin recognition,
   T-spin scoring, PC or difficult-clear B2B state exists. Canonical T-spin
   fixtures are inexpressible because there is no T tetromino; no fake T is
   injected to manufacture a result. All related scoring omissions/over-awards
   share this one major.

3. **Major — Gravity and level progression use different rules.** Fresh level1
   moves after**860ms**, expected1000; level2 after688, expected793; level10
   after116, expected65. Each six cleared rows increases level, rather than10;
   `lines=6` gives level2. The 85ms high-level floor is recorded but incurs no
   additional deduction under the established open gravity-floor policy.

4. **Minor — Lock delay/reset policy is shortened and retained at lower rows.**
   Grounded beam locks at450ms instead of500 and only8 actions reset it instead
   of15. After8 successful alternating moves and100ms, another move leaves
  350ms rather than a fresh500. Beam r0(1,12), supports(0,13),(1,13), eight
   grounded alternating moves,440ms, Right twice off the support: lands at4300ms
   and locks4310ms after departure, rather than receiving500 after landing.
   The ordinary ledge gets450ms (locks4750). The new-lowest control retains
   `lockResets=8`;400ms, Right,100ms welds three cells instead of resetting.
   These timing/reset manifestations share one finding; no airborne lock occurs.

5. **Minor — Field dimensions are 11×18 rather than 10×20.** The exported
   dimensions govern storage, collision, clearing and display. Both browser
   screenshots and the visible playfield label confirm the substitution.

## Coverage and limits

- **Each effort:**28 delivered orientation inspections,48 actual rejected
  candidate-list captures,504 real CW/CCW outcomes covering all types/facings,
  walls/floor/obstructed stacks; medium compares these with independently
  calculated first-fitting SRS results, with0 discrepancies. Low/high have no
  SRS identity mapping: their ordinal28/48 comparisons are diagnostics, not
  canonical actual-outcome claims. Native rotation results remain legal.
-100 actual bags over10 seeds with the stack cleared between real placements;
  hold restriction/post-lock orientation/queue, seven obstructed independent
  ghosts, exact drop points and welded cells, soft points, nonadjacent-row
  compaction,500/450 clocks, reset-cap variants, exact contact partitions,
  ordinary/exhausted ledges and new-lowest clocks,20 gravity levels,60/144Hz
  cadence, hold-phase reset, native ordinary/PC clears and scoring sequences,
  blocked spawn/terminal guards, constructor reset and three restart bags.
- Medium additionally covers canonical full/mini zero/single/double, corners,
  four facings, fourth/fifth kicks, failed actions, HD-SPIN-1 positive/zero
  travel, manual soft credit, PC1–4/crossing/B2B-PC, consecutive Tetrises,
  B2B continuity/break, level-two combo and old-level crossing; legal partial
  and wholly-hidden controls. Low has corresponding native boundary controls.
  High rejects above-field poses and has no hidden storage; no virtual hidden
  fixture is passed off as a successful implementation result.
- Every engine probe repeats in real Chromium at1280×800 and390×844. Actual
  Left/Right/Up/X/Z/LeftCtrl/Down/Space/C/R paths,15 real alternating shifts,
  restart and pause controls are exercised; medium's hard/timed spin paths
  receive additional actual-key checks. Canvas forwarding checks exact ghost
  positions. All six final full-page screenshots inspected. No application
  console/page/asset failures; harmless favicon404 excluded.

| Effort/view | Board x,y | Displayed size | Document size |
|---|---|---|---|
| low desktop |440,70|288×528|1280×800|
| low phone |20,70|241.8×443.3|390×844|
| medium desktop |462,111|312×624|1280×800|
| medium phone |84.9,72|220.2×440.4|390×844|
| high desktop |489,155|302×494.2|1280×800|
| high phone |22,119|236×386.2|390×844|

All fit without horizontal overflow. Previews are proportional and visually
inside their slots. Low has labeled five-next/hold canvases and a compact full
keyboard legend, native repeat, no pause/touch controls: **UX8.0**. Medium has
five DOM previews with piece names, focus/announcement handling, pause/resume,
custom repeat, visible phone controls and complete desktop legend: **UX9.0**.
High has three named preview canvases, beveled colors, best-score storage,
custom repeat, pause/restart and phone controls: **UX9.0**. These assess the
interface; rule substitutions are not deducted again from UX.

Own tests are evaluated without audit-probe credit. **Low4.5:** four cases
cover one constructed bag, preview availability, restricted hold/retrieval
availability, ghost cells, an integrated single clear, gravity500 lock and a
custom wall rotation/blocked hold spawn. No standard geometry, complete actual
bag stream, scoring tiers/spins/PC/B2B/combo, cap/ledge/lower-row, partial bounds,
terminal/reset or browser checks. **Medium6.5:** ten cases include helper bags,
complete hold roundtrip, actual T/I wall and T floor kicks, ghost exact cells/
points, gravity/soft/lock, reset-limit integration, real consecutive Tetrises/
combo/level crossing, real-rotation full spin and blocked-hold terminal board.
Omissions include a complete shape/kick oracle, mini/PC/HD-SPIN-1, failed-reset/
ledge/new-lowest, hidden outcomes and browser/input; its cap assertion encodes
the early lock. **High5.5:** seven cases/seeded native helper bags/colors,
custom kicks, exact ghost points/cells, restricted hold/spawn restoration,
gravity/450/eight-reset clocks, two-row compaction/level/combo and broad terminal
guards. No Guideline shape/spin/scoring/cap assertions or browser tests. This is
above a trivial smoke suite but below medium's actual T/I/scoring integration.

All are strict, readable dependency-free TypeScript with an RNG seam and
DOM-free engine. Low's two-module150-line engine plus simple canvas entry is
particularly direct (**code8.5/simplicity9.5**); numeric piece IDs and broad
public mutable state are less expressive. Medium separates pieces/engine/UI
(**9.0/9.0**); high additionally separates drawing (**9.0/9.0**). Helpers and
small servers are proportionate; no framework or unnecessary infrastructure.
No duplicate code-quality penalty for incorrect rules.

Focused deterministic audit, not exhaustive state-space or long-session proof.
Chromium only, no physical phone/touch/HiDPI or other browser engine, no full
OS-repeat/multikey/focus combinatorial audit. Phone buttons and previews were
visually inspected; pointer sequences are not exhaustively asserted. Native
polyomino fixtures verify only what the delivered custom engines express;
standard T-spin and some Tetris requirements are absent, not waived. Fixed
stack/pose boundary setups are not public reachability proofs. Automatic-spin,
gravity-floor and spawn-height open interpretations remain unpenalized.

## Validation

- `python3 .audit/run-gpt62-sol-audit.py --offline --record --review`: passed
  all efforts in order, locked install, explicit build, unchanged own4/10/7,
  all Node/served-module/actual-key Chromium checks; six final PNGs inspected,
  then cleanup confirmed.
- `python3 .audit/run-gpt62-sol-audit.py --offline`: final pinned fresh-copy
  rerun passed all three efforts and both viewports, with all39 hashes intact;
  copies/screenshots/logs/server/browser groups removed.
- `python3 scripts/benchmark.py render` and `python3 scripts/benchmark.py verify`:
  passed. Two historical Muse headings had suffixes after the score; their rank
  numbers were updated while preserving the suffix/body, resolving the initial
  missing-heading verification error. No old scores or audit conclusions changed.
- `node .audit/verify-ranking.mjs`: **567 local links,94 score rows**, score
  arithmetic, bug deductions, ordering and table shapes pass.
- `python3 -m unittest discover -s tests -v`: **78/78 pass**.
- `node --check .audit/gpt62-sol-audit.mjs`,
  `node --check .audit/gpt62-sol-browser.cjs`, Python `ast.parse` on the runner:
  all pass. `git diff --check`: pass.
- Parsed preservation check: **all91 old ranking entries identical**, all39
  delivery hashes and protected pre-existing audit/registry/pricing/tool files
  match the starting snapshot. Only the three new entries, new audit artifacts,
  RANKING additions/heading ordinals, audit index and generated README/ranking
  tables are changed by this review. No pending run, model rerun, server,
  browser tab, copy or temporary evidence is retained.

Final repository ranks: medium13/94, low75/94, high76/94. These are single
samples and establish no causal effect of reasoning effort. The quality review
is finished; project archival remains the parent's completion step after it
reads this completed independent-review result and verifies archivedAt.

## Parent verification (orchestrator)

Verified 2026-11-17 by the orchestrating thread (Claude Opus 5.5), independently
of this review's own claims:

- **Review thread:** T3 delegated task `Sol 6.2 low/medium/high quality audit (Sol 6.1 xhigh)`,
  child thread `thread:delegated-task:command%3Amcp%3A69baa946-1bb7-48d4-b3e7-f8299ddd7648%3Adelegate-task%3Af6813b70-efe1-43bc-a7b7-a39f0039dcbc`,
  status completed.
- **Native session:** `~/.codex/sessions/2026/11/17/rollout-2026-11-17T21-56-14-01a1eb4b-c6ce-7a20-9ba5-234984b26439.jsonl`
  (originator T3 Code, cwd this repository). Its `turn_context` records
  **model=gpt-6.1-sol, effort=xhigh**. It contains no `spawn_agent` or
  `delegate_task` calls; the only related session,
  `01a1eb4c-d169-7910-983c-769476d72f28`, is Codex's automatic approval
  reviewer (`guardian_review`, `codex-auto-review`/low, parent this session)
  and made no tool calls.
- **Artifacts:** this review, the runner/fixtures/evidence named above, three
  new `ranking.json` entries (low 6.55, medium 8.50, high 6.50); no other
  run's entry changed relative to the last commit apart from the earlier
  uncommitted November 16 cohort.
- **Re-checks:** `python3 scripts/benchmark.py verify` exit 0;
  `node .audit/verify-ranking.mjs` 567 links / 94 score rows;
  `python3 -m unittest discover -s tests` OK. The custom-piece majors were
  confirmed in source (`gpt-6.2-sol-high/src/pieces.ts` defines three- and
  five-cell pieces; fields are 12×22 low and 11×18 high) against TETRIS.md,
  which requires the regular brick shapes, 7-bag and SRS.
