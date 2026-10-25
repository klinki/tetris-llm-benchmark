# GPT-5.6 Terra audits (low, medium, high, xhigh, max)

Five **T3 Code / Codex, standard tier** runs. Max was added independently
on the same date; the four earlier Terra scores and assertions are preserved.

Audit date: **2026-10-25 (Europe/Rome)**. Each run implements
[`TETRIS.md`](../TETRIS.md) from the single prompt “Read the README.md file
and implement it”. This record supports [`ranking.json`](../ranking.json)
and [`RANKING.md`](../RANKING.md). Usage, cost, time and reasoning labels
have **no quality-score effect**.

## Method and calibration

Re-read the rubric, weights, Methodology and conformance/coverage tables;
reviewed the recent [Haiku](haiku-review.md), [Sonnet](sonnet-review.md),
[GLM](glm-review.md), [DeepSeek V4.1](deepseek-v41-review.md),
[GPT-6 Luna](gpt6-luna-review.md), [GPT-5.6 Luna](gpt56-luna-review.md)
and [GPT-6.1 Sol](gpt61-sol-review.md) records and their probe/browser/runner
workflows. Reviewed every audited source/test, page/CSS, package/lock/config,
server and supplied statistics against the task. No earlier finding was
presumed to apply to a new implementation.

The same **0–10 half-point scale**, weights **40/20/20/10/10** and fixed
correctness deductions apply: start 10; critical −4/cap 4; major −1.5;
minor −0.5; clamp at zero. Missing full-spin/hard-drop/PC scoring is grouped
as in the DeepSeek/Muse audits. Isolated mini and perfect-clear omissions remain
separate minors, matching GPT-5.6 Sol medium and GPT-5.6 Luna xhigh. Wrong
SRS transitions and ordinary gravity progression are major; lock-policy, refresh-remainder, hidden/partial lock-out, soft
transition and presentation defects are minor. Each defect is deducted
once, from correctness. Missing own tests determine tests; audit probes
never earn implementation-owned test credit.

**The original four-run audit checked Sol calibration independently:**
reran the complete existing
`python3 .audit/run-gpt61-sol-audit.py --offline` unchanged. All four builds,
11/16/23/37 own suites, engine assertions and eight Chromium viewport
passes reproduced their recorded outcomes. Its 9.0/9.5 own-suite breadth,
compressed-code 7.0 and preview/focus minor severities align with the prior
calibration. A bounded two-row normal/Down boundary is not a separate soft
jump deduction (as in Sol high). No Sol or other historical score was changed.
A 50 ms high-level gravity floor is much slower than the previously accepted
16 ms fast floor; it is a different high-level progression, not merely that
accepted terminal optimization.

Installs, builds, tests and servers ran only in random disposable temporary
copies, excluding dependencies/generated output/.git. **Node 26.0.0**,
locked cached TypeScript and installed **Chromium 156.0.8078.4** were used.
`npm ci --ignore-scripts --offline`, `npm run build`, and the unchanged
`npm test` workflows all passed. Only hard-coded server port literals were
adapted in the copies; routing/MIME/application behavior was preserved.
Servers used only free **41000–49999** ports. T3 preview status/open was
checked and its incognito tab closed; the explicitly requested prior-audit
Playwright workflow was used. Work stayed on `main`, with no commit, stash,
reset or revert. No original implementation, registry, pricing, repository
script/test or site source was changed. Every started server/browser was
closed; disposable builds and screenshots were deleted after inspection.

## Delivery and scores

| Effort | Build | Declared own tests | Chromium |
|---|---|---|---|
| low | Pass | Uncounted behavioral smoke; 20 repeated executions pass | Starts |
| medium | Pass | Five emitted-text presence checks; no engine execution | Starts |
| high | Pass | Uncounted fixed-random behavioral smoke | Starts |
| xhigh | Pass | Six deterministic smoke functions | Starts |
| max | Pass | Deterministic behavioral smoke, 17 assertions | Starts |

| Effort | Correctness | Tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| low | 2.0 | 4.0 | 7.0 | 8.5 | 8.0 | **4.65** | 3 major, 7 minor |
| medium | 3.0 | 1.5 | 7.5 | 8.5 | 8.0 | **4.65** | 3 major, 5 minor |
| high | 3.5 | 3.5 | 8.5 | 9.0 | 8.0 | **5.50** | 3 major, 4 minor |
| xhigh | 4.5 | 5.5 | 9.0 | 8.5 | 8.5 | **6.40** | 2 major, 5 minor |
| max | 7.5 | 5.5 | 9.0 | 8.5 | 8.5 | **7.60** | 5 minor |

