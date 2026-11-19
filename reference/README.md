# Reference implementation (hand-improved, not ranked)

> **This is not a benchmark run.** No model produced it from the benchmark
> prompt in one session. It was improved by hand, with help from a coding
> agent and several rounds of audit feedback. It is **excluded from the
> rankings, the results table and the site**. Don't compare its score,
> tokens or time with the runs.

[`tetris-hand-improved/`](tetris-hand-improved/) starts from the top-ranked
run, [`gpt-6.1-sol-high`](../gpt-6.1-sol-high/) (9.35), and fixes or improves
everything the audits raised. It shows what a top-scoring implementation of
[`TETRIS.md`](../TETRIS.md) looks like under the current
[rubric](../RANKING.md#methodology) and [audit policy](../.audit/SPEC.md), so
it can be used to calibrate auditors and check the audit probes.

Run it like any benchmark run: `npm install`, `npm test`, `npm start`. The
optional Chromium suite in `tests/browser.test.mjs` runs when Playwright can be
imported, for example
`PLAYWRIGHT_MODULE=../../node_modules/playwright npm test` from inside the folder.

## Reviews

Every review was by an independent GPT-6.1 Sol (`gpt-6.1-sol`) subagent at
`xhigh` effort, verified from its native Codex `turn_context`.

| # | Review | Briefing | Version | Correctness | Tests | Code | Simplicity | UX | Weighted |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| — | [`gpt-6.1-sol-high`](../.audit/gpt61-sol-review.md) (starting point) | normal | original run | 10 | 9.0 | 9.0 | 8.5 | 9.0 | 9.35 |
| 1 | [Informed audit](reviews/01-informed-audit.md) | told it was hand-improved | first | 9.0 | 9.5 | 9.0 | 9.0 | 9.0 | 9.10 |
| 2 | [Informed re-audit](reviews/02-informed-re-audit.md) | told the goal and the previous findings | second | 9.5 | 9.5 | 9.0 | 9.0 | 9.0 | 9.30 |
| 3 | [Blind audit](reviews/03-blind-audit/candidate-run-review.md) | normal [review brief](../.audit/REVIEW_BRIEF.md), origin undisclosed | **final (this folder)** | **10** | **9.5** | 9.0 | 9.0 | 9.0 | **9.50** |

Native reviewer sessions: 1 `01a1f44f-f61e-7a81-8fbc-6966ff7f6e54`,
2 `01a1f45b-1d8e-7d40-b62d-6ce80306faa6`,
3 `01a1f469-6282-7a91-8acf-72951c5ea391`.

**Blind audit.** It followed the normal brief, with one agreed exception:
because the folder isn't a registered run, the reviewer did not edit
`ranking.json` or `.audit/README.md` and did not run `render`/`verify`. Its
proposed ranking entry is in its review and was deliberately not added. To keep
the review blind, it ran in a standalone local clone of `main` with no remote.
There the folder was named `candidate-run/`, and model, effort and harness were
listed as undisclosed. The files it audited are byte-identical to this folder;
its [evidence](reviews/03-blind-audit/candidate-run-evidence.json) records the
hashes. Its probe scripts expect that clone's layout (`candidate-run/` at the
repository root) and are kept as a record, not as a ready-to-run tool.

**Ceiling.** The blind reviewer gave no deductions for code, simplicity or UX.
It placed them in the calibrated 9.0 tier, and said finite testing does not
justify a perfect tests score. No ranked run has scored above 9.0 for code, so
under the current calibration 9.5 is likely close to the practical maximum.

## History

Changes from `gpt-6.1-sol-high`, in order:

1. **Before review 1:**
   - Reaching a new lowest row restores the full lock delay and all 15 resets. This was a latent defect the original audit didn't probe, and the same class was charged against GPT-6.1 Sol max and GPT-6.1 Terra max.
   - Starting a soft drop no longer adds an extra gravity row.
   - Split into pieces, engine, DOM-free controls, renderer and entry modules.
   - Aspect-locked previews and a much smaller responsive UI.
   - Tests grew from 23 to 54, including canonical-state, kick-order, timing and scoring oracles, input tests and a server test.
2. **After review 1:**
   - Lowest-row restoration also covers downward kicks.
   - Restart clears the previous game's message.
   - Kick tests start from legal poses.
   - DOM elements and `data-action` values are validated.
   - The board fits 320×568 and 1366×640 without scrolling.
3. **After review 2:**
   - Auto-repeat and the game clock advance in time order, so a held direction no longer shortens lock delay at some refresh rates.
   - Engine state is read-only, with a validated `setUp()` for fixtures.
   - `play()` and `pause()` consolidate the start, resume and restart logic.
   - Sound and best-score storage moved into their own modules.
   - Added an optional owned Chromium suite.
   - Touch buttons have text captions, and the board is larger on short phones.
