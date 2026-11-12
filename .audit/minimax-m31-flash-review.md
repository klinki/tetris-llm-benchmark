# MiniMax M3.1 Flash independent audit

**2026-11-12, Europe/Prague — GPT-6.1 Sol xhigh, T3 Code / Codex.**
The review agent performed all source/own-test review, independent fixtures,
screenshot inspection and scoring itself, without further delegation.
All five requested efforts completed in the exact order **max → xhigh → high
→ medium → low**. No failed attempt, retry, replacement model or isolation
waiver occurred in the observed batch. No commit, push or PR.

The existing batch was already running when this review began. The reviewer
only observed its exact process, pending records, imported registry and
read-only `t3_runs.run_status` until all five imports existed, the process
exited and source/audit/git locks were released. It did not unlock sources,
run preflight, inspect in-progress code or start any model run. The original
command was:

```sh
python3 scripts/benchmark.py batch opencode/minimax-m3.1-flash-free max xhigh high medium low --instance opencode
```

## Method, preservation and calibration

Read TETRIS.md, SPEC.md including **HD-SPIN-1**, RANKING's complete rubric
and Methodology, ranking.json, the audit index, Hy4's review and runner/
engine/browser fixtures, GLM-5.3 low/high/MAX, GPT-6.1 Sol/MAX and Terra,
Qwen Max xhigh calibration/oracle patterns, and the auditor-agreement rulings.
The independent canonical geometry/kick oracle is reused unchanged from
[Opus effort probes](opus55-efforts-audit.mjs). No model implementation
transcript was used for quality grading. Thread metadata was read only to
verify completion and attempt settling; import identity/accounting is separate.

Reviewed all delivered client/engine/server TypeScript, complete own tests,
HTML/CSS, asset/server scripts, package and complete lockfiles, TypeScript
configs, ignore files, task READMEs and generated statistics. All **131 files**
remain unchanged: max 22, xhigh 21, high 50 (including 26 generated test-build files), medium 19, low 19. The retained
[evidence and SHA-256 inventory](minimax-m31-flash-evidence.json) identifies
every file. All **81 historical ranking entries remain identical as parsed
data**. Existing Crouton and Inkling docs/pricing and parent-added MiniMax
pricing are preserved. Implementations and own assertions were never repaired.

Same half-point scale and **40/20/20/10/10 weights**. Correctness begins at10;
critical−4/cap4, major−1.5, minor−0.5. Each confirmed group is deducted once.
Own omissions affect tests only; added audit probes earn no own-test credit.
Tokens/time/cost, requested effort and isolation have no quality-score effect.
Max's absent spins/PC and broken B2B form one major scoring group following
Qwen Max xhigh. Low's missing level multiplier is a common scoring-feature
major; its isolated PC omission and spin-edge group stay separate. Spin
history, corner and kick promotion variants form one minor per affected run,
following full GLM low. Medium's two B2B bonus branches are one group.
Landing/contact, reset allowance, hidden boundaries, restart bags and layout
follow Hy4/GLM/Terra/Sol calibration. No extra penalty for native repeat,
spawn height, gravity floors, lack of touch UI, or reachable vertical scroll.

## Scores

| Effort | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings | Repository rank |
|---|---:|---:|---:|---:|---:|---:|---|---:|
| max | 4.0 | 6.5 | 9.0 | 8.5 | 8.5 | **6.40** | 2 major, 6 minor | 71/86 |
| xhigh | 9.0 | 6.5 | 9.0 | 8.5 | 8.5 | **8.40** | 2 minor | 17/86 |
| high | 6.0 | 7.0 | 9.0 | 8.5 | 8.5 | **7.30** | 8 minor | 57/86 |
| medium | 6.5 | 5.5 | 9.0 | 8.5 | 8.5 | **7.20** | 7 minor | 59/86 |
| low | 3.5 | 4.5 | 8.5 | 8.5 | 8.0 | **5.65** | 2 major, 7 minor | 74/86 |

Weighted totals are recomputed from registry values; the defect counts above
produce each correctness score exactly. The effort labels do not establish a
causal quality trend from a single sample per setting.

## Reproduce

```sh
python3 .audit/run-minimax-m31-flash-audit.py --offline
# Interactive pause to inspect all ten screenshots before cleanup:
python3 .audit/run-minimax-m31-flash-audit.py --offline --review
```