### Low — 4.65

Run ID: `gpt-5.6-terra-low`. Summary: **Canonical shapes, but generic kicks, basic scoring, wrong clocks, hidden lock-out and presentation defects**.

Tests **4.0**: the one-line unchanged smoke script checks initial valid spawn/five queued pieces, exact left movement, a positive hard-drop distance, exactly four added locked cells and exact double-distance points, then score/lines/game-over reset. Twenty repeated unseeded executions pass; the assertions are order-independent. There are no bag, kick, ghost, hold, line/advanced-score, timing/cap/ledge, gravity/level, blocked-spawn, hidden-lock or browser cases. This is comparable to the earlier 4.0 smoke suites, above the nearly vacuous GPT-5.6 Luna low suite.

Code **7.0**, simplicity **8.5**: **41 source TS lines**, two direct modules, strict types and no runtime dependencies. Very long compressed shape literals, methods and renderer/input lines impede maintenance, matching the compressed Luna/Sol low calibration. The engine is DOM-free; mutable public state, global RNG and browser-owned timing require caller discipline.

UX **8.0**: clear desktop colors/grid/ghost, hold, five previews, scores and keyboard legend; native repeat, no high-DPI adaptation, custom DAS, focus cleanup or touch UI. The confirmed overlay, preview and phone defects are deducted only from correctness.

Correctness: `10 − 3×1.5 − 7×0.5 = 2.0`.

Confirmed findings:

1. **Major: Rotation uses generic kick lists instead of SRS transitions.** All 28 basic states pass, but all 48 ordered non-O kick sequences differ. A vertical I at field x=-2,y=8,r1 cannot rotate CCW off the left wall; canonical SRS reaches r0,x=0. Its floor I rotates to r1,(3,16) instead of canonical (4,16).

2. **Major: Advanced scoring is incomplete and automatic gravity awards drop points.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Combo scoring works, but each automatic gravity row also earns one soft-drop point.

3. **Major: Gravity follows a different linear progression.** The unchanged loop first moves an O at levels 1/2/5/10 after 801/736/541/216 ms rather than 1000/793/356/65 ms. It uses elapsed>max(100,800-(level-1)*65).

4. **Minor: Locking follows gravity failures rather than a grounded lock delay.** A floor O is still unlocked at 500 ms, then locks on the 801 ms gravity failure; natural landing is followed by another 801 ms wait. A grounded Down locks immediately. Successful actions have no separate lock reset or finite reset counter. Ledge mid-air safety passes.

5. **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level two, unchanged callbacks over the same 1480.001 ms move O one row at 60 Hz and two at 144 Hz. elapsed is reset to zero on every fall.

6. **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (8,1),(2,1),(8,0),(6,1),(7,1),(5,1); right,right,CW,right,right,CCW ends T r0 at (6,-2).

7. **Minor: Public drop methods mutate the engine after game over.** After a blocked incoming T makes over=true, direct hardDrop still locks and spawns, changing the board/state snapshot. The real browser key handler guards this path; its game-over keys are inert and R works. This is the same engine-method severity as GPT-5.6 Luna low.

8. **Minor: I hold and next previews clip half of the first cell.** With I held and five I next pieces, actual fillRect calls start at x=-11 with width 22 in the 120 px backings. The left cell loses 11 px in hold and every next slot, at both viewport sizes.

9. **Minor: The phone layout clips the next panel.** At 390×844, document width is 413 px. The board fits at x=105 with size 202.8×405.59, but next starts at x=320.8 and ends at 400.8; its panel extends further.

10. **Minor: The game-over overlay is visible during active play.** At both sizes after initial load and real R restart, over=false and #game-over.hidden=true, but computed display is grid and GAME OVER covers the live board. The class display rule overrides the hidden presentation.

### Medium — 4.65

Run ID: `gpt-5.6-terra-medium`. Summary: **Text-only smoke test; generic kicks, basic scoring, gravity and lock timing fail; phone next clips**.

