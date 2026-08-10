# Ranking audit support

This directory contains the reproducible, repository-safe parts of the audit behind [`RANKING.md`](../RANKING.md). Generated builds, copied `node_modules` trees, temporary web servers, browser profiles, and timestamped Playwright artifacts are intentionally excluded.

## Engine probes

Build all implementations, then run the common probe from the repository root:

```sh
for project in deepseek-pi luna-codex luna-omp sol-codex sol-omp; do
  (cd "$project" && npm test)
done

node .audit/common-audit.mjs
```

The probe checks all 28 canonical SRS piece/orientation coordinate sets and reproduces the two ledge lock-delay findings. It asserts the exact audited result, so it will fail if an implementation changes without the ranking being reviewed.

## Ranking validation

```sh
node .audit/verify-ranking.mjs
git diff --check
```

The validator recomputes every weighted score, verifies the 0–10 half-point scale, checks local Markdown links, and detects malformed table rows.

## Browser audit

[`browser-results.md`](browser-results.md) records the viewport measurements, console results, control sequence, and the Luna Codex overlay probe. The browser pass used the Playwright CLI with Chromium and each implementation's intended `npm start` server.

The tested keyboard sequence was:

```text
ArrowLeft, ArrowRight, ArrowUp, X, Z, Control, ArrowDown, Space, C
```

Desktop checks used 1280×800; narrow-layout checks used 390×844. Screenshots were reviewed during the audit but are not committed because they contain nondeterministic falling-piece positions and add binary churn without improving reproducibility.