[Runner](run-minimax-m31-flash-audit.py), [engine fixtures](minimax-m31-flash-audit.mjs),
[Chromium fixtures](minimax-m31-flash-browser.cjs), [complete pinned engine
outcomes](minimax-m31-flash-engine-results.json), [browser numbers/file
hashes](minimax-m31-flash-evidence.json). Passing confirms the recorded
outcomes, including defects; it is not a conformance certificate. Actual
scores and the independently stated expectations remain distinct.

Random disposable copies exclude node_modules/dist/build output/.git.
Locked `npm ci --ignore-scripts --offline`, explicit `npm run build`, then
unchanged `npm test` pass initially for every effort. Low later fails its unseeded blocked-spawn test; seed1 passes16, seed4 reproducibly gives15 pass/1 fail. Node26.0.0; locked TypeScript5.9.3
except high7.0.2; Playwright1.64.0, Chromium156.0.8078.4. Offline requires the
cached packages; omit it on a clean machine and install root Playwright/
Chromium separately. Own workflows were rerun in fresh copies after probe
finalization. High’s26 delivered generated build-test JS/map files were also compared byte-for-byte with a fresh unchanged compilation; all match. Source/own-suite hash checks exclude generated output, while the original delivery inventory preserves all 131 files. Copies, logs, screenshots and owned process groups are cleaned
on success, failure and handled interruption; `--review` requires a PTY.

Only max/xhigh copied server port constants are adapted to PORT on free
41000–49999 ports and restored before source-hash comparison. The other
servers already honor PORT. The declared npm start commands were also
exercised in initial disposable copies. The final runner invokes their
unchanged server commands after the same explicit build, so its added dist
observation handles survive. Main/engine/input/render bodies remain intact;
only handles are inserted and RAF/performance clock/drawing calls observed.
Seeded RNG seams/wrapping isolate randomness. Low’s own suite is also run unchanged with Node import preloads that set an LCG RNG: seed1 passes, seed4 fails only the blocked-spawn assertion. Its row0 fixture misses a horizontal I, whose cells occupy row1. This is a test-fixture error, not a blocked-spawn engine defect; tests score drops5.0→4.5 and correctness is unchanged. Sacrificial rejection overrides
are used solely to capture ordered kick candidates, never for outcome or
scoring tests. No fixture assigns spin history or rotation success.

The preview browser opened max's unadapted8321 server and repeated the engine
and real-key spin checks. Both screenshot attempts failed with
“Preview automation snapshot timed out after15000ms.” Its tab was closed;
the established Playwright workflow completed all ten real Chromium views.
A fixture initially used .mjs on a server without that MIME mapping; it was
renamed .js. A readiness check initially assumed IPv4 while xhigh binds
localhost IPv6; checking localhost fixes the audit only. Full recorded-result
comparison normalizes JSON's negative zero. These were audit harness issues,
not delivery failures or model retries. Final full runner passed all efforts.

## Confirmed groups and exact reproductions

All positions below use visible x0..9,y0..19 and canonical origins. O's native
2×2 origin is translated by one fixed x offset; max/high native y=visible+2,
medium=visible+4; xhigh and low use visible y directly. Direct legal pose/
stack/clock setup is allowed and independently checked for collision. Boundary
setups are not presented as public spawn-to-pose reachability proofs.

### max

1. **Major: I geometry and kick tables are not canonical SRS.** I3 is duplicated from I1 (column2 instead of column1), and I3>2/I0>3 ordered kick tables are wrong. 28-state/48-list probes pin these differences;84/576 independent actual rotations differ when ceiling cases are included.

2. **Major: Spin and perfect-clear scoring are absent and B2B is incorrect.** Real rotated full/mini zero/single locks score0/100 instead of400/800 or100/200; full double300 instead of1200. PC1–4 give100/300/500/800 instead of900/1500/2300/2800. Consecutive Tetrises total2100 instead of2050; Tetris/no-clear/Tetris1600 instead of2000. Triples incorrectly count as difficult, with extra50-per-streak bonuses. One grouped scoring major, following Qwen Max xhigh.