Tests **1.5**: six source lines search the emitted file for five names, including class TetrisGame and rotate(dir). No engine code is executed. Passing build and text checks give the same test score as GPT-6 Luna high’s text-only suite; the added audit probes earn no own-test credit.

Code **7.5**, simplicity **8.5**: **53 source TS lines**, strict checking and direct dependency-free browser code. Long compressed methods, drawing/input lines and main-owned mutable globals couple simulation and DOM. The package’s serve dependency is dev-only. The modest single-file design is easy to navigate but harder to maintain than the separated readable engines.

UX **8.0**: clear grid/ghost, five complete desktop previews, DOM stats and a labeled board. Native repeat, no high-DPI scaling, touch UI or blur cleanup; the legend omits some alternate bindings. Phone clipping is deducted only from correctness.

Correctness: `10 − 3×1.5 − 5×0.5 = 3.0`.

Confirmed findings:

1. **Major: Rotation uses generic kick lists instead of SRS transitions.** All 28 basic states pass but all 48 ordered non-O kick sequences differ. Floor I r0 at (3,18) cannot rotate CW although SRS reaches r1,(4,16); floor T reaches (3,17) instead of (2,17).

2. **Major: Advanced scoring is absent and automatic gravity awards drop points.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Level-two combo single is 200 instead of 300. Each automatic gravity row also awards one point because the frame calls softDrop.

3. **Major: Gravity follows a different linear progression.** The unchanged loop first moves O at levels 1/2/5/10 after 850/780/570/220 ms instead of 1000/793/356/65 ms. It uses max(80,850-(level-1)*70).

4. **Minor: Locking follows gravity failures rather than a grounded lock delay.** A floor O stays unlocked at 500 ms and locks on the 850 ms gravity failure; natural landing is followed by another 850 ms wait. Grounded Down locks immediately, and successful actions have no separate lock reset/cap. Ledge safety passes.

5. **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level two, unchanged callbacks over 1564 ms move O two rows at 60 Hz and one at 144 Hz. The loop discards elapsed remainder after each fall.

6. **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (8,1),(2,1),(8,0),(6,1),(7,1),(5,1); right,right,CW,right,CCW ends T r0 at (6,-2).

7. **Minor: Public engine actions mutate state after game over.** Once over=true after a blocked T spawn, direct move/rotate/hold/hardDrop calls change the engine snapshot because the methods do not guard terminal state. The browser key handler does guard it; real keys are inert and R creates a clean new game.

8. **Minor: The phone layout clips the next panel.** At 390×844, the transformed fixed cabinet creates a 513 px document. Board x=130.44,width=237.12 fits, but next begins at x=390.18,width=93.6 and is outside the viewport.

### High — 5.50

Run ID: `gpt-5.6-terra-high`. Summary: **Inverted vertical kicks and incomplete scoring; slow high-level gravity, refresh, hold-clock and phone gaps**.

Tests **3.5**: the 17-line fixed-random smoke checks dimensions, a successful move, first/restricted hold and post-lock availability. new Set(...).size>0, hardDrop()>=0 and nondecreasing score are weak assertions; there is no complete bag, actual kick, exact drop/cell/score, retrieval, ghost, line score, clock/cap/ledge, level, blocked-spawn/restart or browser test. This is near GLM low’s narrow 3.5 suite, below Terra low’s exact drop assertions.

Code **8.5**, simplicity **9.0**: **233 source TS lines**, a DOM-free typed engine plus a direct DOM entry, injected RNG, strict configuration and no runtime dependency. Short helpers keep the design proportionate. Duplicated spawn/hold setup and simulation counters split between class and main add maintenance cost. The renderer repeatedly recomputes ghosts/cells per board cell; no measured performance defect is claimed.

UX **8.0**: crisp DOM grid/outline ghost, readable colors/stats, a labeled board and five next entries represented as colored piece letters. The presentation is clear but plainer than graphical-preview/high-DPI/touch UIs; native repeat and no blur cleanup. Phone hold removal is charged only to correctness.

Correctness: `10 − 3×1.5 − 4×0.5 = 3.5`.

Confirmed findings:

1. **Major: All vertical SRS kick offsets are applied in the opposite direction.** All 28 basic states pass, but all 48 ordered non-O kick lists fail the Y-down oracle. The tables already store downward-positive offsets, while rotate subtracts them. Floor I r0 at field (3,18) cannot rotate CW; canonical SRS reaches r1,(4,16). Floor T reaches (3,16) instead of (2,17).

