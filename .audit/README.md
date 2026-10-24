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
child read Gemini-4's source/tests. The completed folders are `opus-5.5` and
`muse-spark-1.3-medium`. Opus's original `opus5.5` implementation folder was
renamed to `opus-5.5`, replacing the README-only placeholder; it is one run.

```sh
python3 .audit/run-oct23-audit.py --offline
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py verify opus-5.5
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

## Claude Haiku 5.5 (high, xhigh and max)

[`haiku-review.md`](haiku-review.md) records the 2026-10-24 audit of
all three efforts, using the same rubric and scoring profile. It includes
independent soft-drop reproductions, distinct phone layout measurements,
max's missing perfect-clear bonus and hidden lock-out, test-coverage rationale
and the supplied isolation findings (including high/xhigh's 8321 contacts).

```sh
python3 .audit/run-haiku-audit.py --offline
python3 .audit/run-haiku-audit.py --offline --browser --playwright-config /absolute/path/to/playwright.json
```

One command installs/builds/tests all three in disposable copies and executes
[`haiku-audit.mjs`](haiku-audit.mjs), preserving high's original assertions.
Omit `--offline` if packages are not cached. `--browser` adds each desktop/phone
Chromium pass; the config is optional when the CLI's default browser is installed.
[`haiku-browser.cjs`](haiku-browser.cjs) is the Playwright CLI snippet for the
keyboard, layout, console and asset checks; the review gives its effort query
parameters and launch configuration. Servers use only free ports 41000–49999.
Max's hard-coded port is changed only in its temporary server copy; routing and
application code are preserved. Named browsers, servers and copies are cleaned
on completion or failure. No generated artifacts or implementation changes
are included.

## Claude Sonnet 5.5 (low, medium, high and xhigh)

[`sonnet-review.md`](sonnet-review.md) records the independent 2026-10-24
audits using the same rubric, fixed deductions, scoring profile and viewports.
It includes every confirmed scoring/timing/hidden-lock-out/layout finding,
own-test coverage and score rationale, and the supplied isolation facts:
low's `../dist/game.js` scan hit is an internal test import false positive;
the other three have no outside access, T3 calls or benchmark lookups.

```sh
python3 .audit/run-sonnet-audit.py --offline
```

This command installs/builds/tests **all four** in fresh disposable copies
and runs [`sonnet-audit.mjs`](sonnet-audit.mjs) plus the desktop/390×844
Chromium pass in [`sonnet-browser.cjs`](sonnet-browser.cjs). Omit `--offline`
if npm dependencies are not cached. Unlike the earlier runners, browser
checks run by default; `--engine-only` explicitly skips them. The CLI defaults
to an installed `playwright-cli` or the local Playwright skill wrapper, and
reuses a locally installed Chromium. `--playwright-cli` and
`--playwright-config` override these choices. `--artifacts-dir` can retain
JSON/screenshots outside the checkout for visual review.

The probes assert all 28 canonical states, both kick directions, bags, hold,
ghost, lock delay/reset cap/ledge safety, gravity/levels, advanced scoring,
hidden lock-out and restart, including the exact recorded defective outcomes.
The browser forwards real commands to observe all required keys, repeats the
soft-drop timer probe through ArrowDown, exercises R after blocked spawn and
asserts measured phone widths/sidebar clipping or xhigh's fitting layout.
Servers use only free ports 41000–49999. Medium's hard-coded port is changed
only in its temporary server copy. Named browsers, server groups and copies
are cleaned on completion/failure; no run implementation is changed.

## Gemini 4 Argon (high)

[`gemini-high-review.md`](gemini-high-review.md) records the independent
2026-10-24 audit of `gemini-4-argon-contributor-high`, using the same rubric,
severity deductions, scoring profile and desktop/phone viewports. It includes
the missing perfect-clear bonus, clipped supporting panels, own-test rationale,
and supplied second-attempt/failed-launch/isolation context without score effects.

```sh
python3 .audit/run-gemini-high-audit.py --offline
```

The runner installs/builds/tests in a disposable copy and runs
[`gemini-high-audit.mjs`](gemini-high-audit.mjs) plus the default desktop and
390×844 Chromium pass in [`gemini-high-browser.cjs`](gemini-high-browser.cjs).
Omit `--offline` if dependencies are not cached. `--engine-only` explicitly
skips browsers; `--playwright-cli`, `--playwright-config` and an outside-checkout
`--artifacts-dir` work as in the Sonnet runner. The unchanged supplied server
uses `PORT` on a free port in 41000–49999. Named browser sessions, server groups
and copies are cleaned on success/failure.

Assertions cover all 28 SRS states, both kick directions, bags, hold/ghost,
lock timing/reset cap/ledge safety, normal/full/mini/B2B/combo/perfect-clear
scoring, gravity/levels, public-action hidden lock-out, blocked spawn and
restart. Browser assertions exercise every required binding, repeated soft
keydowns, active/game-over overlays, real R and exact phone sidebar clipping.
The 800 ms/Down/1 ms probe confirms one row/point without the recent cohorts'
soft-drop timer jump. Passing asserts documented findings, including defects;
it is not a claim of exhaustive correctness.
