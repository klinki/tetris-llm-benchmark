# Browser audit results

## GPT-6.1 Terra — six efforts, 2026-10-26

[Review and scores](gpt61-terra-review.md), [runner](run-gpt61-terra-audit.py),
[engine probes](gpt61-terra-audit.mjs), [browser assertions](gpt61-terra-browser.cjs).
Fresh disposable builds, own unchanged npm start commands and authored servers.
All six hard-code 8321; only the copied listen literal changes to honor PORT.
Free **41000–49999** ports; Chromium **156.0.8078.4**, Playwright **1.64.0**,
**1280×800 / 390×844** CSS viewports with the prior desktop user agent.

| Effort | Desktop board | Phone board | Phone document width | Preview/focus finding |
|---|---|---|---:|---|
| low | 300×600,x491 | 176×354,x107 | 390 | Three next; complete proportional previews |
| medium | 296×592,x492 | 188×376,x101 | 390 | Phone hold aspect0.7, next0.551515; desktop next0.916667 |
| high | 298×596,x491 | 192×384,x99 | 390 | Five square previews |
| xhigh | 233×466,x523.5 | 192×384,x99 | 390 | Five complete previews; subpixel aspect1.007 |
| max | 273×546,x503.5 | 208.390625×416.78125,x90.796875 | 390 | Desktop next aspect1.142857; phone proportional |
| ultra | 242×484,x813.453125 | 230×460,x28.5 | 390 | Three square previews; clicked Pause captures Space |

All six start, respond to real **Left/Right/Up/X/Z/Left Ctrl/Down/Space/C**,
and **R** resets a real blocked-spawn game over. Terminal UI keys are inert.
Low's own server bundles CommonJS correctly; it has no Beam-medium-style
startup failure. Main responses gain accessors only; RAF is captured to
run unchanged callbacks at exact timestamps. Medium's clock tests call the
actual act handler, preserving its main-owned reset policy.

Every engine finding repeats in served Chromium modules at both sizes:
low's mini points; low/medium/high's PC omissions; medium/xhigh's manual
spin credit; legal partial lock-outs in low/high; and medium's direct
hardDrop adding40 points after over while the UI guard works. Required
keys and public-action hidden/partial fixtures use real keyboard events.
All 28 states/48 candidate sequences, 100 actual bags and seven independently
checked actual ghost drawings pass in every run. O hold and I next fixtures
paint 16 complete cells in low/medium/ultra and 24 in high/xhigh/max, with no
off-backing rectangles. All canvases fit horizontally at both sizes.

The unchanged RAF repeats low/medium/high/xhigh's **1490 ms** premature
landing lock in the 990+16+484 ms fixture; max/ultra remain unlocked.
After800 normal ms, real Down plus1 ms yields xhigh **17 rows/17 points**,
others 1/1. At level 10 over600 ms, medium moves **9/8** rows at 60/144 Hz;
others 9/9. At level 15 over100.001 ms, medium 6/5, low/xhigh 6/6,
high/max/ultra 14/14. Real Up×15, wait 490, Right and 1 ms frames reproduce
max's exhausted-ledge floor contact at 6000 and lock at 6010, just 10 ms later.
No held replacement falls after 200 ms following an 800 ms outgoing phase.

Clicking Pause twice then Space in ultra leaves T(3,5), score 0, welded0,
focus **#pause**, and changes the overlay to **display:flex**. Medium/xhigh/
max hard-drop after the same clicks; max explicitly blurs mouse clicks.
The focus finding is a single correctness minor, as in Sol xhigh.

All 12 full-page screenshots were visually inspected outside the checkout
and deleted. Board horizontal geometry is pinned within .03 px; font-sensitive
vertical positions are recorded only. No application exception, unexpected
console error or failed required asset occurred; external Google Fonts and
favicon noise are excluded. T3 preview status/open was checked and its owned
incognito tab closed. The explicitly requested prior Playwright-library
workflow is used. No physical touch/HiDPI, native OS repeat or other-browser
claim. Every owned server/browser, temporary copy and evidence root was cleaned,
including exploratory failure paths. No prior score changed.

## Beam low/medium and MiMo default — 2026-10-26

Fresh disposable builds and each declared **npm start** workflow,
Chromium **156.0.8078.4**, **1280×800** and **390×844** CSS viewports.
Only Beam's copied hard-coded port literals change; MiMo uses PORT
unchanged. Free **41000–49999** ports only. See the
[Beam review](beam-efforts-review.md), [MiMo review](mimo-v26-flash-review.md)
and [shared runner](run-beam-mimo-audit.py). Old Beam remains **5.60**.

| Run | Desktop | Phone document width | Phone | Runtime |
|---|---|---:|---|---|
| Beam low | Bordered canvas 324×644 at x=436.203125; field 320×640 | 399 | Canvas x=−8.796875; field x=−6.796875; stats also clip | Starts; R clears state but leaves RAF stopped |
| Beam medium | Blank default canvas 300×150 at x=490 | 390 | Blank canvas 300×150 at x=45 | `exports is not defined`; empty HUD, no RAF |
| MiMo default | Canvas 480×620 at x=400; field 300×600 at x=410 | 435 | Canvas x=−45; field x=−35, losing 35 px | Starts; real R resets all state |

All six full-page screenshots were visually inspected outside the checkout,
then deleted. Horizontal geometry is pinned within .03 px; vertical font
positions are recorded. Beam lacks viewport metadata. As in earlier audits,
390 px means a CSS viewport with desktop user agent, not physical mobile.

Low's real Left/Right/Up/X/Z/Down/Space respond; **Left Ctrl/C do nothing**.
Down/Space award zero drop points. Actual blocked-spawn game over leaves
Right enabled. Consume the last callback, real R, advance to 5000 ms:
zero scheduled callbacks, active y remains zero. Draw records contain only
four active blocks and no ghost/hold/next. Real keys and unchanged RAF
repeat the engine's state/lock/gravity findings.

Medium throws at the first emitted CommonJS exports statement. All ten
keys including R leave the delivered HUD empty. Screenshots and startup
assertions run **before** diagnostics. Separate evaluation supplies
exports/require to unchanged emitted engine/main bodies to repeat source
findings, including six bad states, generic floor kick, basic scoring,
800 ms gravity-tick lock, 200 ms held-replacement fall and a legal hidden
lock continuing. This does not establish delivered browser gameplay.
Forcing held O/five next I changes neither diagnostic draw calls nor HUD;
those previews are absent even independently of the module-format failure.