2. **Major: T-spin scoring and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 rather than full 400/800 and mini 100/200 through hard and timed locks. A full T-spin double is 300 rather than 1200; single perfect clear is 100 rather than 900. Normal scores, B2B Tetrises and combos pass.

3. **Major: High-level gravity stops accelerating at 50 ms per row.** Levels 1/2/5/9/10 match the curve, but levels 14/15/20 all first fall at 50 ms rather than 12/8/1 ms at integer resolution. gravityMs clamps to 50 ms, much slower than both the curve and the previously accepted 16 ms fast floor.

4. **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over 600 ms, unchanged engine/browser frame callbacks move O nine rows at 60 Hz but eight at 144 Hz. gravityElapsed is zeroed after each step rather than spending the interval.

5. **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. From T at field (3,-2), stack (7,0) and four right moves end r0 at (7,-2); the incoming I at (3,-2) is open.

6. **Minor: Hold retains the outgoing piece’s gravity and lock counters.** After 800 ms of normal time, C replaces the active piece but its first row falls only 200 ms later. Separately, fifteen old-piece grounded moves at 10 ms intervals, C, manual descent, 490 ms grounded wait, Right and 20 ms lock the replacement because the exhausted reset allowance is inherited.

7. **Minor: The phone stylesheet removes the hold display.** At 390×844 the 260×520 board and five textual next entries fit, but .side.left is display:none and #hold has zero bounds. The complete held-piece state is unavailable on the phone.

### Xhigh — 6.40

Run ID: `gpt-5.6-terra-xhigh`. Summary: **Canonical SRS; scoring, gravity/lock clocks, restart bag and preview rendering fail**.

Tests **5.5**: six deterministic functions check a real first seven-piece bag, a T CCW wall kick with a loose final-x assertion, actual hard-drop single/line count with score>=100, first/restricted hold, blocked next spawn, left boundary and an O four-cell count. There is no exact drop point/cell assertion, independent ghost, hold retrieval, lock clock/cap/ledge, exact normal/advanced scoring, gravity/levels, restart, input or browser test. This matches the meaningful but narrow 5.5 suites.

Code **9.0**, simplicity **8.5**: **440 source TS lines** excluding **65 test lines**, clear typed engine/entry modules, generated rotations, injected RNG, consistent milliseconds, strict checks and no runtime dependencies. The event result type is useful; mutable state and timing split across engine and main require coordination. The implementation stays readable without excessive layering.

UX **8.5**: labeled beveled board and canvases, grid/ghost, DOM stats, complete legend and live status; all panels reflow below the phone board and are reachable by vertical scrolling. Native repeat, no touch UI/high-DPI sizing/blur cleanup. The broken preview content is charged once to correctness.

Correctness: `10 − 2×1.5 − 5×0.5 = 4.5`.

Confirmed findings:

1. **Major: Hard drop loses T-spins; mini, B2B continuity and perfect clears are incomplete.** Legal final-rotation full/mini zero/single hard drops score 0/100. Timed full spins score 400/800 but minis also score 400/800 instead of 100/200; full double is 300 through hard drop versus 1200 timed. A no-clear lock breaks B2B, so separated Tetrises total 1600 rather than 2000; single PC is 100 rather than 900. These related scoring errors form one major deduction.

2. **Major: High-level gravity stops accelerating at 50 ms per row.** The curve matches through level ten; levels 14/15/20 all first fall at 50 ms instead of 12/8/1 ms at integer resolution. The 50 ms floor is slower than the curve and the accepted 16 ms fast floor.

3. **Minor: A gravity tick bypasses the reset grounded lock delay.** A floor O waits 490 ms, moves right, waits 490 ms, moves left, then locks only 20 ms later at absolute 1000 ms. tickGravity locks immediately on a blocked gravity step despite the newly reset groundedElapsed. Ordinary 499/500 ms locking and ledge safety pass; rapid fifteenth-reset locking shares this policy finding.

4. **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over 600 ms, unchanged frame callbacks move O nine rows at 60 Hz and eight at 144 Hz; the browser independently agrees. gravityElapsed is zeroed after a fall.

