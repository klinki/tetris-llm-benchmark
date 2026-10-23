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

The audit exercised the required keyboard inputs: horizontal movement, clockwise rotation through both Up and X, counter-clockwise rotation through Z and Left Control, soft drop, hard drop, and hold. Source review additionally confirmed the game-over restart binding because reliably reaching top-out through UI play would make the browser comparison unnecessarily timing-dependent.