MiMo's required real keys and R pass state assertions, blocked spawn and
terminal guards. After 800 ms normal time, real Down and the next 1 ms
unchanged RAF produce **17 rows/17 points**. All 28 states/48 ordered
candidate sequences, normal/full/mini/PC outcomes, cap/ledge/hidden/partial
and clock fixtures repeat in served modules. Main refresh checks agree
at 60/144 Hz: L2/1480.001 ms 1/1, L10/600 ms 9/9, L15/100.001 ms 6/6;
held replacement gets a fresh 1000 ms phase. Seven actual ghost drawings
match independent obstructed landings. O hold/five I next paint 24 complete
square cells inside the backing. With combo=1/B2B=true, text is issued at
COMBO y=615, x1 y=630, B2B y=660, x1.5 y=675 in a **620 px** backing:
advanced values disappear at both widths, independently of phone clipping.

No unexpected console errors or required-asset failures; medium's one
startup exception is the expected finding. Harmless favicon 404s excluded.
The requested prior-audit Playwright-library workflow is used; T3 preview
status/open was checked and its own incognito tab closed. No physical
touch/HiDPI, native OS repeat or other-browser certification. All copies,
evidence folders, owned server groups and browsers were cleaned.

## Claude Opus 5.5 efforts — 2026-10-26

Independent disposable-copy builds and **unmodified `npm start` with PORT**,
installed **Chromium 156.0.8078.4**, **1280×800** and **390×844**. All three
start and pass their own **11/12/16** deterministic cases. Exact fixtures,
scores, own-suite limits and supplied isolation facts are in the
[Opus effort review](opus55-efforts-review.md). The earlier medium
`opus-5.5` stays **9.05** and is not rescored.

| Effort | Desktop field | Phone document width | Phone field | Supporting-state evidence |
|---|---|---:|---|---|
| low | 300×600 at x=490 | 525 | 300×600 at x=45 | Combined canvas x=−135,width=660; hold/stats off left; NEXT label x=365 |
| high | 300×600 at x=490 inside 300×660 canvas | 495 | 300×600 at x=45 | Hold x=−94,width=110; next x=376,width=110 |
| xhigh | 300×600 at x=490 | 684 | 300×600 at x=192 | Field ends at 492, next x=527,width=124; hold fits at x=33 |

Every full-page screenshot was visually inspected outside the checkout.
Exact horizontal geometry is asserted within 0.03 px. All three fixed
cabinets clip at phone width: low/high clip supporting panels while xhigh
also clips the playfield. High previews scale uniformly; xhigh's hold cell
aspect is 1.000126 and next is 1. No preview distortion is scored.
Deterministic O hold/five-I queues paint four/twenty complete preview cells
inside high/xhigh's backing canvases; low's combined previews are visually
complete on desktop. Actual draws match all seven independent obstructed
ghost poses at both sizes.

Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** assert movement,
every rotation binding, soft movement/points, four hard-locked cells and
restricted hold. Real Space triggers blocked incoming spawn; terminal
movement/rotation/drop/hold are inert; **real R** fully resets. High/xhigh
show **none → flex → none** overlays; low uses canvas text. There are no
application exceptions, console errors or failed required assets; harmless
favicon 404s are excluded.

Main responses gain accessors only; captured RAF drives the **unchanged**
frame body. After 800 ms normal time, real Down plus 1 ms produces
**16/16/1 rows and points** for low/high/xhigh. All three weld at absolute
**1490 ms** in the 990+16+484 ms landing fixture, ten milliseconds early.
After fifteen alternating real horizontal moves at 10 ms intervals,
high/xhigh lock at **151 ms**; low remains unlocked. Low's separate real
Up ×15 / wait490 / Right ledge fixture contacts the floor at **6000 ms**
after leaving the ledge and welds at **6009 ms**, retaining old contact time.

All actual frame callbacks agree at **60/144 Hz**: level-two 1480.001 ms
1/1 row, level-ten 600 ms 9/9, level-fifteen 100 ms 14/14. A held replacement
waits a fresh **1000 ms**. The full canonical engine suite also repeats
inside Chromium against served modules, asserting missing PC and legal
hidden/partial lock paths separately from the real-key integration checks.

Reproduce with the [runner](run-opus55-efforts-audit.py), using `--offline`
when dependencies are cached. It uses the [engine probes](opus55-efforts-audit.mjs)
and [Chromium script](opus55-efforts-browser.cjs). All servers run on free
41000–49999 ports, with no source/port substitutions, and browser/server
process groups and copies are cleaned. No run folder is modified. Phone
coverage is CSS viewport/keyboard behavior, not physical touch or another browser.

## GPT-5.6 Terra and Qwen3.8 Max — 2026-10-25

Independent fresh-copy builds and intended start servers, installed Chromium
**156.0.8078.4**, **1280×800** and **390×844**. Exact findings, score
rationale and supplied generation/isolation context are in the
[Terra review](gpt56-terra-review.md) and [Qwen Max review](qwen38-max-review.md).
All five Terra efforts are included; unfinished Qwen xhigh is excluded.

| Run | Desktop board (CSS px) | Phone document width | Phone board | Confirmed presentation evidence |
|---|---|---:|---|---|
| Terra low | 300×600 at x=490 | 413 | 202.8×405.59 at x=105 | Live game-over overlay; I previews clip at backing x=−11; phone next x=320.8,width=80 |
| Terra medium | 304×604 at x=488 | 513 | 237.12×471.12 at x=130.44 | Phone next x=390.18,width=93.6, outside viewport |
| Terra high | 250×500 at x=515 | 390 | 260×520 at x=18 | Phone hold has zero bounds; five next piece letters remain visible |
| Terra xhigh | 350×700 at x=465 | 390 | 350×700 at x=20 | Hold has zero painted pixels; only first of five next previews is on-canvas; panels vertically reachable |
| Terra max | 318×636 at x=481 | 390 | 268×536 at x=11 | All previews painted; phone next 77.21875×260 from 164×388 backing, cell aspect 0.702647; hold reflows below board |
| Qwen Max low | 304×604 at x=488 | 503 | 304×604 at x=43 | Phone hold x=−104,width=120; next x=372,width=120 |
| Qwen Max medium | 302×602 at x=489 | 516 | 302×602 at x=44 | Phone hold x=−106,width=130; next x=366,width=130 |