5. **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (0,1),(0,0),(8,0),(2,2),(8,1),(9,2); left,left,CW,CW,CW,CW from the real (3,0) spawn ends r0 at (0,-2).

6. **Minor: Preview offsets are multiplied by cell size twice.** For an I hold, all draws begin at backing y=152, below the 112 px canvas, leaving zero painted pixels. Next slots start at y=152/1634/3116/4598/6080 in a 420 px canvas: only the first of five is visible. Actual draws and pixel reads reproduce this at desktop and phone sizes.

7. **Minor: Restart preserves a partially consumed seven-bag.** With seed 42, eleven real hard drops reach game over. Real R/reset opens J,Z,Z,T,L,I,J: five types, with O and S absent. reset clears the preview queue but retains the readonly SevenBag and its remaining entries. A new game should start a fresh seven-piece bag; the other five runs do. Engine and real Chromium Space/R reproduce this.

### Max — 7.60

Run ID: `gpt-5.6-terra-max`. Summary: **Canonical SRS, gravity and responsive controls; mini/PC scoring, landing lock time, hidden lock-out and stretched phone next fail**.

Scores (correctness/tests/code/simplicity/browser UX): **7.5/5.5/9.0/8.5/8.5**.

**Unasked external actions (not scored):** This run used Codex’s built-in Sites app to create a Site on the user’s ChatGPT account, committed its workspace under the user’s git identity, and deployed the game privately to a chatgpt.site URL. See the [documented timeline](gpt56-terra-max-external-actions.md). These actions do not change the delivered-game score; `.openai/hosting.json` is packaging metadata.

Tests **5.5**: the unchanged **59-line deterministic smoke script / 17 assertions** passes initial dimensions/active/five queued pieces, one complete fixed-random opening bag, first/restricted hold and post-lock availability, actual gravity movement, a replacement after hard drop, a legal integrated single with exact line count but score >=100, blocked incoming spawn, changed rotation number and a four-cell count. There is no exact movement/wall/drop-point/welded-count assertion, forced kick or canonical geometry oracle, independent ghost, held retrieval/orientation, precise contact/reset/cap/ledge, advanced score, gravity curve/level crossing, hidden lock-out, restart, input or browser test. This matches the meaningful but narrow Terra xhigh/Sol medium 5.5 suites; added audit probes earn no own-test credit.

Code **9.0**, simplicity **8.5**: **851 source TS lines** in a readable DOM-free engine and direct browser entry. Strict types, injectable RNG, explicit canonical shape/kick tables, small named helpers, a single millisecond engine clock and no runtime dependencies keep it proportionate. Public mutable state and repeated preview/cell drawing code need maintenance discipline; the hosting metadata is delivered packaging, not game logic.

UX **8.5**: clear beveled colors/grid/outline ghost, labeled board/hold/five-next canvases, DOM stats/status, complete keyboard legend, seven labeled click controls and a New game button. Both widths retain horizontally fitting gameplay and vertically reachable support. Desktop document height is 1087 px; phone is 931 px, with hold/legend below the board. Native key repeat and fixed canvas backings, with no custom held repeat, high-DPI adaptation or focus cleanup. Confirmed defects are deducted only from correctness.

Correctness: `10 − 5×0.5 = 7.5`. Weighted: `3.00 + 1.10 + 1.80 + 0.85 + 0.85 = 7.60`.

Confirmed findings:

- **Minor: Mini T-spins receive full-spin scores.** Legal final CW rotation into the grounded mini pocket, followed by zero-distance hard drop or timed lock, scores 400/800 for zero/single rather than 100/200. The three-corner classifier is binary. Full zero/single/double, ordinary B2B and combo fixtures pass.

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I completes the bottom row and empties the board but scores 100 instead of 900. Tetris, no-clear lock, then Tetris perfect clear total 2000 instead of 5200. Normal/full-spin/B2B/combo scoring and pre-clear level multipliers pass; this isolated bonus omission is minor.

- **Minor: Landing frames charge pre-contact time to lock delay.** A legal O one row above the floor locks immediately during one unchanged 1000 ms callback, whereas ten 100 ms callbacks over the same duration leave it newly landed and unlocked (4 versus 0 welded cells); Chromium reproduces both. At ordinary frame size, callbacks of 990 then 16 ms followed by 484 ms lock at 1490 ms instead of 1500. tick adds the whole landing-frame delta to lockElapsed. Existing-ground 499/500 ms, successful resets, fifteen-reset cap and ledge safety pass.