3. **Minor: Landing frames shorten lock delay.** O one row above floor at (3,17), advance990 ms in <=16 ms parts, then16,483,1 ms. No welded cells at1489; four at1490 instead of a full500 ms after contact at1000. The entire landing frame is charged as grounded time. Node and unchanged served RAF agree.

4. **Minor: Reset-cap handling forces early locks and keeps spent resets at a lower row.** Fifteen grounded shifts then100 ms, a sixteenth shift and1 ms weld four instead of waiting until500. O r0 at (-1,12), supports (0,14),(1,14); fifteen successful alternating shifts,490 ms, Right off the ledge, fall to the new lowest row. After400 ms grounded, Left then100 ms welds four (total6 including supports) instead of granting a fresh500 ms. No airborne weld; spent15 resets are not restored.

5. **Minor: The ceiling rejects legal upward SRS kicks.** Legal S r1 at (-1,-2), blockers (2,-2),(0,0), real CCW should use fifth SRS candidate r0 at (0,-4). Rotation fails and leaves the original pose because the two-row storage boundary is treated as a solid ceiling. This is a legal-pose setup, not a claimed spawn-to-pose replay.

6. **Minor: Restart reuses a partial old bag.** After actual top-out and reset, the first seven pieces have only six distinct types for seeds1,2,42 because the bag is not reset. Fresh games pass100 actual bags. Real R/placements reproduce the seed42 duplicate opening.

7. **Minor: Space and movement still alter a paused game.** Fresh T at(3,5), P then Space welds four cells and adds drop points while status remains paused. Engine and real Chromium keys reproduce it; tick alone is paused correctly.

8. **Minor: The phone layout clips the playfield.** At390×844 document width443; board x=-53,width300 and panel x263,width180. The fixed496px cabinet clips53px from the field and extends right. Desktop fits. One layout deduction.

### xhigh

1. **Minor: Spin history and fifth-kick mini promotion are incorrect.** HD-SPIN-1: stack (0,17),(0,19),(2,19), T r0 at (0,3), real CW to r1 and independently verified ghost (0,17), fourteen-row hard drop scores128 instead of28. Zero-travel mini/full hard and timed controls score100/400 correctly. Manual soft rows correctly cancel credit. Actual fifth kick T r1,(3,17), stack(4,15),(6,15),(6,17),(3,18),(6,18),(3,16), CW reaches r2,(4,15); zero-drop score100 instead of full400. Related spin edges grouped once, following GLM low.

2. **Minor: Landing frames shorten lock delay.** O one row above floor at (3,17), advance990 ms in <=16 ms parts, then16,483,1 ms. No welded cells at1489; four at1490 instead of a full500 ms after contact at1000. The entire landing frame is charged as grounded time. Node and unchanged served RAF agree.

### high

1. **Minor: Spin history and fifth-kick mini promotion are incorrect.** HD-SPIN-1: stack (0,17),(0,19),(2,19), T r0 at (0,3), real CW to r1 and independently verified ghost (0,17), fourteen-row hard drop scores128 instead of28. Zero-travel mini/full hard and timed controls score100/400 correctly. Manual soft descent also leaves100 stale mini points. The fifth-kick fixture documented for xhigh gives100 instead of400. These manifestations are one spin-edge group.

2. **Minor: Perfect-clear bonuses are absent.** PC1–4 give100/300/500/800 instead of900/1500/2300/2800, and PC at a level crossing gives100 instead of900. One bonus omission.

3. **Minor: A no-clear lock breaks B2B.** Real Tetris, no-clear O placement, then Tetris totals1600 instead of2000. Consecutive Tetrises score2050 correctly. scoreClear returns backToBack=false for a non-difficult no-clear placement.

4. **Minor: Landing frames shorten lock delay.** O one row above floor at (3,17), advance990 ms in <=16 ms parts, then16,483,1 ms. No welded cells at1489; four at1490 instead of a full500 ms after contact at1000. The entire landing frame is charged as grounded time. Node and unchanged served RAF agree.

5. **Minor: Reaching a lower row does not restore spent lock resets.** O r0 at (-1,12), supports (0,14),(1,14); fifteen successful alternating shifts,490 ms, Right off the ledge, fall to the new lowest row. After400 ms grounded, Left then100 ms welds four (total6 including supports) instead of granting a fresh500 ms. No airborne weld; spent15 resets are not restored.