All seven start. Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C**
work at both sizes with engine assertions. Real Space triggers blocked-spawn
game over, terminal UI keys are inert, and **real R** resets all gameplay
state. Terra xhigh also repeats eleven seed-42 real Space drops to game over, then
real R: its opening J,Z,Z,T,L,I,J contains only five types.
Terra max also passes real clicks on all seven command buttons and New game
at each width; these are mouse-driven button checks, not physical touch.
There are **no application exceptions, console errors or failed
required assets**. Missing favicons are excluded. Every full-page screenshot
was visually inspected outside the checkout; none is committed.

Entry responses gain appended accessors only. Captured RAF runs the unchanged
callback at precise timestamps. Level-two 1480.001 ms gives Terra low
**1/2 rows at 60/144 Hz**; 1564 ms gives medium **2/1**. Level-ten 600 ms
gives high/xhigh **9/8**; Terra max and Qwen give **9/9**. Engine and browser agree.
After 800 ms normal time, real Down plus 1 ms gives both Qwen runs
**16 rows/points**, Terra medium/high/xhigh/max **1**, and Terra low **2**
(a coincident normal boundary plus its discrete Down). The bounded Terra
low transition receives no separate soft-jump deduction.
Max’s O one row above the floor welds four cells during a single unchanged
1000 ms callback; ten 100 ms callbacks over the same duration weld zero.
This repeats its engine landing-contact timing defect at both widths.

Actual drawing independently matches **all seven obstructed ghost poses**
in every run. Deterministic I hold/five-I queues distinguish clipping from
missing content: Terra low's first fill starts at **x=−11,width=22**;
xhigh's hold draws at **y=152** below its 112 px backing, and next draws
at **152/1634/3116/4598/6080** inside a 420 px backing. Only **12/60** shaded
next calls are visible. Qwen previews paint complete backing contents;
their phone defect is cabinet clipping. Geometry assertions allow 0.03 px;
font-dependent vertical positions are not treated as defects.
Max has complete hold/five-next drawing (5/21 fill calls including
backgrounds), but phone `min-height:260px` stretches the next backing
non-uniformly. Its measured cell width/height ratio is **0.702647**; desktop
next, both hold views and the board scale uniformly. Phone document width
is 390 px and its 931 px height keeps hold/legend scroll-reachable; desktop
height is 1087 px. Active overlay opacity is 0 and ordinary flows have no
application errors or failed required assets.

Reproduce with the [Terra runner](run-gpt56-terra-audit.py) and
[Qwen runner](run-qwen38-max-audit.py), both with `--offline` supported and
browsers enabled by default. The shared [Chromium utility](gpt56-terra-browser.cjs)
and [Qwen entry](qwen38-max-browser.cjs) assert every recorded presentation
finding. All server ports are free 41000–49999 ports; temporary port literals
only are adapted, and browser/server groups/copies are cleaned. The existing
Sol full runner was also rerun unchanged during the original Terra/Qwen
audit for calibration and passed.

Original audit date: 2026-08-10; Luna PI added 2026-08-29;
five T3 Code/OpenCode imports added 2026-10-20.

Opus 5.5 and Muse Spark 1.3 (medium) added 2026-10-23.

Browser: Chromium 140.0.7339.16 (Playwright build 1237)

Viewports: 1280×800 and 390×844

Each isolated build was served using its declared start-server behavior. Luna OMP must be served by its included `scripts/server.mjs`, which maps `/style.css` to `src/style.css`; serving only generated files is not an equivalent run.

## Results

| Implementation | Desktop | 390 px horizontal overflow | Application console errors | Notable evidence |
|---|---|---:|---|---|
| DeepSeek OMP/PI | Clear board, hold, stats, next queue, ghost, and controls | **Yes:** 501 px document width | None | Side panels clip outside the 390 px viewport |
| Luna Codex | Clear three-column layout | No: 390 px document width | None | `#board-message` has `hidden=true` but computed `display:flex` while status is `Playing` |
| Luna OMP | Clear, polished three-column layout | No: 390 px document width | None | Intended server loaded the stylesheet and all application assets correctly |
| Luna PI | Clear board, hold, five-piece queue, stats, ghost, and controls | No: 390 px document width | None | Required keyboard sequence worked; narrow layout reflows the sidebar below the board |
| Sol Codex | Clear, high-contrast layout | No: 390 px document width | None | Narrow layout exposes large touch controls and preserves supporting state |
| Sol OMP | Clear board and supporting panels | No: 390 px document width | None | Narrow layout exposes touch controls and keeps the board prominent |

Four implementations requested a nonexistent favicon and received a harmless 404. Those requests were excluded from application-error counts and scoring, matching the methodology in `RANKING.md`.

## October imports

The additional pass used installed Chromium 156.0.8078.4 at the same two
viewport sizes, fresh isolated builds, and each project's supplied server
behavior. Exact engine and browser evidence is in
[`october-review.md`](october-review.md).

| Implementation | Desktop | 390 px document width | Application load/runtime | Notable evidence |
|---|---|---:|---|---|
| Beam | Basic readable panels and a small board | 467 | Loads; no page exceptions | Hold is clipped at x≈−77; visible stray `EOF` text |
| Cat-jam | Clear board, ghost, stats, hold and queue | 538 | Loads; no page exceptions | Supporting panels extend past the right edge |
| Gemini-4 | Polished board, score, controls and previews | 570 | Loads; no page exceptions | Hold x=−150, next x=415; central board remains visible |
| Nemotron | Static board/panels only | 412 | Fails: `/dist/game` and `/dist/render` return 404 | No active game, no working keys; score remains zero |
| Space-bunny | Polished single canvas with all state | 390 | Loads; no page exceptions | Fits both widths, but ghost cells are incorrectly flattened |

Missing favicon responses were again excluded. Nemotron's two required
JavaScript module 404s are application failures. Required keys were sent to
every page, but only the four successfully loaded games responded. Nemotron's
engine-only test/probe results must not be described as browser conformance.

## October 23 additions

Same 1280×800 and 390×844 viewports, installed Chromium 156.0.8078.4,
fresh isolated builds, and the common keyboard/asset/runtime probe.

| Implementation | Desktop playfield | 390 px document width | Phone playfield | Application errors |
|---|---|---:|---|---|
| Opus 5.5 | 300×600, crisp board/hold/queue/stats/legend | 760 | 300×600 at x=230; much of board clipped | No application asset failures or page exceptions |
| Muse Spark 1.3 (medium) | 300×600, polished game and supporting panels | 397 | 0×0 CSS pixels: center grid column collapses | No application asset failures or page exceptions |

