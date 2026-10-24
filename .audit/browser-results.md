# Browser audit results

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

The initial temporary servers used ports 41801–41803. The generalized runner
builds/tests/probes all three and, with `--browser`, selects only free ports
41000–49999, opens named Chromium sessions and cleans them and the servers on
exit. Max's server hard-codes 8321; only that constant is substituted in its
disposable copy, preserving its intended static-file behavior. Use
`?audit=high`, `?audit=xhigh` or `?audit=max` when invoking the browser snippet
manually. Exact engine findings, scores, isolation facts and one-command
reproduction are in the extended [`haiku-review.md`](haiku-review.md).

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