6. **Minor: The ceiling rejects legal upward SRS kicks.** Legal S r1 at (-1,-2), blockers (2,-2),(0,0), real CCW should use fifth SRS candidate r0 at (0,-4). Rotation fails and leaves the original pose because the two-row storage boundary is treated as a solid ceiling. This is a legal-pose setup, not a claimed spawn-to-pose replay.

7. **Minor: Restart reuses a partial old bag.** After actual top-out and reset, the first seven pieces have only six distinct types for seeds1,2,42 because the bag is not reset. Fresh games pass100 actual bags. Real R/placements reproduce the seed42 duplicate opening.

8. **Minor: The phone page overflows horizontally.** At390×844 document width407; the canvas x24,width358.8 remains inside the viewport, but layout padding/help produce17px horizontal overflow. Supporting text is cut at the initial viewport. Distinct from max/low clipping the actual well.

### medium

1. **Minor: A travelling hard drop retains stale spin credit.** HD-SPIN-1: stack (0,17),(0,19),(2,19), T r0 at (0,3), real CW to r1 and independently verified ghost (0,17), fourteen-row hard drop scores128 instead of28. Zero-travel mini/full hard and timed controls score100/400 correctly. Fourteen public manual softDrop calls clear credit; the hard-drop history remains stale. Fifth-kick promotion and ordinary corner controls pass.

2. **Minor: Back-to-back mini and perfect-clear bonuses are under-awarded.** Two actual mini singles: second250 instead of350 including combo. Tetris/no-clear/Tetris-PC totals4000 instead of5200: final award3200 instead of4400. Ordinary B2B, normal PC1–4 and pre-clear PC crossing pass. Related B2B bonus edges grouped once.

3. **Minor: Soft-drop entry spends old normal-gravity time.** O at(3,0),800 normal ms, setSoftDrop(true),1 ms gives16 rows/16 points. Real Down adds its immediate row, then1 ms yields17 rows/17 points. Faster cadence should not convert the old800 ms into scored soft rows.

4. **Minor: Reaching a lower row does not restore spent lock resets.** O r0 at (-1,12), supports (0,14),(1,14); fifteen successful alternating shifts,490 ms, Right off the ledge, fall to the new lowest row. After400 ms grounded, Left then100 ms welds four (total6 including supports) instead of granting a fresh500 ms. No airborne weld; spent15 resets are not restored.

5. **Minor: A wholly hidden lock continues play.** O at(-1,-2),support(0,0), incoming I independently open: zero-drop welds four hidden cells but continues playing after the100 ms entry delay. Partial visible controls correctly continue. No whole-piece lock-out check exists.

6. **Minor: Restart reuses a partial old bag.** Actual top-out/restart yields only6/5/6 distinct opening types for seeds1/2/42. Real R reproduces the seed42 duplicate. Fresh games pass100 bags.

7. **Minor: Left Ctrl does not rotate.** The advertised Left Ctrl CCW binding is absent from the input switch. Real ControlLeft leaves the T orientation unchanged in desktop/phone Chromium; Z works.

### low

1. **Major: Three I kick transitions are not SRS.** I3>2,I3>0,I0>3 have the wrong ordered offsets. All28 state sets pass after the fixed O origin translation;14/576 independent actual rotations differ. Example I r0,(0,8), blockers in the committed exact fixture: CCW lands r3,(1,8), expected(-1,8).

2. **Major: Line and spin base points do not scale with level.** applyScoring never multiplies normal/spin base points by level. At level2, the second single of a combo awards200 instead of300; the first awards100 instead of200. This breaks the common level-scoring feature; combo alone is level-scaled.

3. **Minor: Perfect-clear bonuses are absent.** PC1–4 give100/300/500/800 instead of900/1500/2300/2800; B2B-PC total2000 instead of5200. Ordinary B2B/no-clear continuity pass.

4. **Minor: Spin history and corner/kick classification are incorrect.** HD-SPIN-1: stack (0,17),(0,19),(2,19), T r0 at (0,3), real CW to r1 and independently verified ghost (0,17), fourteen-row hard drop scores128 instead of28. Zero-travel mini/full hard and timed controls score100/400 correctly. Manual soft travel also leaves100 stale mini points. Two occupied front corners without a third corner score400 instead of0; fifth-kick promotion scores100 instead of400. Related spin edges grouped once rather than one penalty per manifestation.