The full keyboard sequence responded on desktop for both. Active-play
overlays remained hidden. Missing favicon requests were excluded; screenshots
were inspected at both sizes. Details and exact session mappings are in
[`oct23-review.md`](oct23-review.md).

## Claude Haiku 5.5 (high)

Audited 2026-10-24 in a temporary build using Playwright CLI and Chromium
156.0.8078.4, at the same 1280×800 and 390×844 viewports. T3's collaborative
browser independently reproduced the phone geometry.

| Implementation | Desktop playfield | 390 px document width | Phone playfield | Application errors |
|---|---|---:|---|---|
| Claude Haiku 5.5 (high) | 300×600 content, 302×602 border box at x=489 | 758 | 302×602 border box at x=228, clipped; next x=554 | No application asset failures, console errors or page exceptions |

All required movement, rotation, drop and hold keys responded; active overlays
remained hidden. During a 120 ms Down hold, the observed piece moved 12 rows
and earned 12 points, supporting the deterministic engine probe's soft-drop
timer finding. The initial missing favicon was excluded as in earlier audits.
Screenshots at both sizes were inspected and kept outside the repository.
See [`haiku-review.md`](haiku-review.md) and [`haiku-browser.cjs`](haiku-browser.cjs).

## Claude Haiku 5.5 (xhigh and max)

Audited independently on 2026-10-24 with the same temporary-copy method,
Chromium **156.0.8078.4**, 1280×800 desktop and 390×844 phone viewports.
High's original engine/browser assertions were rerun and still pass.

| Implementation | Desktop playfield | 390 px document width | Phone playfield and supporting state | Application errors |
|---|---|---:|---|---|
| Haiku 5.5 (xhigh) | 304×604 border box at x=488; clear board/ghost/panels/legend | 752 | Board at x=224, ending x=528; next x=552, clipped | None |
| Haiku 5.5 (max) | 300×600 canvas at x=360; clear hierarchy, canvas labels and high-DPI sizing | 596 | Board visible at x=18; sidebar x=340; hold/next canvases x=424, off-screen | None |

Each run passed the full required movement/rotation/drop/hold sequence.
Temporary forwarding wrappers observe real delivered input handlers and assert
left/right displacement, all four rotation bindings, drop points/spawning and
hold restriction. Xhigh has no DOM overlay (game over is drawn into canvas);
max's active-play overlay stays hidden with computed `display:none`.
Restart is checked by engine probes and the R binding by source inspection,
consistent with the earlier cohorts. Missing favicons remain excluded.

T3's collaborative browser independently confirmed both phone document widths
and canvas X coordinates. All six screenshots for high/xhigh/max were visually
inspected outside the repository. Font-dependent Y positions vary slightly
between browser surfaces and are not asserted. Only Chromium CSS viewports
were tested; no physical touch device or alternate engine was exercised.

The initial temporary servers used ports 41801–41803. The current shared
runner audits all five Haiku efforts with browsers enabled by default and
selects only free ports 41000–49999. Low/medium/max's port literals change
only in disposable server copies. The original high/xhigh/max engine and
browser assertions still pass. Manual snippet effort queries accept
`?audit=low`, `medium`, `high`, `xhigh` and `max`.

## Claude Haiku 5.5 (low and medium)

Audited **2026-10-24 (Europe/Rome)** using Playwright CLI / installed
**Chromium 156.0.8078.4**, **1280×800** and **390×844**. Builds, own tests and
supplied `npm start` behavior ran in random disposable copies. T3 preview
status was inspected; this pass follows the requested prior Haiku CLI
workflow. Only each temporary server's port literal was changed. Named
browsers, process groups and copies were cleaned; screenshots/JSON stayed
outside the checkout and were removed after visual inspection.

| Run | Desktop playfield | Phone document width | Phone playfield | Supporting state | Application errors |
|---|---|---:|---|---|---|
| low | 300×600 at (490,100), inside a 640×640 cabinet | 390 | 182.81×365.63 at (103.59,239.19), inside a 390×390 cabinet | Full hold, five previews and stats fit | None |
| medium | 304×604 border box at (488,98) | 521 | 304×604 border box at (43,120) | Hold x=−131,width=124; next x=371,width=124; legend/scores clipped | None in ordinary flow; expected hidden-lock TypeError in a separate real-key fixture |

All four screenshots were visually inspected. Low's proportional combined
canvas has no visible keyboard legend. Medium has a complete legend and
centered previews but no narrow reflow; its board fits while both rails clip.
Both have ghosts, distinct piece colors, five next pieces, dimmed unavailable
hold and readable stats. Neither has touch controls, canvas labels or
high-DPI rendering. Medium's active overlay is `none`; blocked-spawn game
over shows `flex`, and real R restores `none`. Low draws game over in canvas.

At **both sizes**, real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C**
assert horizontal displacement, all four rotation bindings, two soft rows /
two points in 100 ms explicit simulation, four hard-locked cells and hold
restriction. Animation scheduling is driven explicitly while retaining the
unchanged frame callback, handlers and renderer. Real Space triggers a
blocked next spawn and **real R** restores the empty board, hold, score and
hold availability. Low's R creates a new Game; the probe observes that new
instance through forwarded updates. The callback moves O by **1/9/14 rows**
at levels **1/10/15**, over **1100/600/100 ms** respectively, equally at
**60 and 144 Hz**. This is synthetic scheduling, not a physical-monitor test.

Both real Down handlers reproduce **800 ms normal + 1 ms soft → 16 rows /
16 points**. Medium's separate ceiling fixture uses blockers **(0,2),(2,3)**
with its actual T spawn, then real **Left, Left, Up, Up, Z, Left, Space**.
The legal T reaches **rotation 1,x=−1,y=−1**; Space emits exactly
`Cannot set properties of undefined (setting '0')` from the `board[-1]`
write. **R is inert**, because gameOver remains false. This expected error
is saved separately and asserted; the ordinary-flow error arrays stay empty.
It shares the hidden-lock-out finding's one minor deduction.

No failed required application assets, other page exceptions or application
console errors occurred. Missing favicons remain excluded. No physical touch,
native OS repeat cadence, other browser engine or exhaustive state-space
coverage was verified. Exact findings, scores and supplied isolation facts
are in [`haiku-review.md`](haiku-review.md). Reproduce all five with
`python3 .audit/run-haiku-audit.py --offline`; the
[runner](run-haiku-audit.py) cleans disposable resources on success/failure.

