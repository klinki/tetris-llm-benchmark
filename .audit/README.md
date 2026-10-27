# Ranking audit support

This directory contains the reproducible, repository-safe parts of the audit behind [`RANKING.md`](../RANKING.md). Generated builds, copied `node_modules` trees, temporary web servers, browser profiles, and timestamped Playwright artifacts are intentionally excluded.

## Claude Opus 5.5 medium isolated rerun — October 27

The [review](opus55-medium-rerun-review.md) independently audits
`claude-opus-5-5-medium` with the existing rubric and original/low/high/xhigh
Opus calibration. Scores are **8.5/7.5/9/8.5/8.5 = 8.40**, three minors:
missing PC bonuses, a sixteen-row soft-entry jump and clipped phone support.
It records every delivered file/own-test review, exact fixtures, coverage,
browser evidence, limits and supplied isolation facts. All 71 historical
entries are unchanged; **Claude Opus 5.5 (medium, original)** stays **9.05**.
No benchmark transcript or T3 thread-reading tool was used.

**Round 2 independently confirms all five scores and all three minor
findings.** Added 672 actual first-fitting SRS comparisons, all four
full/mini T facings, nonadjacent-row compaction, level-scaled scoring,
pause/soft-release clocks and real held-key/direction/blur/pause checks.
Node and both Chromium sizes pass; audit coverage adds no own-test credit.
The original score, all 71 historical entries and this run's rank16 stay unchanged.

```sh
python3 .audit/run-opus55-medium-rerun-audit.py --offline
```

The [runner](run-opus55-medium-rerun-audit.py) performs locked install,
explicit build, unchanged own tests (**13/13**), [engine assertions](opus55-medium-rerun-audit.mjs)
and [1280×800/390×844 Chromium checks](opus55-medium-rerun-browser.cjs) in
one random disposable root. Omit `--offline` if packages are uncached;
`--engine-only` explicitly skips browsers; `--review` waits for local
evidence inspection, then deletes it. No retained-copy/artifact option.

Coverage includes28 states/48 ordered kicks, concrete wall/floor outcomes,
100 actual bags, hold/retrieval/orientation, seven independent obstructed
ghosts/drop points/cells, precise delay/reset/cap/landing/ordinary and
exhausted ledges, full/mini/B2B/combo/PC scoring, gravity/refresh/soft entry,
legal hidden/partial locks, terminal/reset/pause, real required keys/R,
complete preview painting and exact phone bounds. All engine findings repeat
against served Chromium modules; real Space/Down/RAF reproduce PC/soft entry.

Own **unmodified npm start/server** honors PORT; only free41000–49999 ports
are used. Installed Playwright/Chromium is reused without download. Copies,
logs/screenshots and owned process/browser groups are cleaned on success,
failure and handled interruption, including initial exploratory failures.
No run implementation, scripts/tests, registry/pricing or earlier score changed.

## GPT-6.1 Terra — six efforts, October 26

The [review](gpt61-terra-review.md) independently scores the first
`gpt-6.1-terra-{low,medium,high,xhigh,max,ultra}` runs with the unchanged
rubric and GPT-5.6 Terra/GPT-6.1 Sol calibration. It records every criterion,
weighted arithmetic, exact fixtures, own-suite gaps, browser measurements,
limits and supplied isolation/multi-agent facts. All 65 historical entries
are unchanged. No implementation transcript or T3 thread-reading tool was used.

```sh
python3 .audit/run-gpt61-terra-audit.py --offline
```

The [runner](run-gpt61-terra-audit.py) installs locked dependencies, builds,
runs unchanged own workflows, [engine assertions](gpt61-terra-audit.mjs),
then [desktop/390×844 Chromium checks](gpt61-terra-browser.cjs) in random
disposable copies. All six build/test/start; own suites are nine/twelve
smoke assertions and 8/7/10/8 cases. Passing asserts exact defective and
conforming outcomes. Tokens, effort, ultra's three tested-agent subagents
and xhigh/max's recorded isolation findings have no scoring effect.