5. **Minor: Airborne moves spend resets and a lower row keeps them.** Fifteen open-air shifts consume all15 resets before first contact. O r0 at (-1,12), supports (0,14),(1,14); fifteen successful alternating shifts,490 ms, Right off the ledge, fall to the new lowest row. After400 ms grounded, Left then100 ms welds four (total6 including supports) instead of granting a fresh500 ms. No airborne weld; spent15 resets are not restored.

6. **Minor: Hidden locks discard cells and continue play.** Legal O at(-1,-2) over support(0,0), incoming I open: zero-drop discards all four above-field cells and continues playing with only the support left. Whole hidden lock-out and partial-cell retention are absent; grouped boundary/lock-out minor.

7. **Minor: Hard drop still changes a terminal game.** After blocked spawn the active colliding piece is retained. hardDrop has no state guard and changes board/score/spawn after gameover; the full before/after terminal snapshot differs. Movement/rotation/hold are guarded. Independent served-module probes reproduce the state change.

8. **Minor: The phone layout clips the playfield.** At390×844 the430px canvas begins x=-20 and document width434; the left well and control text are clipped. Desktop fits. One responsive-layout deduction.

9. **Minor: Held preview overlaps its label.** Held T preview cells extend from native y24 to52 while the HOLD label baseline is28. Forwarded drawing and both screenshots show the top purple cell painted over HOLD. Separate from the phone clipping; no own rendering assertion covers it.

## Coverage and rule limits

- Every one of28 canonical piece states, allowing only fixed O origin
  translation;48 actual ordered non-O kick lists and576 first-fitting
  CW/CCW outcomes per effort, independently computed with walls/floor/stacks
  and above-buffer candidates. Mismatches max84,xhigh0,high63,medium0,low14.
  Max/high's ceilings are evaluated against the existing open-above-buffer
  convention, not silently incorporated into the oracle. The S boundary
  fixture pins this separately from I data defects. O rotation geometry is
  checked; successful O rotation is not imposed as a requirement.
- 100 actual bags across10 seeds/effort, clearing the stack between actual
  locks; hold restriction and post-lock retrieval in spawn orientation;
  independently obstructed ghosts for all seven pieces, exact drop points,
  exact four welded cells and nonadjacent-row compaction.
- Existing-ground499/500, successful movement reset, failed-wall controls,
  full15 allowance/cap, early sixteenth action, natural contact partitions,
  ordinary/exhausted ledges, airborne allowance and new-lowest restoration.
  No tested effort welds a piece in air after the ledge move. Medium/low's
  sampled1506ms locks are after contact; no early-contact deduction applies.
- Actual level1..20 gravity thresholds, level10 at60/144Hz (all9 rows in600ms),
  normal-to-soft timing/release and fresh held-piece phase. High's7ms floor
  and low's rounding are recorded without gravity-floor deductions under the
  auditor-agreement rule question. Automatic-gravity spin history likewise
  remains unresolved and is not inferred from HD-SPIN-1.
- Integrated normal1–4, consecutive Tetris/combo, no-clear B2B continuity and
  break, level-two combo and old-level crossing, PC1–4/B2B-PC/crossing;
  actual rotated full/mini zero/single with hard and timed locks, full double,
  two-corner/no-rotation/fifth-kick controls, failed actions, positive/zero
  hard-drop and manual-soft history controls. Not every spin facing or cavity
  is exhaustively certified.
- Blocked spawn and complete terminal snapshot, stored hidden/partial locks
  where supported, reset state and first seven pieces after actual top-out
  over three seeds. Low's above-field O loss is a legal-pose diagnostic, not
  an assertion that a player reaches that O origin from spawn.

All engine outcomes repeat against served modules at both browser sizes.
Actual keyboard tests exercise Left,Right,Up,X,Z,Left Ctrl,Down,Space,C,R;
medium's Left Ctrl is explicitly asserted as the failing outcome. Real RAF
reproduces contact timing and soft entry; actual CW/Space and timed locks
replay HD-SPIN-1 travel and mini/full zero-travel controls. Actual R after
natural game over validates reset and the opening bag. Max's paused Space
is independently reproduced. Browser page/application asset errors: none
(harmless favicon excluded). Forwarded draw calls plus all ten inspected
full-page screenshots verify ghost/previews and the reported clipping.