## Claude Sonnet 5.5 (low, medium, high and xhigh)

Audited **2026-10-24**, Playwright CLI with Chromium **156.0.8078.4**,
1280×800 desktop and 390×844 phone CSS viewports. All four builds and declared
test workflows ran in disposable copies. The supplied `npm start` servers
used only free ports 41000–49999; medium's hard-coded port was substituted
only in its temporary server copy, preserving its static-file behavior.

| Implementation | Desktop canvas / playfield | Phone document width | Phone playfield and supporting state | Application errors |
|---|---|---:|---|---|
| Sonnet 5.5 (low) | 664×604 border box / 300×600 at x=490 | 527 | Board fits at x=45; canvas x=−137, hold/stats label x=−120, next x=360; sidebars clipped | None |
| Sonnet 5.5 (medium) | 580×600 / 300×600 at x=490 | 485 | Board fits at x=45; canvas x=−95, hold label x=−75, next/stats x=365; sidebars clipped | None |
| Sonnet 5.5 (high) | 602×602 border box / 300×600 at x=490 | 496 | Board fits at x=45; canvas x=−106, hold/stats label x=−85, next x=365; sidebars clipped | None |
| Sonnet 5.5 (xhigh) | 660×628.19 / 298.19×596.39 at x≈319.17 | 390 | Canvas fits at x=16, width 358; board 161.75×323.49 at x≈114.13; supporting state and reflowed legend fit | None |

These games combine board and panels in one canvas. Board measurements use
the renderer's reviewed drawing offsets, canvas CSS content scale and border
widths. All eight screenshots were visually inspected outside the repository.
Low/medium have no visible keyboard legend; high has a complete inline legend;
xhigh has a separate reflowing legend and labeled canvas. None has touch
controls. The central playfield remains fully visible in all four phone views;
the first three findings concern supporting state rather than board clipping.

Real keys **Left, Right, Up, X, Z, Left Control, Down (120 ms), Space, C**
all responded. Temporary forwarding wrappers observed horizontal displacement,
rotation directions `[1,1,-1,-1]`, soft movement/points, four hard-locked cells
and hold restriction without changing command behavior. A deterministic
blocked-spawn fixture followed by **real R** successfully restarted each game.
Canvas overlays matched active/game-over state. No application asset failure,
page exception or application console error occurred; missing favicon requests
were excluded consistently with earlier audits.

The same browser pass independently reproduces the engine timer finding:
freeze only animation-driven engine updates, run fifty 16 ms normal updates,
send real ArrowDown, then advance 1 ms. O moves **16 rows**, score becomes
**16**, with Y transitions **2→18**, **1→17**, **1→17**, **19→35** for
low/medium/high/xhigh. Each step is below the delivered 100 ms frame cap.
This has one timing cause and one minor deduction per run.

```sh
python3 .audit/run-sonnet-audit.py --offline
```

Browser assertions run by default, including the exact measured layouts and
timer/restart outcomes. Named browser sessions and server process groups are
closed and copies removed on success/failure. Use `?audit=low`, `medium`,
`high` or `xhigh` with [`sonnet-browser.cjs`](sonnet-browser.cjs) for a manual
CLI pass against a built temporary copy. Full fixtures, score rationale,
test gaps and supplied isolation evidence are in
[`sonnet-review.md`](sonnet-review.md).

## Gemini 4 Argon (high) — October 24

Chromium **156.0.8078.4**, Playwright CLI, using the unmodified supplied
`npm start` server in a disposable build with `PORT` in 41000–49999.
Both screenshots were visually inspected outside the checkout and discarded.

| Viewport | Document width | Board content / frame | Hold / next panel X | Hold / next canvas X | Application errors |
|---|---:|---|---|---|---|
| 1280×800 | 1280 | 300×600 at x=480 / 304×604 at x=478 | 292 / 798 | 317 / 833 | None |
| 390×844 | 543 | 300×600 at x=35 / 304×604 at x=33 | −153 / 353 | −128 / 388 | None |

The full board fits on the phone, but hold/stats and next/controls are clipped
by the fixed side columns. Desktop presentation has readable state, distinct
colors, ghost, dimmed used hold, five previews, full legend, a labeled focusable
canvas and a restart button. There are no touch controls or high-DPI scaling.
Active overlay is `display:none; aria-hidden=true`; a blocked spawn displays
it as `flex; aria-hidden=false`; real R resets state and hides it again.

Real **Left, Right, Up, X, Z, Left Control, Down (120 ms), Space, C** all
responded with asserted before/after displacement, `[1,1,-1,-1]` rotation
directions, soft-drop points, four locked cells and hold restriction. For
determinism, animation-driven engine time was frozen while DOM input/rendering
remained live. A single Down moves/scores once; three explicit repeated
keydowns move/score three more times. Input relies on native keyboard repeat;
Playwright holding Down does not synthesize OS repeats. After 800 ms of
normal time, Down plus 1 ms moves O **0→1** and awards **1**, confirming no
normal-to-soft accumulator jump. Actual OS repeat cadence was not measured.
No page exception, application console error or failed application asset
occurred; favicon 404s are excluded consistently with earlier audits.

```sh
python3 .audit/run-gemini-high-audit.py --offline
```

The runner executes the own build/tests, engine probes and browser assertions
by default, including exact phone dimensions, transition and real R results.
It closes named browsers and server groups and removes temporary copies on
completion/failure. Full fixtures, scores, limitations and supplied generation
facts are in [`gemini-high-review.md`](gemini-high-review.md).

## Muse Spark 1.3 contributor — October 24

Audited all five `muse-spark-1.3-contributor-{minimal,low,medium,high,xhigh}`
runs with Playwright CLI / Chromium **156.0.8078.4** at **1280×800** and
**390×844**. Contributor medium is **from scratch**, distinct from the
reference-assisted `muse-spark-1.3-medium` in the October 23 table.
Fresh temporary builds used each supplied server; only hard-coded port
constants were changed in copies to use free ports 41000–49999.