Coverage includes 28 canonical states/48 ordered kicks, actual T/I wall/
floor kicks, 100 actual bags per run, hold/retrieval/orientation/restart bag,
seven independent obstructed ghosts/points/cells, precise delay/reset/cap/
landing/ordinary and exhausted ledges, full/mini/B2B/combo/PC scoring,
manual-spin cancellation, gravity/refresh/soft transition, legal hidden/
partial locks, terminal engine/UI guards and real R. Every engine finding
repeats against served Chromium modules; actual RAF/keys additionally
reproduce timing and hidden paths. Preview painting/aspect, complete phone
fit and clicked-Pause Space handling have exact assertions.

All six own servers ignore PORT and hard-code 8321. As in earlier runners,
only that copied listen literal changes; each unmodified npm start command,
bundling, routes, MIME and app body stay intact. Only free 41000–49999 ports
are used. Installed Playwright/Chromium is reused without downloads.
`--effort` selects a run; `--engine-only` skips browsers; `--review` waits
for Enter to inspect evidence inside the disposable root, then deletes it.
No retained-copy option. All copies/logs/screenshots and owned browser/
server groups are cleaned on success, failure and handled interruption.

## Beam efforts and MiMo-V2.6-Flash — October 26

The [Beam effort review](beam-efforts-review.md) scores `beam-free-low`
and `beam-free-medium`; the [MiMo review](mimo-v26-flash-review.md) scores
the first `mimo-v2.6-flash-default`. Both retain the rubric/calibration,
five criteria, weighted arithmetic, exact fixtures, own-suite coverage and
supplied no-outside-access facts. Old `beam` stays **5.60**; all 62 earlier
entries are unchanged. No implementation transcript was read.

```sh
python3 .audit/run-beam-mimo-audit.py --offline
```

The [runner](run-beam-mimo-audit.py) performs locked installs, explicit
builds, unchanged own suites, [engine assertions](beam-mimo-audit.mjs)
and [desktop/390×844 Chromium assertions](beam-mimo-browser.cjs) in random
disposable copies. All build/test; low only prints `ok` with zero assertions,
medium runs four assertions, MiMo reports 76. Medium's CommonJS entry fails
with `exports is not defined`; headless/browser engine diagnostics are
explicitly separate from delivery. Low and MiMo start; low R leaves RAF
stopped. Passing asserts exact defects as well as conformance.

Coverage includes canonical states/kicks, bags, hold, independent obstructed
ghosts/drop points/cells, normal/spin/B2B/combo/PC scoring, gravity/levels,
lock/reset/cap/ledge, replacement clocks, public hidden locks, real keys/R
and exact canvas/phone clipping. MiMo passes all 28 states/48 actual ordered
transitions and 100 actual bags; its real RAF reproduces the 17-row soft jump.
Low's 13 and medium's six noncanonical states are pinned. Browser evidence
and limitations are in the records and [browser results](browser-results.md).

Omit `--offline` for uncached dependencies; `--effort low|medium|mimo`
selects one run; `--engine-only` skips browsers. Each declared **npm start**
workflow is used; only copied hard-coded port literals change for Beam,
while MiMo honors PORT unchanged. Only free **41000–49999** ports are used.
Installed Playwright/Chromium are reused without downloads. Logs/screenshots
stay inside the disposable root and are removed with copies and owned
servers/browsers on success/failure/interruption. No retained-copy option.

## Claude Opus 5.5 efforts — October 26

The [Opus effort review](opus55-efforts-review.md) independently audits
`claude-opus-5-5-{low,high,xhigh}` with the existing rubric and calibration.
It records all five criteria/weighted arithmetic, exact fixtures, own-test
coverage, Chromium geometry and supplied no-outside-access facts. The
existing medium `opus-5.5` stays **9.05**; every historical score is unchanged.

```sh
python3 .audit/run-opus55-efforts-audit.py --offline
```