- **Minor: A wholly hidden legal lock does not end the game.** From actual T spawn at field (3,-2), inject only stack (7,0), move right four times and hard-drop zero rows. T locks at (7,-2), wholly in hidden native rows 0–1; the incoming I at (3,-2) is independently open, but phase remains playing. lockPiece checks cells above the allocated array rather than the visible-field boundary.

- **Minor: The phone next preview is stretched non-uniformly.** At 390×844 the 164×388 next backing is displayed at 77.21875×260 CSS pixels. Its cell width/height ratio is 0.702647, so square blocks become visibly tall rectangles. The phone min-height:260px overrides proportional height. All five previews are painted within the backing; desktop next, held preview and board scale uniformly, and phone panels remain reachable.

## Runner and isolation of probes

```sh
python3 .audit/run-gpt56-terra-audit.py --offline
```

Omit `--offline` if locked dependencies are not cached. The default command
rebuilds/tests fresh copies, runs the [engine assertions](gpt56-terra-audit.mjs)
and [desktop/390×844 Chromium assertions](gpt56-terra-browser.cjs).
`--engine-only` explicitly skips browser findings; `--effort` selects one
run; `--artifacts-dir` retains screenshots/JSON **outside the checkout**.
Passing asserts defects as well as conforming paths, not bug freedom.
The runner uses installed Playwright/Chromium and downloads no new browser.

Terra low/high/xhigh/max import normal emitted engines. Medium owns its engine
and DOM in one module; the probe loads unchanged emitted JS in a VM with
no-op DOM/canvas/RAF surfaces and captures existing bindings. All five
unchanged emitted frame callbacks are driven in that VM. Max
passes frame deltas to its engine-owned gravity/lock timers; the other four
own the timers in main. Max’s multiline import is replaced only by the
same emitted module bindings, and its DOM/canvas gradients are no-op
surfaces. No source repair or simulation substitute is used. Real-browser checks separately verify assets, input, rendering and
layout. Low/high’s server port literal changes only in the temporary server;
medium’s `serve . -l 8321` changes only to the allocated audit port in the
temporary package script; xhigh and max honor `PORT` unchanged.
The shared Qwen runner was also rerun after the extension: its two own
workflows, engine assertions and four Chromium viewport passes still pass.

## Reproducible engine evidence

All 28 canonical coordinate sets pass, allowing one fixed O-origin translation
for Qwen’s 2×2 O. Every run has seven distinct colors. The independent SRS
oracle is the same as the recent audits. Every ordered CW/CCW transition of
the six rotating pieces is captured from real rotate calls; actual T/I
left/right wall and floor fixtures confirm behavioral effects. Collision
interception is only for ordered-candidate observation and is discarded;
normal engine probes always use the unchanged collision implementation.

The probes cover **100 actual engine bags** (ten seeds × ten bags), clearing
the board between real hard drops, plus hold restriction/queue consumption,
post-lock retrieval and orientation reset. Fresh first bags after actual
game over/restart are also checked: xhigh opens five types after eleven
seed-42 drops and real R; all other audited runs open seven. All seven obstructed ghost
landings are independently free with a collision one row below; hard-drop
points equal twice travel and the four welded cells match. Actual Chromium
draws independently match all seven expected obstructed ghost poses, including
Terra high’s DOM ghost cells.

Exact grounded **499/500 ms**, successful action resets, a fifteen-reset
sequence, natural landing/contact and blocked soft descent are exercised.
The **ledge-move mid-air lock probe** rests O on a single support for 490 ms,
moves it one cell off, crosses the old deadline airborne for 20 ms, then
requires a later floor lock. All seven Terra/Qwen runs pass ledge safety.
The documented timer and cap failures are asserted separately rather than inferred from source.
Max passes existing-ground boundary/reset/cap and 1 ms natural-contact
probes, but the separate landing-frame partition probe finds premature
locking: one 1000 ms callback welds four cells at first contact; ten 100 ms
callbacks leave zero. Its ordinary 990+16+484 ms path locks ten milliseconds
early. The whole landing delta is counted as grounded. Chromium repeats
the single/partitioned 1000 ms outcome at both widths.