| Run ID | Desktop board content | Phone document width | Phone board content / canvas frame | Phone hold / next canvas X | Application errors |
|---|---|---:|---|---|---|
| `muse-spark-1.3-contributor-minimal` | 300×600 at x=490 | 501 | 300×600 at x=45 / 304×604 at x=43 | −102 / 372 | None |
| `muse-spark-1.3-contributor-low` | 280×560 at x=350 | 505 | 280×560 at x=−95 / combined 620×600 canvas at x=−115 | Combined sidebar x=209 | None |
| `muse-spark-1.3-contributor-medium` | 300×600 at x≈481.02 | 537 | 300×600 at x=45 | −115 / ≈372.69 | None |
| `muse-spark-1.3-contributor-high` | 300×600 at x=490 | 502 | 300×600 at x=45 / 302×602 at x=44 | −99 / 375 | None |
| `muse-spark-1.3-contributor-xhigh` | 300×600 at x=490 | 515 | 300×600 at x=45 / 304×604 at x=43 | −113 / 363 | None |

Low clips 95 px of the playfield's left side while preserving its sidebar;
all four others preserve the board and clip supporting state. In low, the
canvas legend begins at local x=184, baselines y=544/560/576, inside its
280×560 board rectangle (20,20)–(300,580), and crosses the LINES statistic.
Medium-from-scratch draws the last I preview cell at x=74,width=20 on an
88 px canvas, clipping 6 px in both hold and next; a cyan right-edge pixel
and unchanged forwarded draw calls confirm it. Desktop and phone screenshots
and two focused drawing screenshots were visually inspected and discarded.

Actual keys **Left, Right, Up, X, Z, Left Control, Down, Space, C** have
asserted state changes, rotation directions `[1,1,−1,−1]`, soft points, four
locked cells and hold restriction. Real Space triggers a blocked next spawn;
**real R** restores empty board/hold/score and available hold. Xhigh's DOM
overlay correctly changes `none → flex → none`; the other game-over views
are drawn in canvas or status. No page exceptions, application console errors
or failed application assets occurred. Missing favicons remain excluded.

Simulation is frozen for deterministic browser fixtures while actual input
listeners/rendering stay installed; the held-Down flow drives 120 ms engine
time explicitly. After fifty normal 16 ms steps, real Down plus 1 ms yields:
minimal **1 row/point**, low **20**, medium-from-scratch **16**, high **17
rows/16 points**, xhigh **20**. Minimal instead has the engine's per-frame
soft-drop defect: equal 16 ms totals with one versus sixteen updates produce
one versus sixteen rows/points. High's extra initial row is also isolated:
from O y=5 with zero accumulated time, Down makes y=6 with score still 0.

```sh
python3 .audit/run-muse-audit.py --offline
```

The default runner executes all own builds/tests, engine probes and browsers,
asserting exact recorded defects and conforming outcomes. It closes named
browsers/server groups and removes temporary copies. The [full Muse record](muse-review.md)
has scores, all fixtures, own-test limits and supplied isolation context.
These are Chromium viewport/keyboard checks; physical touch, native OS repeat
cadence, other browsers and exhaustive state-space behavior are unverified.

## GLM-5.3-Flash additions — October 24

Independent `glm-5.3-flash-free-{low,high,max}` audits used Playwright skill /
CLI, Chromium **156.0.8078.4**, supplied servers in disposable builds and
**1280×800** / **390×844** viewports. All application module graphs start.
T3 status/open were checked, and an independent incognito T3 tab confirmed
high's phone geometry and hidden active overlay. All audit browsers and
servers were stopped. Six viewport screenshots plus low's detail screenshot
were visually inspected outside the repository and discarded.

| Run | Desktop board content | Phone document width | Phone board content | Supporting state | Application errors |
|---|---|---:|---|---|---|
| low | 240×480 at x=460 | 390 | 240×480 at x=15 | Fits; hold/next drawing overlaps and I clips | None |
| high | 300×600 at x=490 | 464 | 300×600 at x=45 | Hold canvas x=−74; next x=360,width=104 | None |
| max | 320×640 at x=353 | 390 | ≈202.43×404.87 at x≈13.45 | Complete canvas fits | None |

Low's combined canvas is 360×480; high's board frame is 302×602; max's
598×664 canvas becomes ≈378.30×420.05 at x≈5.86 on the phone. Measurements
distinguish board content from border/combined canvas. Font/Y differences
are not invariants. High clips supporting state while keeping the full board.
Low draws held I cell x=310–327 over next I cell x=301–318 at y=50, and its
final next-I cell x=358,width=17 loses 15 px at the canvas edge. Forwarded
unchanged draw calls and a detail screenshot confirm both.

Real keys **Left, Right, Up, X, Z, Left Control, Down, Space, C** assert exact
horizontal changes, all rotation bindings, soft behavior, four locked cells
and hold restriction. The delivered frame callback is retained and scheduling
driven explicitly so real handlers/drawing stay installed. Down is held for
120 ms; explicit engine observation advances 100 ms in high/max and one fixed
tick in low. Low moves without soft points; high/max move and score two/seven
rows. Fresh normal-to-soft probes reproduce high's **16 rows / 16 points**
after 800 ms normal + 1 ms soft; max moves/scores **zero** after 250+1 ms.

Low's actual frame callback receives 120 evenly spaced frames across 1000 ms:
**zero engine ticks**, no fall and no lock. Sixty 17 ms frames then cause
**60 ticks**. This independently reproduces its discarded frame remainder.
Real Space exercises blocked next spawn; low relocates it above the stack
and requires one extra Space for game over. **Real R** restores all three
to empty board/hold/score and available hold. High's overlay follows
`none → flex → none`. No page exceptions, application console errors or
failed application assets occurred; missing favicons remain excluded.

```sh
python3 .audit/run-glm-audit.py --offline
```

The [GLM record](glm-review.md) and [browser snippet](glm-browser.cjs) give
exact reproducible fixtures. The runner rebuilds all three, tests/probes,
asserts browser findings, then cleans copies/processes. It also declares
max's passing own-test seed and separately asserts its failing seed, without
changing tests. Physical touch, OS repeat, a physical high-refresh monitor,
other browsers and exhaustive gameplay were not verified.

## Reproducible DOM probes

Horizontal overflow was measured after setting the viewport to 390×844:

```js
JSON.stringify({
  width: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
});
```

The Luna Codex overlay result was measured immediately after a fresh navigation:

```js
const message = document.querySelector("#board-message");
JSON.stringify({
  hidden: message.hidden,
  display: getComputedStyle(message).display,
  status: document.querySelector("#status").textContent,
});
```

Observed result:

```json
{"hidden":true,"display":"flex","status":"Playing"}
```

## Interaction coverage