The [runner](run-opus55-efforts-audit.py) performs locked installs, explicit
builds and unchanged own suites in random disposable copies, then runs
[engine assertions](opus55-efforts-audit.mjs) and
[desktop/390×844 Chromium assertions](opus55-efforts-browser.cjs). All three
build/test/start; own suites pass **11/12/16** deterministic cases. Passing
asserts exact recorded defective outcomes as well as conforming paths.

Coverage includes 28 canonical states/48 ordered transitions, actual T/I
wall/floor kicks, 100 actual bags, held retrieval/orientation, seven
independently obstructed ghosts/exact drop points/cells, ordinary lock/reset/
ledge paths, full/mini/B2B/combo/PC scoring, gravity/levels, soft transitions,
held replacement phase, legal hidden/partial locks and terminal reset.
Browser checks repeat the engine suite against served modules, every real
required key and R, seven actual ghost drawings, complete proportional
previews and exact phone clipping. Unchanged RAF reproduces low/high's
sixteen-row soft jump, all three's premature landing-frame lock, high/xhigh's
fifteenth-reset lock and low's exhausted-ledge stale clock.

All servers use **unmodified `npm start` with PORT** on free 41000–49999
ports. No application/server source changes are needed. Omit `--offline`
when dependencies are not cached; `--engine-only`, `--effort` and an
outside-checkout `--artifacts-dir` are supported. Installed Playwright and
Chromium are reused without downloads. Browsers/server groups/copies are
cleaned on success/failure; retained evidence is optional. Physical touch,
HiDPI hardware, native OS repeat and other browsers remain unverified.

## GPT-5.6 Terra and Qwen3.8 Max — October 25

The [Terra review](gpt56-terra-review.md) covers low/medium/high/xhigh/max;
the [Qwen Max review](qwen38-max-review.md) covers low/medium. Both use the
existing rubric and calibration, recording every confirmed finding, own-test
coverage, exact desktop/phone measurements and supplied isolation facts.
Qwen's unfinished xhigh is excluded. Terra max’s [unasked external
actions](gpt56-terra-max-external-actions.md) are documented without a score
penalty. Historical scores stay unchanged; the original four-run audit
reran the complete existing Sol runner as a calibration check.

```sh
python3 .audit/run-gpt56-terra-audit.py --offline
python3 .audit/run-qwen38-max-audit.py --offline
```

The [Terra runner](run-gpt56-terra-audit.py) and
[Qwen runner](run-qwen38-max-audit.py) rebuild and execute unchanged own
workflows in random disposable copies, then run
[Terra engine probes](gpt56-terra-audit.mjs),
[Qwen engine probes](qwen38-max-audit.mjs),
[Terra Chromium assertions](gpt56-terra-browser.cjs) and
[Qwen Chromium assertions](qwen38-max-browser.cjs). The canonical oracle,
fixtures and browser utility are shared; each adapter calls its own run.
All seven build/test/start, although Terra medium's smoke never executes logic.
The one Terra command audits all five efforts; the shared Qwen runner also
still passes after the extension. Max has 17 own smoke assertions and five
confirmed minor findings, scoring 7.60.

Coverage includes all 28 states/48 ordered transitions, actual wall/floor
kicks, 100 engine bags, hold, seven independently obstructed ghosts/drop
points/cells, exact lock/reset/cap/ledge probes, normal/full/mini/B2B/combo/PC
variants, gravity curve/levels, soft timing, legal hidden/partial lock-out,
blocked spawn/reset, every real required key and unchanged 60/144 Hz frame
callbacks. Browser assertions reproduce overlay, clipped/blank preview and
phone-state findings. Max adds landing-frame partition assertions, all seven
command-button/New game clicks, complete preview painting and exact phone
next-canvas scaling (cell aspect 0.702647). Passing asserts defects as well
as conforming paths.