| Effort | Desktop canvas (CSS px) | Phone canvas x / width | Phone document width / height |
|---|---|---|---|
| max | board300×600, panel180×600 | board−53 /300; panel263 /180 |443 /965|
| xhigh | board300×600 | board45 /300 |390 /1314|
| high | canvas440×560 |24 /358.8 |407 /850|
| medium | board260×520 |65 /260 |390 /1108|
| low | canvas430×560 |−20 /430 |434 /844|

Xhigh/medium keep all supporting state reachable by scrolling; no deduction
for vertical page height. All previews keep square cell proportions. The
low held-T label overlap occurs at both sizes. High's help overflows but its
well fits, unlike max/low's clipped fields. Neither touch hardware, HiDPI,
other browser engines nor every OS repeat/focus/multikey combination is
certified. Exact fonts/scroll heights may vary. No long-duration/state-space
proof or claim of bug-free untested behavior.

## Own tests, code, simplicity and UX

| Effort | Unchanged own result | Tests rationale |
|---|---|---|
| max |65 checks pass|6.5: seeded helper bags/counts, all-state size and non-I rotation-cycle invariants, kick shape/symmetry and I0→1 table, actual I floor kick, walls, obstructed ghost/drop points, integrated single/combo, normal scoring helpers/levels, soft/gravity, basic lock/reset, hold retrieval, blocked spawn/reset/pause tick. No spin/PC, exact cap/contact/ledge, no-clear B2B, restart-bag, terminal input or browser checks. Own I-state exception and1250 B2B expectation encode defects.|
| xhigh |17 cases pass|6.5: two helper bags, exact T/I/O spots, actual I wall and T floor kicks, compaction, empty ghost fit, first/restricted hold/queue, integrated single/Tetris/level crossing/real-rotation T-spin double, soft rows/points, basic resting lock, blocked spawn/reset. No reset/cap/ledge/mini/PC/B2B integration, hold orientation or input/browser assertions.|
| high |24 logic +7 input pass|7.0: seeded/many helper bags, T/I/O spots, compaction, scorer normal/level/combo/B2B/spin tables, integrated single/Tetris/drop/hold/empty ghost/actual T floor kick, basic lock/reset, blocked spawn/reset and seven EventTarget input cases including DAS. The blocked-rotation fixture overlaps its starting T with the filled column; no valid blocked-kick credit. Spin checks call the scoring helper, not engine recognition. No cap/contact/ledge/PC/no-clear B2B/restart-bag or browser checks.|
| medium |18 cases pass|5.5: two helper bags, four-cell counts/I spot/table lengths, board row clear, real1000ms gravity, exact hard points, normal single/Tetris/PC and level multiplier/crossing, first/restricted hold, empty ghost, T floor CW, blocked spawn/restart. No own lock timer/reset/cap/ledge, spin/B2B/combo, soft transition, exact obstructed welded geometry, Ctrl/input or browser assertions.|
| low |seed1:16 pass; seed4:15 pass/1 fail|4.5: counts/O invariance/T0 spot, kick existence, two unseeded helper bags, board bounds/one-row shift, gravity helper, single/hard points/loose Tetris, hold restriction, open-space T rotation described as wall kick, blocked spawn and empty/blocked ghost. No actual timed gravity, lock/reset, real forced kick, level multiplier, spin/B2B/combo/PC, restart, terminal or input/browser assertions.|

Counts alone earn no credit, and audit fixtures change none of these own
coverage assessments. Low has a reproducible own-suite fixture failure; the other suites pass without an observed own failure.
They are below the Qwen Max xhigh7.5 suite's exact welded geometry and real
B2B/two-kick integration, and below Sol's broad9.0 suites. High's real input
suite supports its7.0; medium/low omit the timing/scoring integration of6.5.

Code9.0 and simplicity8.5 for max/xhigh/high/medium: readable strict TypeScript,
focused board/pieces/randomizer/game/input/render/entry modules, DOM-free
engines, one millisecond time unit, proportionate plain helpers and no browser
runtime dependencies. High has explicit events; medium keeps input repeat in
the engine. Public mutable/private-emitted state needs caller discipline.
Low code8.5/simplicity8.5: similarly readable direct modules, but unused state/
imports and mixed kick/shape access with board storage are less tidy; compiler
unused checks are absent. These judgments do not repeat correctness penalties.