The audit exercised the required keyboard inputs: horizontal movement, clockwise rotation through both Up and X, counter-clockwise rotation through Z and Left Control, soft drop, hard drop, and hold. Earlier cohorts additionally confirmed the game-over restart binding by source review because reaching top-out through UI play would make the comparison timing-dependent. The Sonnet, Gemini high and Muse contributor passes use deterministic blocked-spawn fixtures to exercise real R restart.

## DeepSeek V4.1 Flash (low, high, max)

Audited **2026-10-24**, Playwright skill/CLI with installed
**Chromium 156.0.8078.4**, **1280×800** and **390×844**. All builds, own
suites and supplied `npm start` servers ran in random disposable copies.
Every server honored `PORT` on a free port in **41000–49999**; no server or
application code changed. Named browsers/server groups/copies were cleaned.
T3 preview status was inspected; the CLI follows the requested prior audit
workflow without using a saved user login profile.

| Run ID | Desktop board | Phone document width | Phone board | Supporting state | Application errors |
|---|---|---:|---|---|---|
| `deepseek-v4.1-flash-low` | 291.56×583.13 at x=358.16 | 390 | 159.38×318.75 at x=40.94 | Full 340 px combined cabinet fits; complete legend below it | None |
| `deepseek-v4.1-flash-high` | 300×660 canvas at x=490 | 390 | 265.19×581 canvas at x=62.41 | Hold y=708; next y=865, fully reachable by scrolling | None |
| `deepseek-v4.1-flash-max` | 286×572 at x=487 | 390 | 174×348 at x=103 | Hold x=21 and next x=301; complete rails/legend fit | None |

Low draws the board within a proportional 640×700 combined canvas. High
renders 22 rows including two shaded buffer rows; measurements include its
border. Max scales its 300×600 board. All canvases fit horizontally; the
browser snippet asserts board X/width/height with 0.02 px tolerance. High's
phone document is 1186 px tall and its next queue scrolls completely into
view. Low's desktop legend is below the initial 800 px viewport and remains
scrollable. Vertical reflow is not recorded as horizontal clipping.

Both viewports exercise real **Left, Right, Up, X, Z, Left Ctrl, Down,
Space, C**. Forwarding wrappers assert side displacement, rotation arguments
`[1,1,−1,−1]`, soft movement/points, four hard-locked cells and restricted hold.
Animation-only simulation is frozen while real handlers/drawing remain live;
100 ms of soft simulation is driven explicitly. Independently, fifty 16 ms
normal updates / real Down / 1 ms move an O **sixteen rows and score sixteen
points in every run**, reproducing each recorded timing defect. The
unchanged actual frame callback advances equally at **60/144 Hz** over
1100 ms. Real Space causes blocked-spawn game over and **real R** resets
score/hold/board/availability. High/max overlays change **none → flex → none**;
low renders game-over in canvas.

All six viewport screenshots and high's scrolled phone next panel were
visually inspected outside the checkout, then removed. No page exceptions,
application console errors or failed assets occurred. Low's missing favicon
404 is excluded consistently with prior cohorts. There are no touch
controls; physical-device input, native repeat cadence and other browser
engines were not tested. Findings and exact engine fixtures are in
[`deepseek-v41-review.md`](deepseek-v41-review.md); reproduction is
`python3 .audit/run-deepseek-v41-audit.py --offline` using
[`deepseek-v41-browser.cjs`](deepseek-v41-browser.cjs).

## GPT-6 Luna (five efforts)

Audited **2026-10-24**, Playwright CLI / installed **Chromium 156.0.8078.4**,
**1280×800** and **390×844**, in random temporary copies. Four usable builds
use their supplied `npm start` behavior (only low's temporary port literal
changes). Medium fails compilation and its own server; a separately labeled
static diagnostic serves only the unchanged HTML/CSS, leaving the required
`/dist/main.js` missing. It is not a browser gameplay pass.

| Run | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 300×600 at x=491 | 390 | 300×600 at x=77 | Hold display removed; first four next previews erased at both sizes | None |
| medium | Static 300×600 at x=491 | 390 | Static 300×600 at x=79 | Right/next rail removed; no working start button or keys | Required game module 404; no playable build |
| high | 300×600 at x=490 | 390 | 300×600 at x=45 | Next begins near y=1078; scrolling reaches it fully | None |
| xhigh | 300×600 at x=491 | 390 | 249×498 at x=13 | Hold fits; next ancestor display:none removes all five previews; touch buttons visible | None |
| max | 300×600 at x=491 | 390 | 298×598 at x=46 | All panels fit vertically; queue backings shrink after drawing, squashing earlier previews | None |

Every required key and **real R** after blocked spawn pass in the four
playable runs at both sizes. Active overlays are correctly transparent or
hidden. Medium's static score remains zero through clicking Start and the
same key sequence. Max independently reproduces **800 ms normal / real
Down / 1 ms → 18 rows/18 points**. High's unchanged callback advances O
**12 rows at 60 Hz / 10 at 144 Hz**, over equal 600 ms at level 15.

Low's forwarded canvas calls make **six full next clears** and leave only
four cells/twelve shaded fills after the last, displaying the fifth queued
piece. Max's five identical phone I previews have native widths
**310/155/103/77/61** but final CSS widths ≈**61.2** each; actual painted
pixel widths become **13.03/26.46/39.81/40.54/35.12 px**, confirming distortion.
All ten screenshots were visually inspected outside the checkout. Missing
favicons are excluded; there are no other application exceptions, console
errors or failed required assets in the playable runs. No physical touch or
other browser engine was verified.

Exact fixtures, limitations, supplied isolation facts and score rationale:
[`gpt6-luna-review.md`](gpt6-luna-review.md). Reproduce all build/test/engine
and browser assertions with `python3 .audit/run-gpt6-luna-audit.py --offline`;
the [runner](run-gpt6-luna-audit.py) asserts medium's failure and xhigh's
broken own bag test without fixing either delivery.

## GPT-5.6 Luna (five efforts)

Audited **2026-10-25**, Playwright skill/CLI, installed
**Chromium 156.0.8078.4**, **1280×800** and **390×844**, using supplied
`npm start` behavior in disposable builds. Only low/medium’s temporary
port literals change; routing/MIME and application logic stay unchanged.
Free ports **41000–49999**, named browsers and process groups are cleaned.
T3 status/open were checked; CLI follows the requested prior-audit workflow.