Omit `--offline` when dependencies are not cached. `--engine-only`,
`--effort` and outside-checkout `--artifacts-dir` options are supported.
Installed Playwright/Chromium is reused, without another browser download.
Only temporary hard-coded port literals change; routes/MIME/app logic stay
unchanged. Servers use free 41000–49999 ports; processes, browsers and
copies are cleaned on exit. Physical touch and other browsers remain unverified.

## DeepSeek V4.1 Flash (low, high, max)

[`deepseek-v41-review.md`](deepseek-v41-review.md) records the independent
2026-10-24 audits of `deepseek-v4.1-flash-{low,high,max}`: exact findings,
score rationale, own-test gaps, desktop/phone measurements and the supplied
same-thread background-log exemption (commit 715a85e). The predecessor
`deepseek-pi` remains 7.30 under its historical audit.

```sh
python3 .audit/run-deepseek-v41-audit.py --offline
```

The default command installs/builds/tests all three in random disposable
copies, runs [`deepseek-v41-audit.mjs`](deepseek-v41-audit.mjs), then executes
the 1280×800 and 390×844 Chromium assertions in
[`deepseek-v41-browser.cjs`](deepseek-v41-browser.cjs). Omit `--offline`
when locked npm dependencies are not cached. All supplied servers accept
`PORT`; no application/server code is changed. Only free ports 41000–49999
are used. Named browsers, server groups and copies are cleaned on exit.
Max's browser build runs explicitly in addition to its test-graph compile.