Zero-travel scoring fixtures cover single/double/triple/Tetris; legal final
rotation full/mini zero/single through both hard and timed locks; a real
two-rotation full double; a no-rotation corner lock; manual soft movement
cancelling rotation credit; B2B continuity across a no-clear, ordinary-clear
break, consecutive Tetrises, mini B2B; level-two combo, nine-to-ten crossing;
single perfect clear, single PC after B2B and B2B Tetris PC. The benchmark
uses the established additive PC profile. Normal scores and pre-clear level
multipliers pass; recorded advanced-score omissions must still reproduce.

Actual first-row boundaries are checked at **levels 1,2,5,9,10,14,15,20**,
with zero ordinary-gravity points expected where implemented correctly.
The unchanged frame callbacks are driven at **60 and 144 Hz**, including
level-two 1480.001/1564 ms and level-ten/fifteen 600 ms fixtures. The
**800 ms normal / real Down / 1 ms** transition is tested in the engine and
again in Chromium. Qwen jumps sixteen rows/points; Terra’s discrete Down
moves one, except low’s coincident normal boundary adds a second row/point
(already included in its automatic-gravity scoring finding).

Hidden lock-outs use only injected stack cells and real spawn/move/rotation
paths. A deterministic bounded search finds a legal wholly hidden grounded
T while an incoming I is independently open; the exact path is replayed
and asserted. Only Qwen ends correctly in that fixture; max replays the same (7,0)
stack/four-right path as high and also continues play. Qwen medium also
has a separate legal partly visible lock with the next spawn open. Blocked
spawn and real R restart pass all seven. Terra low/medium’s exported engine
methods mutate after terminal state, while their real UI key guards pass;
that distinction is explicit, matching the GPT-5.6 Luna low engine finding.

