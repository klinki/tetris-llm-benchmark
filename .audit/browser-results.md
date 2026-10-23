# Browser audit results

Original audit date: 2026-08-10; Luna PI added 2026-08-29;
five T3 Code/OpenCode imports added 2026-10-20.

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