| Effort | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 300×600 at x=410 | 466 | 300×600 at x=0 | Hold/next x=332..452 clip | None |
| medium | Static 282×620.39 at x=199 | 390 | Static 282×620.39 at x=54 | Blank game, previews and inert controls | CSS import rejected as text/css module |
| high | 340×660 at x=470 | 390 | 336.25×652.5 at x=26.875 | Next previews overlap at both sizes; queue scroll-reachable | None |
| xhigh | 326×652 at x=477 | 390 | 326×652 at x=32 | Four complete previews below fold, fully reachable | None |
| max | 284×568 at x=498 | 390 | 284×568 at x=53 | Complete scrolling panels; visible active Game over overlay | None |

All five build and pass own tests, but medium’s unchanged emitted entry
`import "./style.css"` prevents browser module evaluation. Its delivered
server responds with text/css; Chromium requires JavaScript/Wasm. Board/
previews stay blank and score stays zero through all required keys, R and
Restart click at both sizes. No source/MIME workaround or substitute static
server is used. Its headless engine results are diagnostic only.

The four usable games receive real **Left, Right, Up, X, Z, Left Ctrl,
Down, Space, C**, asserting movement, rotation, soft points, four hard-locked
cells and low’s broken hold availability. Real Space blocks the incoming
spawn and **real R** resets board/hold/score/lines/level/availability at both
sizes. Max has `gameOver=false`, `hidden=true` and computed `display:grid`
after reload and restart: its false Game over overlay covers the live board,
matching the historical Luna Codex finding. High/xhigh hide overlays correctly.

Actual canvas calls/DOM cells assert all seven obstructed ghost projections.
High’s three identical I previews have intersecting filled-cell rectangles
because 70 px rows occupy origins 25 px apart. Scroll checks fully reach
high/xhigh’s phone queue cards; vertical reflow is not clipping. Xhigh’s
800 ms normal / real Down / 1 ms fixture moves/scores **18 rows/points**.
Low’s unchanged browser callback moves **one row at 60 Hz / two at 144 Hz**
over equal 1480.001 ms at logical level two. High/xhigh/max agree across
refresh rates. Missing favicons are excluded; no other application exception,
console error or failed required asset occurs in the four playable games.

All ten screenshots were visually inspected outside the checkout and removed
after review. Physical touch/mobile hardware, native OS key-repeat timing,
other browsers and every focus edge were not certified. Exact fixtures,
limits and supplied isolation context: [GPT-5.6 Luna audit](gpt56-luna-review.md).
Reproduce with `python3 .audit/run-gpt56-luna-audit.py --offline` using the
[runner](run-gpt56-luna-audit.py), [engine](gpt56-luna-audit.mjs) and
[browser snippet](gpt56-luna-browser.cjs).

## GPT-6.1 Sol (four efforts)

Audited **2026-10-25** by Claude Opus 5.5 with the Playwright library and
installed **Chromium 156.0.8078.4**, **1280×800** and **390×844**, using each
run's `npm start` in disposable builds. Only low's temporary port literal
changes. Free ports **41000–49999**; browsers and process groups are cleaned.

| Effort | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 243×486 at x=518.5 | 390 | 223×446 at x=86 | Fits; hold/next stretched (phone cell aspect 0.48/0.486, desktop next 1.44) | None |
| medium | 240×480 at x=520 | 390 | 237×474 at x=132 | Fits; desktop next 1.186 / hold 1.107, phone hold 0.802 | None |
| high | 236×472 at x=537 | 390 | 236×472 at x=24 | Five separate square previews; touch controls fit | None |
| xhigh | 238×476 at x=521 | 390 | 241×482 at x=24 | Fits; clicked Sound/How to play keep Space | None |

Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** run at both sizes,
asserting movement, rotations, soft points, four hard-locked cells and hold.
Real Space blocks the incoming spawn and shows the overlay; drop/move/hold
keys are then inert and **real R** resets and hides it. Unchanged frame
callbacks agree at 60/144 Hz; the 800 ms normal / real Down / 1 ms transition
moves 17/1/2/1 rows (low's jump is the charged defect). After a mouse click on
a header button, Space hard-drops in low/medium/high with sound unchanged; in
xhigh it toggles Sound back or reopens How to play. No overflow, application
exceptions, console errors or failed assets (low's external Google Fonts
stylesheet excluded). All eight screenshots were visually inspected outside
the checkout and deleted.

## GPT-5.6 Sol — October 25

[Audit](gpt56-sol-review.md), [engine probes](gpt56-sol-audit.mjs),
[browser assertions](gpt56-sol-browser.cjs) and
[temporary-copy runner](run-gpt56-sol-audit.py). Chromium **156.0.8078.4**,
**1280×800** and **390×844**; all four delivered builds start.

| Effort | Desktop board | Phone document width | Phone board | Supporting state / finding | Application errors |
|---|---|---:|---|---|---|
| low | 310×620 at x=403.5 | 390 | 210×420 at x=90 | Four next previews fit; hold backing 112×80 → CSS 70×65 (aspect 0.769) | None |
| medium | 296×592 at x=492 | 390 | 258×516 at x=16 | Hold and five separate previews fit | None |
| high | 328.5×657 at x=475.75 | 390 | 228×456 at x=81 | Square high-DPI hold/five previews fit | None |
| xhigh | 324×648 at x=473 | 390 | 299×598 at x=45.5 | Hold/five previews below board, scroll-reachable at y=877 | None |

Real **Left, Right, Up, X, Z, Left Ctrl, Down, Space, C** work at both
sizes, asserting movement, rotation, soft points, four hard-locked cells
and hold. Real Space blocks the incoming spawn, game-over keys are inert,
and **real R** resets. The 800 ms normal / Down / 1 ms transition moves
one row/point in every run. Ledge-move safety passes each actual callback.
Low's actual loop moves **9/8 rows at 60/144 Hz** over 600 ms at level ten,
and an incoming held piece falls after only **200 ms** following 800 ms of
normal time; other runs reproduce **9/9** and no replacement fall at 200 ms.
Custom 600 ms held Down agrees at both rates (high 11, xhigh 14 rows/points).

All canvases fit within viewport width and all previews paint pixels. No
application exceptions, console errors or failed required assets occurred;
external Google Fonts/favicon noise is excluded. All eight screenshots
were visually inspected outside the checkout and deleted after review.
Servers use only free 41000–49999 ports, supplied routing/MIME unchanged;
only low/high temporary port literals change. All browsers, process groups
and temporary builds are cleaned. No physical touch or other-browser claim.