UX8.5 for the first four,8.0 for low: distinct colors, ghost/grid, hold/next,
score/lines/level and visible legends provide usable keyboard-first games.
Max/high have canvas labels and DPR treatment; xhigh has clear notifications,
best score and pause overlay; medium provides visible time/combo. Low has a
smaller basic HUD and no canvas accessibility name. No touch controls and
incomplete focus/repeat behavior are limits, not invented task requirements.
Confirmed clipping/label/control defects are charged only once to correctness.

## Non-scoring identity, usage, pricing and handoff

All raw T3 metadata/registered sessions select exactly
**opencode/minimax-m3.1-flash-free**, provider instance **opencode**, variants
max/xhigh/high/medium/low, single task prompt. All use task spec SHA-256
`36e2097a78fe8b5646e6216338640831cff0a284cc823c4b1f658991c8d40294`, unchanged
from TETRIS.md. Imports completed sequentially without an isolation override;
no extra generation or transcript-based quality assessment was introduced.
Recorded variants are provider configuration labels, not equal reasoning
budgets or proof that the free backend applied five different budgets.

| Effort | Workspace key suffix | Session ID | Recorded total tokens | Elapsed |
|---|---|---|---:|---|
|max|d158b72e0a29|ses_e30e378caffeSdYjewuoh1Axm0|7,851,898|15m25.851s|
|xhigh|1efc03ec1bc1|ses_e30d51531ffepYddHLerE6kjBv|4,824,223|12m57.223s|
|high|9b01f84226b3|ses_e30c92167ffeDNLasA807k5IC6|4,566,703|11m54.575s|
|medium|b70dd6f6137b|ses_e30be17caffeWRe8ydtX6XBEhK|7,026,125|10m22.362s|
|low|33f53810fafc|ses_e30b44653ffe66mewAa7UQnOb3|1,341,234|8m34.388s|

Totals include cache reads and output (reasoning is a subset of output), as
in unchanged STATISTICS.md. Harness overhead and cost remain unverified.
The existing MiniMax pricing entry now explicitly says the selected endpoint
is advertised free and the comparable paid API rate is **unverified/unpriced**.
No guessed paid price, zero-cost comparison estimate or claim of verified
invoiced spend was added. Crouton and Inkling pricing/docs remain intact.

All five T3 provider turns are completed. Settling each through
`t3_thread_organize` was denied: `runtime_mode_escalation_denied`,
“Child runtime mode full-access is broader than parent mode auto.” The audit
agent did not bypass that guard through shell/database changes. Parent must
settle them in its authorized runtime; this does not block quality results.

## Validation

Final full disposable runner passed: locked installs, explicit builds,
all unchanged own results (including low’s required seed4 failure), complete engine result comparisons, desktop/phone
Chromium, all 131 original/copied source hash checks; all ten screenshot views
inspected and deleted after review. Prior harness-only failures above were
corrected without touching delivered code. Final repository validations are
recorded below after render/verify/site checks.

- `benchmark.py render` and `benchmark.py verify`: passed.
- Each of the five `benchmark.py verify <run-id>` commands: passed. An initial
  attempt passed five IDs to a single-ID CLI and was rejected by argument
  parsing; the corrected individual checks all pass.
- `node .audit/verify-ranking.mjs`: passed,86 rows and541 local links; weighted
  totals, deductions and sort order checked. All 81 historical entries remain
  identical; historical raw JSON formatting is preserved as well.
- `python3 -m unittest discover -s tests -v`:70 passed.
- `benchmark.py site --skip-games`, `npm run check:site`: passed for index and
  all79 site run pages under the existing exclusions. Historical game builds
  were not repeated by this site pass; all five new deliveries were built
  and served independently in disposable copies.
- Python/JS syntax and final whitespace/source preservation checks: passed.
- Final drawing assertions match all four rendered ghost cells to independent
  coordinates and count all16 max /24 other hold+next cells in both views.
  All ten screenshot views were inspected; the final added draw capture does not
  alter pixels or the display fixture. Copies/logs/screenshots and owned server/browser groups were
  removed. Existing uncommitted docs/pricing/import work is preserved.