The probes assert 28 canonical states, every CW/CCW kick table and actual
kicks (including high's eight I-table mismatches), ten seeded engine bags,
hold/queue, seven obstructed ghosts/drops, exact grounded timing/reset cap,
ledge mid-air safety, normal/full/mini/B2B/combo/PC variants, gravity curve/
levels, soft transitions, blocked spawn and restart. Low/high have legal
public-action hidden lock-outs; max rejects above-top cells, so a legal
ceiling-kick fixture reproduces that buffer limitation instead. Browser
checks exercise every required key at both sizes, real R, exact fitting
geometry, high's reachable below-fold panels and actual 60/144 Hz callbacks.
Passing asserts recorded defects as well as conformance, not bug freedom.

`--engine-only` explicitly skips browsers; `--effort` selects one run.
CLI/config and outside-checkout `--artifacts-dir` overrides match the recent
audits. Own suites pass 16/24/19 deterministic cases; no own-test flakiness
was found. Physical touch and other browser engines remain unverified.

## GLM-5.3-Flash (low, high, max)

[`glm-review.md`](glm-review.md) records the independent 2026-10-24 audits,
scores, exact defects, own-test limits and supplied generation/isolation facts
for `glm-5.3-flash-free-{low,high,max}`. High's excluded notification turn
changed no files; the audited implementation is turn 1.

```sh
python3 .audit/run-glm-audit.py --offline
```

The default command installs/builds/tests all three in random disposable
copies, runs [`glm-audit.mjs`](glm-audit.mjs), then the desktop/390×844
Chromium assertions in [`glm-browser.cjs`](glm-browser.cjs). Omit `--offline`
when npm dependencies are not cached. Max's unchanged own suite uses declared
LCG seed 1; the probe independently asserts the reproducible seed-16 failure
of its assumption that the next random piece cannot be I. Initial unseeded
workflows passed. That own-test limitation affects tests, not correctness.

The probes cover all 28 canonical states, kick tables and actual kicks, ten
actual seeded bags, hold/ghost/drop geometry, lock boundary/reset cap/ledge,
normal/full/mini/B2B/combo/PC scoring, gravity/levels/soft timing, hidden lock-out,
blocked spawn and restart. Browser checks use every required key and real R,
exact phone geometry, low's actual 120 Hz callback and overlapping/clipped
previews. Passing asserts recorded defects as well as conformance.

`--engine-only` explicitly skips browsers; `--effort` selects one run.
CLI/config and outside-checkout `--artifacts-dir` overrides match the recent
audits. Only ports 41000–49999 are used; low/high port constants change only
in temporary server copies, preserving routes/MIME. Named browsers, server
groups and copies are cleaned on success/failure. No run source is changed;
low's tracked pre-existing `build/tests` remains untouched.

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

## Claude Haiku 5.5 (low, medium, high, xhigh and max)

[`haiku-review.md`](haiku-review.md) records the 2026-10-24 audits of all five
independent efforts using the same rubric, scoring profile and viewports.
The low/medium addition records both B2B perfect-clear under-awards, both soft
transitions, medium's unsafe hidden locks (including the real-key TypeError),
phone sidebar clipping, own-test rationale and supplied clean isolation facts.
The existing high/xhigh/max findings, scores and assertions are preserved.

```sh
python3 .audit/run-haiku-audit.py --offline
```

The default command installs/builds/tests **all five** in random disposable
copies, runs [`haiku-audit.mjs`](haiku-audit.mjs) and the desktop/390×844
Chromium pass in [`haiku-browser.cjs`](haiku-browser.cjs). Omit `--offline`
if npm packages are not cached. Browsers now run by default; `--browser`
remains compatible, while `--engine-only` explicitly skips them. `--effort`
selects one run. CLI/config and outside-checkout `--artifacts-dir` overrides
match recent audit runners. The runner discovers installed Chromium when
no explicit launch config is supplied.

The low/medium probes cover 28 canonical states, every CW/CCW kick table,
actual T/I kicks, 100 seeded bags, hold/queue, seven obstructed ghosts/drops,
exact lock boundary/reset cap/ledge safety, normal/full/mini/B2B/combo/PC
scores, gravity curve/levels, soft timing, hidden locks, blocked spawn and
restart. Real required keys/R work at both sizes; the unchanged 60/144 Hz
callbacks agree at levels 1/10/15. Medium's known hidden-lock TypeError is
explicitly required in a separate fixture, not ignored as browser noise.
Passing asserts the documented outcomes, including defects, not bug freedom.

Servers use only free ports **41000–49999**. Low, medium and max's hard-coded
port literals change only in disposable server copies; routing, MIME and
application code stay unchanged. Named browsers, process groups and copies
are cleaned on success/failure. Outside-checkout artifacts can be retained
for visual inspection and then deleted. No implementation files or generated
build output are changed in the original run folders.

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

## Muse Spark 1.3 contributor (minimal, low, medium, high, xhigh)

[`muse-review.md`](muse-review.md) records the independent 2026-10-24 audits
of `muse-spark-1.3-contributor-{minimal,low,medium,high,xhigh}`. Contributor
medium is **from scratch**; the distinct reference-assisted
`muse-spark-1.3-medium` remains 8.40 under its October 23 audit. Both registry
labels are preserved. The record includes every confirmed engine/input/layout
finding, own-test rationale, exact session mappings and supplied isolation
facts without score effects.

```sh
python3 .audit/run-muse-audit.py --offline
```

The default command installs/builds/tests all five in fresh random temporary
copies, runs [`muse-audit.mjs`](muse-audit.mjs), then the desktop/390×844
Chromium assertions in [`muse-browser.cjs`](muse-browser.cjs). Omit `--offline`
when npm packages are not cached. `--engine-only` explicitly skips browser
findings; `--effort` selects one effort for diagnostics. Browser CLI/config
and outside-checkout `--artifacts-dir` overrides match the Sonnet/Gemini
runners. Supplied servers use only free ports 41000–49999; hard-coded port
constants change only in disposable server copies. Named browsers, server
process groups and copies are cleaned on success/failure.

Assertions cover 28 canonical states, both kick directions and low's actual
wrong-kick outcome, ten seeded actual bags, hold/queue/ghost/drop geometry,
lock boundary/reset behavior/ledge safety, normal/full/mini/B2B/combo/PC
scoring, gravity/levels, soft timing, hidden lock-out, blocked spawn and R.
Browser assertions exercise the actual required keys, exact phone geometry,
high's unscored immediate Down row, low's overpainted legend, medium-from-
scratch's clipped I previews and xhigh's overlay lifecycle. A passing run
confirms the recorded outcomes, including defects, rather than certifying
bug-free implementations. No run implementation or registry data is changed.

## GPT-6 Luna (low, medium, high, xhigh, max)

[`gpt6-luna-review.md`](gpt6-luna-review.md) records the independent
2026-10-24 audits of five `gpt-6-luna-*` runs in T3 Code / Codex, standard
tier, with exact findings/scores, test limits, phone/desktop measurements
and supplied isolation context. GPT-5.6 Luna's historical scores are unchanged.

```sh
python3 .audit/run-gpt6-luna-audit.py --offline
```

The default runner installs/builds/tests all five in random disposable copies,
then executes [`gpt6-luna-audit.mjs`](gpt6-luna-audit.mjs) and desktop/390×844
Chromium assertions in [`gpt6-luna-browser.cjs`](gpt6-luna-browser.cjs).
Omit `--offline` when packages are not cached. Medium has no lockfile, so uses
`npm install`; **113 build errors, no emitted game, failing npm test and its
ESM server error are required findings**. Its in-memory diagnostic source
probes and unchanged static page are explicitly not a working delivery.
Xhigh's unchanged bag test must fail **2 pass / 1 fail**; an independent
100-bag probe establishes a broken stack-to-top-out test fixture, not a
randomizer bug. Passing asserts recorded failures as well as conformance.

Coverage includes all 28 states, ordered SRS candidates and actual kicks,
100 actual seeded bags, hold/queue, all seven obstructed drops, precise lock
boundary/cap/ledge safety, full/mini/B2B/combo/PC variants, levels/gravity
curve, soft transitions, public-action hidden lock-out, blocked spawn/reset,
real required keys and the unchanged 60/144 Hz callbacks. Browser checks
assert erased/removed/squashed previews, and high's reachable scrolled queue.

`--engine-only`, `--effort`, CLI/config and outside-checkout `--artifacts-dir`
options match recent runners. Only low's temporary server port is changed;
medium's static server serves HTML/CSS with the missing game module still
404. Free ports 41000–49999, named Chromium sessions, process groups and
copies are cleaned on exit. No implementation source is repaired or edited.

## GPT-5.6 Luna (low, medium, high, xhigh, max)

[`gpt56-luna-review.md`](gpt56-luna-review.md) records independent
**2026-10-25** audits of five `gpt-5.6-luna-*` runs in T3 Code / Codex,
standard tier. It includes exact findings, comparable scores, own-test gaps,
desktop/phone evidence and supplied generation/isolation facts. Historical
Luna records and scores remain unchanged.

```sh
python3 .audit/run-gpt56-luna-audit.py --offline
```

The [runner](run-gpt56-luna-audit.py) installs/builds/tests all five in
random temporary copies, then runs [engine probes](gpt56-luna-audit.mjs)
and [desktop/390×844 Chromium assertions](gpt56-luna-browser.cjs).
All builds/own suites pass. **Medium’s actual browser must fail to start**
because its entry imports CSS as JavaScript; headless engine results are
explicitly diagnostic, never a playable delivery. Passing reproduces
documented defects as well as conforming paths.

Coverage includes all 28 canonical states, 48 ordered kick transitions,
actual wall/floor kicks, 100 seeded engine bags, hold/queue, seven obstructed
ghosts/drop coordinates/points, 499/500 ms locking, natural contact, reset
cap and ledge safety, full/mini/B2B/combo/PC scoring, gravity curve/levels,
soft timing, public-action hidden locks, blocked spawn/reset, real keys
and unchanged 60/144 Hz callbacks. Browser assertions cover low’s clipped
phone support, high’s overlapping next previews, max’s false overlay and
medium’s module-MIME failure.

Omit `--offline` if npm packages are not cached. `--engine-only`,
`--effort`, CLI/config and outside-checkout `--artifacts-dir` options match
recent runners. Only low/medium’s temporary server port literals change;
application and routing/MIME logic remain unchanged. Servers use free
41000–49999 ports; named Chromium sessions/server groups/copies are cleaned.

## GPT-6.1 Sol (low, medium, high, xhigh)

[`gpt61-sol-review.md`](gpt61-sol-review.md) records the **2026-10-25**
audits of four `gpt-6.1-sol-*` runs in T3 Code / Codex, standard tier.
Because GPT-6.1 Sol audited every other run, these were audited by
**Claude Opus 5.5 (high effort)** with the same rubric and calibration; a
first attempt stopped at a rate limit and was re-verified. The record has
exact findings, comparable scores, own-test gaps, desktop/phone evidence
and supplied generation/isolation facts. Historical Sol scores are unchanged.

```sh
python3 .audit/run-gpt61-sol-audit.py --offline
```

The [runner](run-gpt61-sol-audit.py) installs/builds/tests all four in
random temporary copies (asserting 11/16/23/37 own passes), then runs
[engine probes](gpt61-sol-audit.mjs) and
[desktop/390×844 Chromium assertions](gpt61-sol-browser.cjs). Passing
reproduces the documented defects as well as conforming paths.

Coverage includes all 28 canonical states, 48 ordered kick sequences,
actual wall/floor kicks, 100 engine bags, hold, seven obstructed ghosts,
499/500 ms locking, natural contact, reset cap and ledge safety,
full/mini/B2B/combo/PC scoring, gravity curve/levels, soft-drop transition,
public-action hidden lock-out, blocked spawn/reset, real keys, R restart,
unchanged 60/144 Hz callbacks, preview cell aspect and Space after a
clicked header button. Browser assertions reproduce low/medium's stretched
previews and xhigh's focused-button Space capture.

`--engine-only`, `--effort` and outside-checkout `--artifacts-dir` match
recent runners. Only low's temporary server port literal changes. Servers
use free 41000–49999 ports; browsers, server groups and copies are cleaned.
Physical touch hardware, high-DPI devices, native key repeat and other
browsers were not certified.

## GPT-5.6 Sol (low, medium, high, xhigh)

[`gpt56-sol-review.md`](gpt56-sol-review.md) records the **2026-10-25**
audits of four `gpt-5.6-sol-*` runs in T3 Code / Codex, standard tier.
It includes comparable scores, every confirmed engine/browser finding,
own-suite gaps, supplied Sites documentation/isolation/pricing facts and
exact session mappings. Historical Sol Codex/OMP retain 8.20/8.30.

```sh
python3 .audit/run-gpt56-sol-audit.py --offline
```

The [runner](run-gpt56-sol-audit.py) installs/builds/tests all four in fresh
random temporary copies, executes [engine probes](gpt56-sol-audit.mjs), then
[desktop/390×844 Chromium assertions](gpt56-sol-browser.cjs). All four build,
pass their own workflows and start. Passing asserts documented defects as
well as conformance. Omit `--offline` if packages are not cached;
`--engine-only`, `--effort` and outside-checkout `--artifacts-dir` are supported.
It uses installed Playwright/Chromium and downloads no new browser.

Coverage: all 28 states, all 48 ordered non-O kicks, wall/floor outcomes,
100 actual bags, hold/retrieval, seven obstructed ghosts, exact drop points,
499/500 ms lock/cap/failed-action/ledge paths, normal/full/mini/B2B/combo/PC,
gravity curve/levels, soft timing, replacement clocks, refresh independence,
public-action hidden/partial locks, blocked spawn/inert keys and real R.
Browser assertions reproduce low's distorted phone hold and old hold-clock
phase; all phone panels fit in width. Only low/high temporary port literals
change; servers use free 41000–49999 ports. Browsers, process groups and
copies are closed/deleted. No authored implementation is repaired or edited.