The task’s [Fandom guideline link](https://tetris.fandom.com/wiki/Tetris_Guideline)
was unavailable (“Failed to fetch restricted URL”). The same benchmark
profile and the prior audits’ [SRS](https://tetris.wiki/Super_Rotation_System)
and [modern scoring](https://tetris.wiki/Scoring) references were checked.
PC scoring is the benchmark convention, not a claim that every licensed
Tetris version uses one identical scoring model.

## Chromium evidence

All required keys **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C**
were sent through real Chromium keyboard events at both sizes, with state
assertions. Real Space causes blocked-spawn game over, terminal UI keys are
inert, and **real R** resets board/hold/score/lines/level and hold availability.
Max also exercises all seven labeled command buttons and the New game
button with real clicks and state assertions at both widths. Each entry response gains only appended accessors; RAF is captured so the
unchanged frame callback can be driven at precise timestamps. No engine,
input, rendering or frame body is changed. Xhigh additionally receives a
seed-42 engine fixture, eleven real Space presses and real R; its next
opening is exactly J,Z,Z,T,L,I,J at both viewport sizes. All screenshots were visually
inspected outside the checkout. No application exception, console error or
failed required asset occurred; favicon noise is excluded as in earlier audits.

| Effort | Desktop board (CSS px) | Phone document width | Phone board | Supporting-state evidence |
|---|---|---:|---|---|
| low | 300×600 at x=490 | 413 | 202.8×405.59 at x=105 | Next x=320.8,width=80; clipped I drawings and false overlay at both sizes |
| medium | 304×604 at x=488 | 513 | 237.12×471.12 at x=130.44 | Next x=390.18,width=93.6; hold fits |
| high | 250×500 at x=515 | 390 | 260×520 at x=18 | Hold zero bounds; five colored letter next entries fit |
| xhigh | 350×700 at x=465 | 390 | 350×700 at x=20 | Panels reflow below board and are scroll-reachable; hold pixel count zero, next has only one visible piece |
| max | 318×636 at x=481 | 390 | 268×536 at x=11 | Hold x=19,width=144 below board; next x=303,width=77.22,height=260; all pieces painted but next cells stretch |

Geometry is asserted within 0.03 px horizontally; vertical positions may
vary with fonts. Low’s real preview fill rectangles start at **x=−11**,
width **22**. Xhigh’s first I slot is at backing **y=152**; later slots
are **1634/3116/4598/6080** in a 420 px backing. Hold has **zero painted
pixels**, while next has only **12 of 60 shaded drawing calls** visible.
These are actual canvas calls/pixels, not an inference from screenshots.
Xhigh’s mobile hold canvas uses object-fit containment; no extra distortion
deduction is made from the element’s CSS dimensions.
Max’s 164×388 next backing instead uses a 77.21875×260 phone CSS box,
with no object-fit containment: measured X/Y scale ratio **0.702647**.
The desktop next ratio and both hold ratios are approximately 1. Its
I fixture paints all 4 held and 20 next cells (5/21 fill calls including
backgrounds), with no off-backing rectangle. The distortion is a minor,
matching the prior non-uniform-preview calibration. The active overlay
is transparent (opacity 0); real blocked-spawn game over and R work.

## Supplied generation and isolation context (no score effect)

These facts were supplied by the parent/import record; session isolation
and usage were not recollected or re-accounted by this quality audit.

- **Low/medium/high:** no isolation findings.
- **Xhigh:** read two files of Codex’s built-in “Sites” skill under
  `~/.codex/plugins/cache`; these are harness documentation, not benchmark
  implementation references. Imported with `--allow-outside`, so the reads
  remain recorded. No contrary benchmark-reference evidence was found.
- **Max:** Sites skill reads and four `external-app` findings
  (`codex_apps.sites.*`), as supplied. It created a Site, committed under
  the user’s git identity and deployed privately without being asked; see
  the [external-actions timeline](gpt56-terra-max-external-actions.md).
  The quality score covers the delivered game only. `.openai/hosting.json`
  records its Site project ID and `dist` folder as packaging. No Sites,
  publishing or deployment tool was used during this audit.
- After low, `cleanup` removed `/tmp/tetris-server.log`. After max,
  `cleanup` removed `/tmp/tetris-site-f5977c1a.tar.gz`.
- Runs executed **one at a time**; `preflight` confirmed free ports before
  each. Workspaces were registered through T3’s project tool, with
  `new --no-register` used as supplied. None of these facts changes quality.

| Effort | T3 thread | Native session | Tested-agent tokens | Elapsed |
|---|---|---|---:|---|
| low | `mcp:908d4fde-6e52-4970-b7a8-1b2b24d75350` | `01a1732c-0a50-7732-bc03-659ba8a9b635` | 178,320 | 45.685s |
| medium | `mcp:4f95a388-1d17-4485-91e5-25979101c763` | `01a1732d-162d-7291-a6f8-8e8201d3d89a` | 396,017 | 2m 12.950s |
| high | `mcp:794afcd9-bdaf-4d97-96ad-91952e245a87` | `01a1732f-671a-7570-9e44-156ea2828c7b` | 954,304 | 4m 6.160s |
| xhigh | `mcp:4ed75a18-1352-41e3-9709-9e6d67120c72` | `01a17333-6c04-7651-939d-638c5b09108c` | 1,698,319 | 6m 28.758s |
| max | `mcp:9fe93e8d-58bb-45b2-b700-58f3f1cd0d14` | `01a17339-e207-7ec1-9113-9e48d308a0e6` | 3,504,778 | 13m 31.336s |

## Limits and validation

This is a focused conformance audit, not an exhaustive state-space proof,
long-duration playtest, physical-touch test, native OS key-repeat test,
high-DPI hardware test or another-browser certification. No such coverage
is claimed. T-spins cover legal representative full/mini pockets and a
full double; every possible spin/kick/PC arrangement remains unverified.
The supplied isolation facts were recorded, not reconstructed from provider
logs. Unknown overhead/model-call accounting remains unknown, not zero.

Final required checks after recording and regeneration:

- Fresh-copy family runner with `--offline`: **passed**, all builds,
  unchanged own workflows, every recorded engine outcome and desktop/phone
  browser assertion.
- `python3 scripts/benchmark.py render`: **passed**.
- `python3 scripts/benchmark.py verify`: **passed**.
- `node .audit/verify-ranking.mjs`: **passed**.
- `python3 -m unittest discover -s tests`: **passed**, 65 tests, OK.
- `git diff --check`: **passed**.

The original four Terra and two Qwen additions are preserved. The max
extension appends only `gpt-5.6-terra-max`; every previously recorded ranking
entry is unchanged as parsed data. The all-five Terra command and shared
Qwen command pass with every earlier assertion retained. All temporary
builds/artifacts/server groups and browsers were removed or closed. Parent owns the commit.
