# Ranking audit support

This directory contains the reproducible, repository-safe parts of the audit behind [`RANKING.md`](../RANKING.md). Generated builds, copied `node_modules` trees, temporary web servers, browser profiles, and timestamped Playwright artifacts are intentionally excluded.

[`deepseek-session-analysis.md`](deepseek-session-analysis.md) documents the
two-message implementation cutoff, the excluded user-wait interval, and the
README-only third phase with exact read-only SQLite reproduction queries.

## Engine probes

Build all implementations, then run the common probe from the repository root:

```sh
for project in deepseek-pi luna-codex luna-omp luna-pi sol-codex sol-omp; do
  (cd "$project" && npm test)
done

node .audit/common-audit.mjs
```

The probe checks all 28 canonical SRS piece/orientation coordinate sets,
reproduces the two ledge lock-delay findings, and confirms Luna PI's
level-dependent combo-scoring defect. It asserts the exact audited result, so
it will fail if an implementation changes without the ranking being reviewed.

## Ranking validation

```sh
node .audit/verify-ranking.mjs
git diff --check
```

The validator recomputes every weighted score, verifies the 0–10 half-point scale, checks local Markdown links, and detects malformed table rows.

## Browser audit

[`browser-results.md`](browser-results.md) records the viewport measurements, console results, control sequence, and the Luna Codex overlay probe. The browser pass used the Playwright CLI with Chromium and each implementation's intended `npm start` server.

[`luna-pi-review.md`](luna-pi-review.md) records the new implementation's
source, test, engine-probe, session-isolation, and browser evidence.

## October T3 Code/OpenCode imports

[`october-review.md`](october-review.md) covers Beam, Cat-jam, Gemini-4,
Nemotron, and Space-bunny, imported on 2026-10-20. It includes exact source
directories, T3/OpenCode session IDs, main-agent usage/timing, the scoring
deductions, test limitations, and desktop/mobile browser evidence.

Rebuild and test these five in fresh temporary copies, then run their probes:

```sh
python3 .audit/run-october-audit.py --offline
```

Omit `--offline` if dependencies are not cached. The runner executes every
declared `npm test`, creates a separate temporary CommonJS compile for
Nemotron's engine probes, and runs [`october-audit.mjs`](october-audit.mjs).
The original browser build remains unchanged. A successful probe run confirms
the recorded defects still reproduce; it does not certify a bug-free game.

[`october-browser.cjs`](october-browser.cjs) is the reusable Playwright CLI
snippet for fresh navigation, control input, asset failures, measurements,
and screenshots. See the October record for its invocation and server ports.
No new implementation source was changed to fix an audit finding.

The benchmark CLI also collects these five runs from T3's read-only SQLite
database and generates their `STATISTICS.md` files and README results rows:

```sh
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py refresh beam
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py verify beam
```

Whole-turn main-agent tokens, timing, and the recorded reasoning variant are
verified. Overhead, combined usage, cost, and normalized tool-call counts stay
explicitly unverified until their accounting is established.

## October 23 additions

[`oct23-review.md`](oct23-review.md) reviews Opus 5.5 and Muse Spark 1.3
(medium), including the Muse child/parent split and direct evidence that the
child read Gemini-4's source/tests. The completed folders are `opus5.5` and
`muse-spark-1.3-medium`; the README-only `opus-5.5` folder is not a third run.

```sh
python3 .audit/run-oct23-audit.py --offline
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py verify opus5.5
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py verify muse-spark-1.3-medium
```

The fresh-copy runner executes both declared test suites and
[`oct23-audit.mjs`](oct23-audit.mjs). Browser checks reuse the common CLI
snippet. Opus's medium effort is verified against its SDK request log;
Muse's medium child is isolated from the xhigh parent, whose recorded usage
is preserved separately without claiming complete overhead accounting.

The tested keyboard sequence was:

```text
ArrowLeft, ArrowRight, ArrowUp, X, Z, Control, ArrowDown, Space, C
```

Desktop checks used 1280×800; narrow-layout checks used 390×844. Screenshots were reviewed during the audit but are not committed because they contain nondeterministic falling-piece positions and add binary churn without improving reproducibility.
