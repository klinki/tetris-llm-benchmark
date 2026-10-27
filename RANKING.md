# Tetris Implementation Quality Ranking

This ranking evaluates 72 implementations against [`TETRIS.md`](TETRIS.md). Quality is scored independently of generation time and token use; efficiency data appears only as non-scoring context.

The original audit was performed on 2026-08-10, Luna PI was added on 2026-08-29, and five T3 Code/OpenCode implementations were added on 2026-10-20. The first 32 implementations initially passed their declared build/test workflows in isolated temporary copies. GPT-6 Luna medium fails to build; GPT-6 Luna xhigh builds but has a deterministically failing own bag test, recorded separately below. GLM max also has a reproducible random-dependent own-test failure, recorded in its audit and test score. Nemotron nevertheless fails to start in the browser because its emitted imports do not resolve. Browser checks used each project's intended server behavior and Chromium at 1280×800 and 390×844. Reproducible probes and evidence are in [`.audit`](.audit/README.md).

Opus 5.5 and Muse Spark 1.3 (medium, reference-assisted; `muse-spark-1.3-medium`) were added on 2026-10-23 with the same scoring profile. Muse's implementation agent read Gemini-4's engine, shape data, tests, and build files before writing its version; its quality can be scored, but its efficiency is not an independent from-scratch comparison. See the [October 23 audit](.audit/oct23-review.md).

Claude Haiku 5.5 (low, medium, high, xhigh and max) were audited on 2026-10-24 with the same
rubric and scoring profile. Their isolated builds/tests, engine probes and
desktop/phone browser evidence are in the [Haiku audit](.audit/haiku-review.md).

Claude Sonnet 5.5 (low, medium, high and xhigh) were audited independently on
2026-10-24 with the same rubric. Fresh-copy builds/tests, equivalent engine
probes, real-keyboard desktop/phone checks and isolation context are in the
[Sonnet audit](.audit/sonnet-review.md).

Gemini 4 Argon (high) was audited independently on 2026-10-24. Its fresh-copy
build/tests, equivalent engine probes, desktop/phone evidence and second-attempt
isolation context are in the [Gemini high audit](.audit/gemini-high-review.md).

Five independent Muse contributor runs were audited on 2026-10-24. The
[Muse contributor audit](.audit/muse-review.md) records their fresh-copy
builds/tests, engine/browser probes, scoring rationale and isolation facts.
`muse-spark-1.3-contributor-medium` is **medium, from scratch**;
`muse-spark-1.3-medium` is **medium, reference-assisted** and remains 8.40.
The duplicate display labels are preserved from the unchanged registry.

GLM-5.3-Flash (low, high and max) were independently audited on 2026-10-24.
The [GLM audit](.audit/glm-review.md) records their isolated builds/tests,
engine/browser probes, max's flaky own assertion, scores and generation context.
High's excluded notification turn changed no files; turn-1 code is audited.

DeepSeek V4.1 Flash (low, high and max) were independently audited on
2026-10-24. The [DeepSeek V4.1 audit](.audit/deepseek-v41-review.md) records
isolated builds/tests, canonical engine probes, desktop/phone checks,
scoring rationale and the supplied own-log isolation exemption.

Five GPT-6 Luna efforts were independently audited on 2026-10-24. The
[GPT-6 Luna audit](.audit/gpt6-luna-review.md) records isolated build/test
outcomes, equivalent engine/Chromium probes and supplied isolation context.
Medium has no delivered playable build and is scored by the same capped
critical-failure method as Nemotron; its diagnostic source probes and static
page are explicitly separate. Xhigh's failing bag test is a broken fixture,
not a randomizer defect. Predecessor Luna scores remain unchanged.

Five GPT-5.6 Luna efforts were independently audited on 2026-10-25 in
T3 Code / Codex, standard tier. The [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md)
records fresh-copy builds/tests, canonical engine probes, desktop/phone
Chromium assertions, scores and supplied generation/isolation context.
All five build and pass their own tests; medium’s browser module graph
cannot start. Historical Luna scores remain unchanged.

Four GPT-6.1 Sol efforts (low, medium, high and xhigh) were audited on
2026-10-25 in T3 Code / Codex, standard tier. Because GPT-6.1 Sol audited
every other run, these four were audited by Claude Opus 5.5 (high effort) to
avoid self-grading, using the same rubric, probes and calibration. The
[GPT-6.1 Sol audit](.audit/gpt61-sol-review.md) records fresh-copy
builds/tests, canonical engine probes, desktop/phone Chromium assertions,
scores and supplied generation/isolation context. All four build, pass their
own tests and start in the browser. High is the second run with no confirmed
bug in the audited scope. Historical Sol scores remain unchanged.

Five GPT-5.6 Terra efforts (low, medium, high, xhigh, max) and two Qwen3.8 Max
efforts (low, medium) were independently audited on 2026-10-25 with the
same rubric. The [Terra audit](.audit/gpt56-terra-review.md) and
[Qwen Max audit](.audit/qwen38-max-review.md) record isolated builds/own
workflows, canonical engine and desktop/phone probes, scores and supplied
isolation facts. All seven build, pass their declared tests and start in
Chromium; Terra medium’s own test executes no engine. Qwen’s unfinished
xhigh is outside this audit. Terra max’s documented external actions are
recorded separately from its delivered-game score. The existing Sol audit was rerun
unchanged as a calibration check; no historical score changed.

Four GPT-5.6 Sol efforts (low, medium, high and xhigh) were independently
audited on 2026-10-25 in T3 Code / Codex, standard tier. The
[GPT-5.6 Sol audit](.audit/gpt56-sol-review.md) records isolated builds/own
suites, canonical engine probes, desktop/phone Chromium assertions, scores
and supplied generation/isolation context. All four build, pass their own
workflows and start in Chromium. Historical Sol Codex/OMP scores stay
8.20/8.30; the new site scores replace them under the existing registry policy.

Three new Claude Opus 5.5 efforts (low, high, xhigh) were independently audited
on 2026-10-26 in T3 Code / Claude Agent SDK, fast mode off. The
[Opus effort audit](.audit/opus55-efforts-review.md) records isolated builds,
unchanged own suites, canonical engine/Chromium assertions, scoring rationale
and supplied no-outside-access facts. All three build/test/start. The existing
medium `opus-5.5` remains **9.05**; no historical score changes.

Beam low/medium and the first Xiaomi MiMo-V2.6-Flash default run were
independently audited on 2026-10-26 in T3 Code / OpenCode, using the same
rubric. The [Beam effort audit](.audit/beam-efforts-review.md) and
[MiMo audit](.audit/mimo-v26-flash-review.md) record isolated builds/own
workflows, exact engine/Chromium findings, coverage, scores and supplied
no-outside-access facts. All three build/test; Beam low has zero own
assertions and Beam medium's CommonJS cannot start in Chromium. Low and
MiMo start. The earlier October `beam` remains **5.60**, unchanged.
MiMo exposes no reasoning options; its recorded variant is **default**.

Six first GPT-6.1 Terra efforts (low through ultra) were independently audited
on 2026-10-26 in T3 Code / Codex, standard tier. The
[Terra 6.1 audit](.audit/gpt61-terra-review.md) records all source/own-suite
reviews, isolated builds, exact engine/Chromium findings and calibrated scores.
All six build/test/start and fit the phone width. Ultra's three tested-agent
subagents and xhigh/max's supplied isolation findings have no score effect.
All 65 historical entries, including both calibration families, are unchanged.

The isolated Claude Opus 5.5 medium rerun, `claude-opus-5-5-medium`, was
audited on 2026-10-27 with the same rubric. The
[medium rerun audit](.audit/opus55-medium-rerun-review.md) records every
source/own-test review, disposable build, exact engine/Chromium finding,
coverage and score. All 13 own cases pass and both browser sizes start.
The original medium `opus-5.5` remains **9.05**, labelled **Claude Opus 5.5
(medium, original)**. Its supplied prior exposure to the repository results
motivated the isolated rerun and has no quality-score effect. All 71
historical scores remain unchanged.

## Ranking

Scores and confirmed bugs are recorded in [`ranking.json`](ranking.json); this table and the README leaderboard are generated from it by `python3 scripts/benchmark.py render`.

<!-- ranking-table:start -->
| Rank | Implementation | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted score | Confirmed bugs |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | GPT-6.1 Sol (high) | 10.0 | 9.0 | 9.0 | 8.5 | 9.0 | **9.35** | 0 |
| 2 | GPT-6.1 Sol (xhigh) | 9.5 | 9.5 | 9.0 | 8.5 | 9.0 | **9.25** | 1 minor |
| 3 | Claude Opus 5.5 (medium, original) | 9.5 | 9.0 | 9.0 | 8.0 | 8.5 | **9.05** | 1 minor |
| 4 | Claude Sonnet 5.5 (xhigh) | 9.5 | 8.5 | 9.0 | 8.0 | 9.0 | **9.00** | 1 minor |
| 5 | GPT-6.1 Sol (medium) | 9.5 | 8.5 | 8.5 | 9.0 | 9.0 | **9.00** | 1 minor |
| 6 | GPT-6.1 Terra (max) | 9.0 | 8.5 | 9.0 | 8.5 | 9.0 | **8.85** | 2 minor |
| 7 | Claude Haiku 5.5 (xhigh) | 9.0 | 8.5 | 9.0 | 8.5 | 8.5 | **8.80** | 2 minor |
| 8 | GPT-6.1 Terra (ultra) | 9.5 | 6.5 | 9.0 | 9.0 | 8.5 | **8.65** | 1 minor |
| 9 | Claude Sonnet 5.5 (high) | 9.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.65** | 2 minor |
| 10 | Luna OMP | 10.0 | 6.5 | 8.5 | 7.0 | 9.0 | **8.60** | 0 |
| 11 | Claude Haiku 5.5 (high) | 9.0 | 7.5 | 9.0 | 8.0 | 8.5 | **8.55** | 2 minor |
| 12 | Gemini-4 | 9.0 | 8.0 | 8.5 | 7.0 | 9.0 | **8.50** | 2 minor |
| 13 | Luna PI | 9.5 | 6.5 | 9.0 | 7.0 | 8.5 | **8.45** | 1 minor |
| 14 | Gemini 4 Argon (high) | 9.0 | 8.0 | 8.5 | 7.0 | 8.5 | **8.45** | 2 minor |
| 15 | Muse Spark 1.3 (medium, reference-assisted) | 9.0 | 7.5 | 8.0 | 8.0 | 9.0 | **8.40** | 2 minor |
| 16 | Claude Opus 5.5 (medium) | 8.5 | 7.5 | 9.0 | 8.5 | 8.5 | **8.40** | 3 minor |
| 17 | Claude Sonnet 5.5 (medium) | 8.5 | 7.5 | 9.0 | 8.5 | 8.0 | **8.35** | 3 minor |
| 18 | Sol OMP | 9.5 | 5.5 | 8.5 | 8.0 | 9.0 | **8.30** | 1 minor |
| 19 | Claude Opus 5.5 (xhigh) | 8.0 | 8.0 | 9.0 | 8.5 | 8.5 | **8.30** | 4 minor |
| 20 | Claude Haiku 5.5 (low) | 9.0 | 6.0 | 9.0 | 8.5 | 8.0 | **8.25** | 2 minor |
| 21 | GPT-6.1 Terra (xhigh) | 8.5 | 6.5 | 9.0 | 9.0 | 8.5 | **8.25** | 3 minor |
| 22 | Claude Haiku 5.5 (max) | 8.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.25** | 4 minor |
| 23 | DeepSeek V4.1 Flash (max) | 8.0 | 8.0 | 9.0 | 7.5 | 9.0 | **8.25** | 4 minor |
| 24 | GLM-5.3-Flash (max) | 8.0 | 7.5 | 9.0 | 8.0 | 9.0 | **8.20** | 1 major, 1 minor |
| 25 | Sol Codex | 8.0 | 6.5 | 9.0 | 9.5 | 9.5 | **8.20** | 1 major, 1 minor |
| 26 | DeepSeek V4.1 Flash (low) | 8.0 | 7.5 | 9.0 | 8.0 | 8.5 | **8.15** | 1 major, 1 minor |
| 27 | GPT-5.6 Sol (xhigh) | 8.0 | 6.5 | 9.0 | 8.0 | 9.0 | **8.00** | 4 minor |
| 28 | GPT-5.6 Sol (high) | 8.0 | 6.0 | 9.0 | 8.5 | 9.0 | **7.95** | 1 major, 1 minor |
| 29 | Claude Opus 5.5 (high) | 7.5 | 7.5 | 9.0 | 8.0 | 8.5 | **7.95** | 5 minor |
| 30 | GPT-6.1 Terra (high) | 8.5 | 6.5 | 7.5 | 9.0 | 8.0 | **7.90** | 3 minor |
| 31 | GLM-5.3-Flash (high) | 7.5 | 7.0 | 9.0 | 8.5 | 8.5 | **7.90** | 5 minor |
| 32 | DeepSeek V4.1 Flash (high) | 7.0 | 8.0 | 9.0 | 8.0 | 8.5 | **7.85** | 1 major, 3 minor |
| 33 | Claude Haiku 5.5 (medium) | 8.0 | 5.5 | 9.0 | 8.5 | 8.5 | **7.80** | 4 minor |
| 34 | Qwen3.8 Max (low) | 7.0 | 7.5 | 9.0 | 8.5 | 8.5 | **7.80** | 1 major, 3 minor |
| 35 | MiMo-V2.6-Flash (default) | 7.0 | 7.5 | 9.0 | 8.5 | 8.5 | **7.80** | 1 major, 3 minor |
| 36 | Claude Opus 5.5 (low) | 7.5 | 6.0 | 9.0 | 9.0 | 8.0 | **7.70** | 5 minor |
| 37 | GPT-6.1 Sol (low) | 8.0 | 7.0 | 7.0 | 8.5 | 8.0 | **7.65** | 4 minor |
| 38 | Qwen3.8 Max (medium) | 7.0 | 7.0 | 9.0 | 8.0 | 8.5 | **7.65** | 1 major, 3 minor |
| 39 | Luna Codex | 7.5 | 7.0 | 8.0 | 7.5 | 8.5 | **7.60** | 1 major, 2 minor |
| 40 | GPT-5.6 Terra (max) | 7.5 | 5.5 | 9.0 | 8.5 | 8.5 | **7.60** | 5 minor |
| 41 | Muse Spark 1.3 (high) | 7.0 | 6.5 | 8.5 | 8.5 | 8.5 | **7.50** | 6 minor |
| 42 | GPT-5.6 Luna (xhigh) | 7.5 | 4.5 | 9.0 | 8.5 | 8.5 | **7.40** | 5 minor |
| 43 | Claude Sonnet 5.5 (low) | 7.0 | 6.0 | 8.5 | 9.0 | 8.0 | **7.40** | 1 major, 3 minor |
| 44 | GPT-5.6 Sol (medium) | 7.0 | 5.5 | 9.0 | 8.5 | 8.5 | **7.40** | 1 major, 3 minor |
| 45 | Cat-jam | 6.5 | 7.5 | 8.5 | 8.0 | 8.0 | **7.40** | 2 major, 1 minor |
| 46 | Muse Spark 1.3 (xhigh) | 7.0 | 6.0 | 8.5 | 8.0 | 8.5 | **7.35** | 1 major, 3 minor |
| 47 | GPT-6.1 Terra (low) | 8.0 | 5.0 | 7.0 | 9.0 | 8.0 | **7.30** | 4 minor |
| 48 | DeepSeek OMP/PI | 6.5 | 8.5 | 8.0 | 7.0 | 7.0 | **7.30** | 2 major, 1 minor |
| 49 | GPT-6 Luna (max) | 6.5 | 5.5 | 9.0 | 8.5 | 9.0 | **7.25** | 1 major, 4 minor |
| 50 | Muse Spark 1.3 (medium) | 6.5 | 5.5 | 8.5 | 8.5 | 8.0 | **7.05** | 1 major, 4 minor |
| 51 | GPT-6.1 Terra (medium) | 7.0 | 5.0 | 7.0 | 8.5 | 8.5 | **6.90** | 6 minor |
| 52 | Space-bunny | 5.5 | 7.5 | 8.0 | 6.5 | 8.0 | **6.75** | 3 major |
| 53 | Muse Spark 1.3 (low) | 5.5 | 6.0 | 8.5 | 8.0 | 8.5 | **6.75** | 2 major, 3 minor |
| 54 | GPT-5.6 Luna (high) | 5.5 | 5.0 | 9.0 | 8.5 | 8.5 | **6.70** | 2 major, 3 minor |
| 55 | Muse Spark 1.3 (minimal) | 6.5 | 4.5 | 7.5 | 8.5 | 8.0 | **6.65** | 1 major, 4 minor |
| 56 | GPT-5.6 Luna (max) | 5.5 | 5.0 | 9.0 | 8.0 | 8.5 | **6.65** | 2 major, 3 minor |
| 57 | GPT-6 Luna (xhigh) | 5.5 | 4.5 | 9.0 | 8.5 | 9.0 | **6.65** | 2 major, 3 minor |
| 58 | GPT-5.6 Terra (xhigh) | 4.5 | 5.5 | 9.0 | 8.5 | 8.5 | **6.40** | 2 major, 5 minor |
| 59 | GPT-6 Luna (high) | 6.0 | 1.5 | 7.5 | 8.5 | 8.5 | **5.90** | 2 major, 2 minor |
| 60 | GPT-6 Luna (low) | 4.5 | 4.0 | 7.0 | 8.5 | 8.0 | **5.65** | 3 major, 2 minor |
| 61 | Beam | 6.0 | 4.5 | 5.0 | 6.5 | 6.5 | **5.60** | 2 major, 2 minor |
| 62 | GPT-5.6 Sol (low) | 3.0 | 4.5 | 8.5 | 9.0 | 8.5 | **5.55** | 3 major, 5 minor |
| 63 | GPT-5.6 Terra (high) | 3.5 | 3.5 | 8.5 | 9.0 | 8.0 | **5.50** | 3 major, 4 minor |
| 64 | GLM-5.3-Flash (low) | 2.0 | 3.5 | 8.5 | 8.5 | 8.0 | **4.85** | 5 major, 1 minor |
| 65 | GPT-5.6 Terra (medium) | 3.0 | 1.5 | 7.5 | 8.5 | 8.0 | **4.65** | 3 major, 5 minor |
| 66 | GPT-5.6 Terra (low) | 2.0 | 4.0 | 7.0 | 8.5 | 8.0 | **4.65** | 3 major, 7 minor |
| 67 | GPT-5.6 Luna (low) | 1.5 | 3.0 | 7.0 | 8.5 | 8.0 | **4.25** | 4 major, 5 minor |
| 68 | GPT-5.6 Luna (medium) | 0.0 | 5.0 | 8.5 | 8.5 | 6.5 | **4.20** | 1 critical, 2 major, 2 minor |
| 69 | Nemotron | 0.0 | 6.0 | 6.5 | 8.5 | 6.5 | **4.00** | 1 critical, 2 major, 2 minor |
| 70 | GPT-6 Luna (medium) | 0.0 | 3.5 | 8.0 | 8.5 | 6.5 | **3.80** | 1 critical, 3 major, 1 minor |
| 71 | Beam (medium) | 0.0 | 3.5 | 8.0 | 8.5 | 6.5 | **3.80** | 1 critical, 4 major, 3 minor |
| 72 | Beam (low) | 0.0 | 0.0 | 7.0 | 9.0 | 6.5 | **2.95** | 7 major, 4 minor |
<!-- ranking-table:end -->

Muse Spark 1.3 has two medium runs: the reference-assisted
[`muse-spark-1.3-medium`](muse-spark-1.3-medium) at **8.40**, which read
Gemini-4's code before writing its own, and the independent from-scratch
[`muse-spark-1.3-contributor-medium`](muse-spark-1.3-contributor-medium) at **7.05**.

The ordering is deterministic. Equal weighted scores are ordered by correctness, tests, then code quality.

### Score calculation

```text
Correctness × 0.40
+ Tests × 0.20
+ Code quality × 0.20
+ Simplicity × 0.10
+ Browser UX × 0.10
```

Example for Luna OMP: `10.0×0.40 + 6.5×0.20 + 8.5×0.20 + 7.0×0.10 + 9.0×0.10 = 8.60`.

## Task conformance

Legend: ✅ conforming in the audited scope; ◐ partially conforming because of the cited defect.

### Original six implementations

| Requirement from `TETRIS.md` | DeepSeek OMP/PI | Luna Codex | Luna OMP | Luna PI | Sol Codex | Sol OMP |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Runs in a browser; TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dependency-free at runtime | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Left/right movement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CW rotation with Up/X | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CCW rotation with Z/Left Ctrl | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hold with C | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Restart with R after game over | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SRS orientations and wall kicks | ✅ | ◐ | ✅ | ✅ | ✅ | ✅ |
| Ghost piece | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hold and next queue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lock delay | ◐ | ✅ | ✅ | ✅ | ◐ | ✅ |
| Guideline scoring | ◐ | ◐ | ✅ | ◐ | ◐ | ◐ |
| Guideline-style gravity and levels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Top-out on blocked spawn | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

“Guideline scoring” was interpreted to include drop points, normal clears, T-spins including mini classification, back-to-back, combos, and perfect clears. A binary full-T-spin implementation is useful but not the complete scoring model requested by the task.

### October imports

`E` means present in engine/source inspection but unavailable in the delivered browser because Nemotron does not start. It is not a browser pass.

| Requirement | Beam | Cat-jam | Gemini-4 | Nemotron | Space-bunny |
|---|:---:|:---:|:---:|:---:|:---:|
| Browser starts after build | ✅ | ✅ | ✅ | ✗ | ✅ |
| TypeScript; dependency-free browser runtime | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ | ✅ | E | ✅ |
| Left/right movement | ✅ | ✅ | ✅ | E | ✅ |
| CW rotation with Up/X | ✅ | ✅ | ✅ | E | ✅ |
| CCW rotation with Z/Left Ctrl | ✅ | ✅ | ✅ | E | ✅ |
| Soft and hard drop controls | ✅ | ✅ | ✅ | E | ✅ |
| Hold with C | ✅ | ✅ | ✅ | E | ✅ |
| Restart with R after game over | ✅ | ✅ | ✅ | E | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | E | ✅ |
| SRS orientations and wall kicks | ✅ | ◐ | ✅ | ◐ | ◐ |
| Ghost piece | ✅ | ✅ | ✅ | E | ◐ |
| Hold and next queue | ✅ | ✅ | ✅ | E | ✅ |
| Lock delay | ◐ | ✅ | ✅ | ◐ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ | ◐ | ◐ |
| Gravity and level progression | ✅ | ✅ | ✅ | E | ✅ |
| Top-out on blocked spawn | ✅ | ✅ | ✅ | E | ✅ |

The scoring profile above retains the original audit's modern scoring expectations, including its perfect-clear bonus. Perfect-clear scoring is a benchmark convention, not a claim that every licensed Tetris version must use that bonus. See the [October evidence](.audit/october-review.md) for rule references, exact reproductions, and grouped deductions.

### October 23 additions

| Requirement | Claude Opus 5.5 (medium, original) | Muse Spark 1.3 (medium, reference-assisted; `muse-spark-1.3-medium`) |
|---|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ |
| Soft and hard drop | ✅ | ✅ |
| C hold and R restart after game over | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ✅ |
| Ghost; hold; next queue | ✅ | ✅ |
| Lock delay and capped resets | ✅ | ✅ |
| Benchmark scoring profile | ✅ | ◐ |
| Gravity, levels and blocked-spawn top-out | ✅ | ✅ |
| Narrow layout preserves a visible playfield | ◐ | ◐ |

### October 24 additions

| Requirement | Haiku 5.5 (low) | Haiku 5.5 (medium) | Haiku 5.5 (high) | Haiku 5.5 (xhigh) | Haiku 5.5 (max) |
|---|:---:|:---:|:---:|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ◐ | ◐ | ◐ |
| C hold and R restart after game over | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ghost; hold; five-piece next queue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lock delay and capped resets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ | ◐ | ◐ |
| Normal gravity, levels and blocked-spawn top-out | ✅ | ✅ | ✅ | ✅ | ✅ |
| Entirely hidden lock-out | ✅ | ◐ | ✅ | ✅ | ◐ |
| Narrow layout preserves a visible playfield | ✅ | ✅ | ◐ | ◐ | ✅ |
| Narrow layout preserves supporting state | ✅ | ◐ | ◐ | ◐ | ◐ |

High, xhigh and max have independently reproduced soft-drop timer transitions: entering
soft drop consumes accumulated normal-gravity time at the faster rate and
awards points for the resulting jump. Normal clears, full/mini spins, B2B and
combos passed the targeted probes. High and xhigh also award the benchmark
single perfect-clear bonus; max omits it. Max's blocked-spawn game over works, but a
whole T locking in hidden rows after legal rotations does not end the game.

Low and medium also reproduce the timer jump and under-award the benchmark's
B2B Tetris perfect clear (3200 instead of 4400 for the final placement).
Low's scaled combined canvas fits the phone viewport. Medium preserves the
board but clips both supporting rails; wholly hidden locks either continue
with the next piece or, after a legal above-board kick, throw while writing
row −1. These hidden-lock manifestations share one minor deduction.

### Claude Sonnet 5.5 additions — October 24

| Requirement | Sonnet 5.5 (low) | Sonnet 5.5 (medium) | Sonnet 5.5 (high) | Sonnet 5.5 (xhigh) |
|---|:---:|:---:|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ◐ | ◐ |
| C hold and R restart after game over | ✅ | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ✅ | ✅ | ✅ |
| Ghost; hold; next queue | ✅ | ✅ | ✅ | ✅ |
| Lock delay, capped resets and ledge handling | ✅ | ✅ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ✅ | ✅ |
| Normal gravity, levels and blocked-spawn top-out | ✅ | ✅ | ✅ | ✅ |
| Entirely hidden lock-out | ◐ | ✅ | ✅ | ✅ |
| Narrow layout preserves a visible playfield | ✅ | ✅ | ✅ | ✅ |
| Narrow layout preserves supporting state | ◐ | ◐ | ◐ | ✅ |

All four reproduce the normal-to-soft timer discontinuity. Low has basic
scoring only; medium supports full/mini spins, B2B and combos but omits the
benchmark perfect-clear bonus. High/xhigh pass those scoring fixtures. Low
continues after a wholly hidden legal lock with the next spawn open. At
390×844, low/medium/high keep the complete board visible but clip sidebars;
xhigh scales its entire canvas and reflows its legend to fit. Low renders
four previews; the others render five. The task does not prescribe a count.

### Gemini 4 Argon (high) — October 24

| Requirement | Gemini 4 Argon (high) |
|---|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ |
| Seven shapes and distinct colors | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ |
| Soft and hard drop | ✅ |
| C hold and R restart after game over | ✅ |
| Seven-bag randomizer | ✅ |
| Canonical SRS states and wall kicks | ✅ |
| Ghost; hold; five-piece next queue | ✅ |
| Lock delay, capped resets and ledge handling | ✅ |
| Benchmark scoring profile | ◐ |
| Normal gravity, levels and blocked-spawn top-out | ✅ |
| Entirely hidden lock-out | ✅ |
| Narrow layout preserves a visible playfield | ✅ |
| Narrow layout preserves supporting state | ◐ |

Full/mini spins, B2B, combos and levels pass the targeted probes, but the
benchmark perfect-clear bonus is absent. Soft drop moves/scores once per
keydown and resets normal gravity time; it has no transition jump in the
800 ms/Down/1 ms fixture. At 390×844 the board fits, while sidebars are clipped.
The [Gemini high record](.audit/gemini-high-review.md) gives exact fixtures.

### Muse contributor additions — October 24

Columns identify `muse-spark-1.3-contributor-{effort}`. **Medium is from
scratch**, distinct from reference-assisted `muse-spark-1.3-medium` above.

| Requirement | minimal | low | medium, from scratch | high | xhigh |
|---|:---:|:---:|:---:|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven canonical shapes and distinct colors | ✅ | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ◐ | ◐ | ◐ |
| C hold and R restart after game over | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ◐ | ✅ | ✅ | ✅ |
| Ghost; hold; five-piece next queue | ✅ | ✅ | ◐ | ✅ | ✅ |
| Lock delay, capped resets and ledge handling | ◐ | ✅ | ✅ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ | ◐ | ◐ |
| Normal gravity, levels and blocked-spawn top-out | ✅ | ✅ | ✅ | ✅ | ✅ |
| Entirely hidden lock-out | ◐ | ✅ | ◐ | ◐ | ◐ |
| Narrow layout preserves a visible playfield | ✅ | ◐ | ✅ | ✅ | ✅ |
| Narrow layout preserves supporting state | ◐ | ✅ | ◐ | ◐ | ◐ |
| Desktop drawing keeps state unobscured and previews complete | ✅ | ◐ | ◐ | ✅ | ✅ |

Low's fixed combined canvas loses 95 px of its board's left side on phones,
although its hold/next region remains visible. The others keep the entire
board and clip sidebars. Low also paints its legend over the board/statistics;
medium-from-scratch clips I previews. Minimal omits action resets and uses
per-frame soft movement; the other four reuse normal time when soft drop
starts. High's initial Down row additionally awards no point. Scoring and
hidden lock-out are reproduced independently in the [audit](.audit/muse-review.md).

### GLM-5.3-Flash additions — October 24

Columns identify `glm-5.3-flash-free-{low,high,max}`.

| Requirement | low | high | max |
|---|:---:|:---:|:---:|
| Browser starts; TypeScript; dependency-free browser runtime | ✅ | ✅ | ✅ |
| Seven canonical shapes and distinct colors | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ✅ |
| C hold once per piece and R restart after game over | ◐ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ✅ | ✅ |
| Ghost; hold; next queue | ◐ | ✅ | ✅ |
| Engine lock delay, capped resets and ledge handling | ✅ | ✅ | ✅ |
| Browser clock advances at high refresh rates | ◐ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ |
| Guideline gravity and levels | ◐ | ✅ | ◐ |
| Blocked-spawn top-out | ◐ | ✅ | ✅ |
| Entirely hidden lock-out | ✅ | ◐ | ✅ |
| Narrow layout preserves a visible playfield | ✅ | ✅ | ✅ |
| Narrow layout preserves supporting state | ✅ | ◐ | ✅ |
| Desktop preview drawing stays complete and separate | ◐ | ✅ | ✅ |

Low disables hold after its first use, runs at least one normal row per fixed
tick, loses frame time (zero ticks at 120 Hz), relocates blocked spawns and
omits advanced scoring/soft points. Its I previews overlap and clip. High
reproduces mini/PC omissions, hidden lock-out, a soft-timer jump and phone
sidebar clipping. Max's full/mini/B2B/combo and hidden lock-out work, but its
gravity table is 267/217 ms at levels one/two and PC bonuses are absent.
Low/max render four previews; high renders five. The task sets no count.
The [GLM record](.audit/glm-review.md) provides exact reproducible fixtures.

### DeepSeek V4.1 Flash additions — October 24

Columns identify `deepseek-v4.1-flash-{low,high,max}`.

| Requirement | low | high | max |
|---|:---:|:---:|:---:|
| Browser starts; TypeScript; dependency-free runtime | ✅ | ✅ | ✅ |
| Seven canonical shapes and distinct colors | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ◐ |
| C hold once per piece; R restart after game over | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ |
| Canonical SRS states and wall/floor kicks | ✅ | ◐ | ✅ |
| Ceiling kicks through the above-top buffer | ✅ | ✅ | ◐ |
| Ghost; hold; five-piece next queue | ✅ | ✅ | ✅ |
| Lock delay and capped action resets | ✅ | ✅ | ◐ |
| Ledge-move mid-air lock safety | ✅ | ✅ | ✅ |
| Benchmark scoring profile, including B2B/PC variants | ◐ | ◐ | ◐ |
| Guideline-style gravity curve and levels | ✅ | ✅ | ✅ |
| Blocked-spawn game over and restart | ✅ | ✅ | ✅ |
| Wholly hidden lock-out | ✅ | ✅ | — |
| Actual browser clock agrees at 60/144 Hz | ✅ | ✅ | ✅ |
| Phone playfield/supporting state fits horizontally | ✅ | ✅ | ✅ |

All three reproduce the 800 ms normal / Down / 1 ms soft transition.
Low loses spin credit on hard drop and has mini/combo/PC errors. High's
I-kick Y signs are inverted; mini B2B and single PC after B2B are wrong.
Max's action cap fails and its B2B Tetris PC uses the ordinary bonus.
Max's “—” means a legal hidden lock is **unavailable**, because its field
rejects all negative cells; the reproduced ceiling-kick defect is deducted
once. High reflows next below the fold and scrolling reaches it fully.
High's 16 ms fast-gravity floor is accepted consistently with earlier engines.
See the [audit](.audit/deepseek-v41-review.md) for exact fixtures and limits.

### GPT-6 Luna additions — October 24

Columns identify `gpt-6-luna-{low,medium,high,xhigh,max}`. `E` means source or
isolated diagnostic evidence in medium, whose build/server fail; it is not a
browser pass. `S` means only unchanged static HTML/CSS was inspected.

| Requirement | low | medium | high | xhigh | max |
|---|:---:|:---:|:---:|:---:|:---:|
| Browser starts after build | ✅ | ✗ | ✅ | ✅ | ✅ |
| TypeScript source; dependency-free runtime design | ✅ | E | ✅ | ✅ | ✅ |
| Seven shapes with distinct colors | ✅ | E | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | E | ✅ | ✅ | ✅ |
| Soft and hard drop | ✅ | E | ✅ | ✅ | ◐ |
| C hold once per piece; R restart after game over | ✅ | E | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | E | ✅ | ✅ | ✅ |
| All 28 canonical states and SRS kicks | ◐ | E: ◐ | ✅ | ◐ | ◐ |
| Obstructed ghost/drop geometry | ✅ | E | ✅ | ✅ | ✅ |
| Hold/next presentation at both widths | ◐ | S: ◐ | ✅ | ◐ | ◐ |
| 499/500 ms lock delay and capped resets | ✅ | E | ◐ | ✅ | ✅ |
| Ledge-move mid-air lock safety | ✅ | E | ✅ | ✅ | ✅ |
| Benchmark scoring, including B2B/PC variants | ◐ | E: ◐ | ◐ | ◐ | ◐ |
| Guideline gravity curve and ten-line levels | ◐ | E: ◐ | ◐ | ◐ | ✅ |
| Blocked-spawn game over and reset | ✅ | E | ✅ | ✅ | ✅ |
| Public-action wholly hidden lock-out | ✅ | E | ✅ | ◐ | ✅ |
| Actual browser falling agrees at 60/144 Hz | ✅ | — | ◐ | ✅ | ✅ |
| Phone board fits horizontally | ✅ | S | ✅ | ✅ | ✅ |

Xhigh's deterministic own bag failure is a test-fixture error: it stacks in
place until blocked spawn after drop 11, then samples an inert game. One
hundred bags through real spawns with the board cleared pass. Medium has
113 build errors and no emitted game; diagnostic transpilation does not fix
or replace its delivery. Max's 16 ms fast-gravity floor is accepted as in
prior audits. High's queue is below the fold but fully reachable by scrolling.
Exact findings and limits are in the [audit](.audit/gpt6-luna-review.md).

### GPT-5.6 Luna additions — October 25

Columns identify `gpt-5.6-luna-{low,medium,high,xhigh,max}`. Medium’s `E`
means emitted-headless-engine evidence only; `S` means static HTML/CSS.
Its delivered browser never starts; neither is a gameplay pass.

| Requirement | low | medium | high | xhigh | max |
|---|:---:|:---:|:---:|:---:|:---:|
| Browser starts after build | ✅ | ✗ | ✅ | ✅ | ✅ |
| TypeScript; dependency-free JS runtime design | ✅ | E | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | E | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW bindings | ✅ | E | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | E: ◐ | ✅ | ◐ | ✅ |
| C hold once per piece and real post-lock swap | ◐ | E | ✅ | ✅ | ✅ |
| Seven-bag and next queue | ✅ | E | ✅ | ✅ | ✅ |
| All 28 canonical SRS states and ordered kicks | ◐ | E | ✅ | ✅ | ◐ |
| Independent obstructed ghost geometry | ✅ | E | ✅ | ✅ | ✅ |
| Ordinary 499/500 ms marked-grounded lock | ✅ | E | ✅ | ✅ | ✅ |
| Natural contact timing and capped action resets | ◐ | E: ◐ | ◐ | ✅ | ✅ |
| Ledge-move mid-air lock safety | ✅ | E | ✅ | ✅ | ✅ |
| Benchmark scoring, including mini/B2B/combo/PC | ◐ | E: ◐ | ◐ | ◐ | ◐ |
| Guideline gravity curve and ten-line levels | ◐ | E: ◐ | ◐ | ✅ | ◐ |
| Public-action wholly hidden lock-out | ◐ | E: ◐ | ◐ | ◐ | ◐ |
| Blocked-spawn game over | ✅ | E | ✅ | ✅ | ✅ |
| Inert game-over drop controls | ◐ | E | ✅ | ✅ | ✅ |
| R restart after game over | ✅ | E | ✅ | ✅ | ✅ |
| Actual browser falling agrees at 60/144 Hz | ◐ | — | ✅ | ✅ | ✅ |
| Phone board fits horizontally | ✅ | S | ✅ | ✅ | ✅ |
| Phone supporting state fits or is scroll-reachable | ◐ | S | ✅ | ✅ | ✅ |
| Next previews remain complete and separate | ✅ | — | ◐ | ✅ | ✅ |
| Active game-over overlay is hidden | ✅ | — | ✅ | ✅ | ◐ |

All builds and own suites pass; medium’s retained CSS import still prevents
browser module evaluation. Low has non-SRS data, broken hold, basic scoring,
a wrong curve and remainder loss. High has false/mini spin and B2B-combo/PC
errors, a NES curve, delayed natural contact and overlapping next rows.
Xhigh’s geometry/gravity/capped locks pass; mini/PC/manual-down spin, soft
transition and hidden locks fail. Max has inverted kick Y, later gravity
divergence, B2B-PC/hidden-lock and overlay defects. All pass ledge safety;
all omit whole-piece lock-out. Exact evidence:
[GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### GPT-6.1 Sol additions — October 25

Columns identify `gpt-6.1-sol-{low,medium,high,xhigh}`.

| Requirement | low | medium | high | xhigh |
|---|:---:|:---:|:---:|:---:|
| Browser starts after build | ✅ | ✅ | ✅ | ✅ |
| TypeScript; dependency-free JS runtime design | ✅ | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW bindings | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ✅ | ✅ | ✅ |
| C hold once per piece and real post-lock swap | ✅ | ✅ | ✅ | ✅ |
| Seven-bag and next queue | ✅ | ✅ | ✅ | ✅ |
| All 28 canonical SRS states and ordered kicks | ✅ | ✅ | ✅ | ✅ |
| Independent obstructed ghost geometry | ✅ | ✅ | ✅ | ✅ |
| Ordinary 499/500 ms marked-grounded lock | ✅ | ✅ | ✅ | ✅ |
| Natural contact timing and capped action resets | ✅ | ✅ | ✅ | ✅ |
| Ledge-move mid-air lock safety | ✅ | ✅ | ✅ | ✅ |
| Benchmark scoring, including mini/B2B/combo/PC | ◐ | ✅ | ✅ | ✅ |
| Guideline gravity curve and ten-line levels | ✅ | ✅ | ✅ | ✅ |
| Public-action wholly hidden lock-out | ◐ | ✅ | ✅ | ✅ |
| Blocked-spawn game over | ✅ | ✅ | ✅ | ✅ |
| Inert game-over drop controls | ✅ | ✅ | ✅ | ✅ |
| R restart after game over | ✅ | ✅ | ✅ | ✅ |
| Actual browser falling agrees at 60/144 Hz | ✅ | ✅ | ✅ | ✅ |
| Phone board fits horizontally | ✅ | ✅ | ✅ | ✅ |
| Phone supporting state fits or is scroll-reachable | ✅ | ✅ | ✅ | ✅ |
| Hold/next previews keep square cells | ◐ | ◐ | ✅ | ✅ |
| Active game-over overlay is hidden | ✅ | ✅ | ✅ | ✅ |
| Space hard-drops after clicking a header control | ✅ | ✅ | ✅ | ◐ |

All four pass the 28-state/48-sequence SRS oracle, 100 engine bags, hold,
seven ghosts, exact lock timing/cap/ledge, the gravity curve (fast floors
accepted) and 60/144 Hz checks. Low misses the B2B Tetris PC variant and
whole-piece hidden lock-out, reuses stale gravity time when soft drop starts
and stretches its previews. Medium's previews are stretched less but visibly.
Xhigh's clicked header buttons keep Space. High passes every probe. Exact
evidence: [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md).

### GPT-5.6 Terra additions — October 25

Columns identify `gpt-5.6-terra-{low,medium,high,xhigh,max}`.

| Requirement | low | medium | high | xhigh | max |
|---|:---:|:---:|:---:|:---:|:---:|
| Build, browser start; TypeScript; dependency-free runtime | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW; Down/Space | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag during play; hold restriction/post-lock retrieval | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fresh seven-piece opening after real game over/R | ✅ | ✅ | ✅ | ◐ | ✅ |
| Fresh gravity/lock accounting for held replacement | ◐ | ◐ | ◐ | ✅ | ✅ |
| All 28 canonical orientation coordinate sets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ordered SRS kick transitions and actual wall/floor kicks | ◐ | ◐ | ◐ | ✅ | ✅ |
| Seven obstructed ghost/drop poses and hard-drop points | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grounded lock/contact timing and reset policy | ◐ | ◐ | ◐ | ◐ | ◐ |
| Ledge-move mid-air lock safety | ✅ | ✅ | ✅ | ✅ | ✅ |
| Benchmark scoring including full/mini/B2B/combo/PC | ◐ | ◐ | ◐ | ◐ | ◐ |
| Guideline gravity curve; ten-line levels | ◐ | ◐ | ◐ | ◐ | ✅ |
| Actual falling agrees at 60/144 Hz | ◐ | ◐ | ◐ | ◐ | ✅ |
| Public-action wholly hidden lock-out | ◐ | ◐ | ◐ | ◐ | ◐ |
| Blocked-spawn game over and real R restart | ✅ | ✅ | ✅ | ✅ | ✅ |
| Terminal browser key guard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Terminal exported-engine method guard | ◐ | ◐ | ✅ | ✅ | ✅ |
| Hold/next painting preserves the intended pieces | ◐ | ✅ | ✅ | ◐ | ◐ |
| Active game-over overlay hidden | ◐ | ✅ | ✅ | ✅ | ✅ |
| Phone playfield fits horizontally | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phone supporting state fits or is scroll-reachable | ◐ | ◐ | ◐ | ✅ | ✅ |

All seven cohort builds/own workflows pass; Terra medium only checks emitted text.
Low/medium reuse generic kick lists; high reverses vertical kick offsets.
Xhigh passes SRS but loses hard-drop spin credit and B2B across no-clear locks.
Low/medium/high/xhigh lose gravity remainder; max preserves it. Every Terra
run omits whole-piece hidden lock-out. Max has canonical SRS/gravity,
working B2B continuity and fresh restart bags, with isolated mini/PC,
landing-contact and phone-preview findings.
High's inherited hold counters are separately probed; low/medium's frame
clock also persists across spawn/hold as part of their gravity/lock policy.
No extra deduction is made for that shared timing observation. Exact
findings and calibrated scores: [Terra audit](.audit/gpt56-terra-review.md).

### Qwen3.8 Max additions — October 25

Columns identify `qwen3.8-max-{low,medium}`. Unfinished xhigh is excluded.

| Requirement | low | medium |
|---|:---:|:---:|
| Build/browser start; TypeScript; dependency-free runtime | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ |
| All required keyboard bindings and R restart | ✅ | ✅ |
| Seven-bag; hold restriction/post-lock retrieval | ✅ | ✅ |
| 28 canonical states and 48 ordered SRS transitions | ✅ | ✅ |
| Seven obstructed ghost/drop poses and exact drop points | ✅ | ✅ |
| 499/500 ms grounded lock; fifteen-reset policy | ◐ | ✅ |
| Ledge-move mid-air lock safety | ✅ | ✅ |
| Benchmark full/mini/B2B/combo/PC scoring | ◐ | ◐ |
| Guideline gravity curve; ten-line levels | ✅ | ✅ |
| Normal-to-soft timing transition | ◐ | ◐ |
| Actual falling agrees at 60/144 Hz | ✅ | ✅ |
| Wholly hidden lock-out and blocked-spawn game over | ✅ | ✅ |
| Partly visible legal lock can continue with open spawn | ✅ | ◐ |
| Terminal engine and browser input guard | ✅ | ✅ |
| Complete hold/five-next painting inside backing | ✅ | ✅ |
| Phone playfield fits horizontally | ✅ | ✅ |
| Phone supporting state fits or is scroll-reachable | ◐ | ◐ |

Low omits spins/B2B/PC; medium supports full/mini spins through timed locks
but cancels them on hard drop and omits PC bonuses. Both reuse 800 ms of
normal time at the soft interval, producing sixteen rows/points in 1 ms.
Low's fifteenth reset locks immediately; medium incorrectly ends partly
hidden locks. Exact evidence: [Qwen Max audit](.audit/qwen38-max-review.md).

### GPT-5.6 Sol additions — October 25

| Requirement | Sol low | Sol medium | Sol high | Sol xhigh |
|---|:---:|:---:|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ✅ | ✅ | ✅ | ✅ |
| C hold; R restart after game over | ◐ | ✅ | ✅ | ✅ |
| Seven-bag; fresh bag after restart | ✅ | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ◐ | ◐ | ✅ | ✅ |
| Ghost; hold; next queue | ◐ | ✅ | ✅ | ✅ |
| Grounded delay, capped resets and ledge safety | ◐ | ✅ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ | ◐ |
| Gravity curve and refresh independence | ◐ | ✅ | ✅ | ✅ |
| Blocked-spawn top-out; inert game-over keys; restart | ✅ | ✅ | ✅ | ✅ |
| Entirely hidden lock-out | ◐ | ◐ | ◐ | ✅ |
| Partially visible lock does not cause premature lock-out | ✅ | ✅ | ✅ | ◐ |
| Phone board and supporting state fit width | ✅ | ✅ | ✅ | ✅ |

All four pass the 800 ms normal / real Down / 1 ms transition (one row/point)
and ledge mid-air safety. Low's held replacement falls after only 200 ms,
its hold preview is distorted, and it lacks capped resets. Medium's four T
states are reversed; high loses spins specifically on hard drop. Xhigh's
phone panels reflow below the board and are scroll-reachable. Exact evidence
and scoring rationale: [GPT-5.6 Sol audit](.audit/gpt56-sol-review.md).

### Claude Opus 5.5 additions — October 26

Columns identify `claude-opus-5-5-{low,high,xhigh}`. The old medium run is unchanged.

| Requirement | low | high | xhigh |
|---|:---:|:---:|:---:|
| Build/browser start; TypeScript; dependency-free runtime | ✅ | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ | ✅ |
| All required real keyboard bindings and R restart | ✅ | ✅ | ✅ |
| Seven-bag; fresh bag after game over/restart | ✅ | ✅ | ✅ |
| Hold restriction/post-lock retrieval/orientation | ✅ | ✅ | ✅ |
| All 28 canonical states and 48 ordered SRS transitions | ✅ | ✅ | ✅ |
| Seven independent obstructed ghosts and exact drop points/cells | ✅ | ✅ | ✅ |
| Ordinary 499/500 ms grounded delay and movement resets | ✅ | ✅ | ✅ |
| Fifteen allowed lock resets | ✅ | ◐ | ◐ |
| Landing frame excludes pre-contact time | ◐ | ◐ | ◐ |
| New lowest row receives fresh lock accounting after exhausted ledge | ◐ | — | — |
| Ordinary ledge-move mid-air lock safety | ✅ | ✅ | ✅ |
| Full/mini spins, B2B/combo and pre-clear level scoring | ✅ | ✅ | ✅ |
| Benchmark perfect-clear bonuses | ◐ | ◐ | ◐ |
| Guideline gravity curve and ten-line levels | ✅ | ✅ | ✅ |
| Normal-to-soft transition | ◐ | ◐ | ✅ |
| Actual browser falling agrees at 60/144 Hz | ✅ | ✅ | ✅ |
| Fresh gravity phase for held replacement | ✅ | ✅ | ✅ |
| Public-action wholly hidden and partly visible lock handling | ✅ | ✅ | ✅ |
| Blocked spawn; inert terminal keys; full R reset | ✅ | ✅ | ✅ |
| Complete proportional preview painting | ✅ | ✅ | ✅ |
| Phone playfield fits horizontally | ✅ | ✅ | ◐ |
| Phone supporting state fits or is scroll-reachable | ◐ | ◐ | ◐ |

Low/high reproduce the sixteen-row soft jump; xhigh resets the phase.
All three omit only PC bonuses in the tested scoring profile and count
pre-contact frame time toward locking. High/xhigh lock on the fifteenth reset;
low preserves stale earlier-contact time after an exhausted ledge descent.
`—` means that exact exhausted-ledge setup is unavailable in high/xhigh
because their earlier cap already locks the piece, not a conformance pass.
Exact fixtures, severity calibration and limits:
[Opus effort audit](.audit/opus55-efforts-review.md).

### Beam efforts and MiMo-V2.6-Flash — October 26

`E` means supported by source/headless diagnostics but unavailable in the
delivered medium browser. It is not a browser pass. `—` means not claimed
or unavailable in that run's delivered feature set.

| Requirement | Beam low | Beam medium | MiMo default |
|---|:---:|:---:|:---:|
| Build; TypeScript; dependency-free browser runtime | ✅ | ✅ | ✅ |
| Delivered browser starts | ✅ | ✗ | ✅ |
| Seven shapes and distinct colors | ✅ | E | ✅ |
| Required move/rotation/drop/C/R bindings | ◐ | E | ✅ |
| Seven-bag permutations | ✅ | E | ✅ |
| Canonical states and SRS wall/floor kicks | ◐ | ◐ | ✅ |
| Ghost projection/drawing | ✗ | E | ✅ |
| Hold restriction/post-lock retrieval/orientation | ✗ | E | ✅ |
| Hold and next presentation | ✗ | ✗ | ✅ |
| Exact drop points/four welded cells | ◐ | E | ✅ |
| Grounded lock delay and capped resets | ◐ | ◐ | ✅ |
| Benchmark full/mini/B2B/combo/PC scoring | ◐ | ◐ | ◐ |
| Guideline gravity curve/ten-line levels | ◐ | ◐ | ✅ |
| Normal-to-soft timing | — | — | ◐ |
| Fresh held replacement gravity phase | — | ◐ | ✅ |
| Public wholly hidden lock-out | — | ◐ | ✅ |
| Public partly visible lock continues | — | — | ✅ |
| Blocked spawn, inert terminal actions and real R | ◐ | E | ✅ |
| Phone playfield/support fit horizontally | ◐ | — | ◐ |
| Combo/B2B text stays inside canvas backing | — | — | ◐ |

Low fails 13 canonical states, has no hold/ghost/next, no drop/advanced
points, different gravity, failed gravity-tick locking and a stopped RAF
after R. Medium's six bad states, generic kicks, basic scoring, NES gravity,
missing previews, hold phase and hidden-lock failure are explicitly source
diagnostics. MiMo passes 28 states/48 actual ordered candidates, 100 actual
bags, independent ghosts, ordinary lock/reset/cap/ledge and hidden/partial
paths, but underpays zero/mini/PC scores and jumps 17 rows on soft entry.
Phone clipping and MiMo's off-backing advanced stats are separate minor
presentation findings. [Exact fixtures and limits](.audit/beam-efforts-review.md).

### GPT-6.1 Terra additions — October 26

Columns identify `gpt-6.1-terra-{low,medium,high,xhigh,max,ultra}`.

| Requirement | low | medium | high | xhigh | max | ultra |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Build/browser start; TypeScript; dependency-free runtime | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven shapes/colors; all required real keyboard bindings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 28 canonical states; 48 ordered SRS transitions; wall/floor kicks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag; hold restriction/retrieval/orientation; fresh restart bag | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven independent obstructed ghosts; exact drop points/cells | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Existing-ground 499/500 ms, resets and fifteen-cap | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Landing frame excludes pre-contact time | ◐ | ◐ | ◐ | ◐ | ✅ | ✅ |
| Ordinary ledge safety | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exhausted ledge gives fresh lower-contact delay | ◐ | ◐ | ◐ | ◐ | ◐ | ✅ |
| Full/mini/B2B/combo scoring; manual descent cancels spin | ◐ | ◐ | ✅ | ◐ | ✅ | ✅ |
| Benchmark perfect-clear variants | ◐ | ◐ | ◐ | ✅ | ✅ | ✅ |
| Guideline curve and ten-line levels (accepted fast floors) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Normal-to-soft timing; 60/144 Hz agreement | ✅ | ◐ | ✅ | ◐ | ✅ | ✅ |
| Wholly hidden lock-out; blocked spawn; real R reset | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Partly visible legal lock can continue | ◐ | ✅ | ◐ | ✅ | ✅ | ✅ |
| Terminal UI and exported engine guards | ✅ | ◐ | ✅ | ✅ | ✅ | ✅ |
| Complete proportional preview painting | ✅ | ◐ | ✅ | ✅ | ◐ | ✅ |
| Phone board/support fit horizontally | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Space hard-drops after clicked Pause/resume | — | ✅ | — | ✅ | ✅ | ◐ |

Low's mini/PC omissions and low/high's partial lock-out are isolated minors.
Low/medium/high/xhigh count landing-frame airborne time; their one-ms early
exhausted-ledge contact is the same finding, not a second deduction. Max
instead retains 490 ms of previous contact across six lower rows, even with
1 ms steps. Medium loses gravity remainder, preserves stale manual-spin
credit, mutates direct hardDrop after game over and stretches previews.
Xhigh has stale-spin and 17-row soft-entry findings. Max's desktop next
stretches; ultra's clicked Pause captures Space. No phone clipping.
[Exact fixtures, scores and limits](.audit/gpt61-terra-review.md).

### Claude Opus 5.5 medium isolated rerun — October 27

Column identifies `claude-opus-5-5-medium`; original medium remains above.

| Requirement | medium rerun |
|---|:---:|
| Build/browser start; TypeScript; dependency-free runtime | ✅ |
| Seven shapes/colors; every required real keyboard binding and R | ✅ |
| 28 canonical states; 48 ordered SRS transitions; actual wall/floor kicks | ✅ |
| 672 actual first-fitting SRS outcomes on independent obstructed fixtures | ✅ |
| Seven-bag; held retrieval/orientation/restriction; fresh restart bag | ✅ |
| Seven independent obstructed ghosts and exact hard-drop points/cells | ✅ |
| Grounded 499/500 ms, successful/failed resets and full fifteenth delay | ✅ |
| Ordinary/exhausted ledge safety and fresh lower-contact delay | ✅ |
| Landing frame excludes pre-contact time | ✅ |
| Full/mini/B2B/combo/drop and pre-clear-level scoring | ✅ |
| Full/mini zero-line scoring in all four T facings; nonadjacent row compaction | ✅ |
| Benchmark perfect-clear bonuses | ◐ |
| Guideline gravity/ten-line levels; 60/144 Hz agreement | ✅ |
| Normal-to-soft transition | ◐ |
| Fresh held replacement gravity phase | ✅ |
| Legal whole-hidden lock-out and partial visible continuation | ✅ |
| Blocked spawn; terminal guards; real R reset; overlays/pause | ✅ |
| Saved pause phases; soft release; real held-key/direction/blur handling | ✅ |
| Complete hold/five-next backing painting | ✅ |
| Phone board fits horizontally | ✅ |
| Phone supporting state fits or is scroll-reachable | ◐ |

Single PC scores100 instead of900; related PC fixtures share one minor.
800 normal ms/Down/1 ms yields16 rows/points. At390 px the300 px board fits
at x45, but hold/stats are off the left and next begins at x383. The other
Opus efforts' premature landing/cap/exhausted-contact findings do not
reproduce here. [Exact fixtures, scores and limits](.audit/opus55-medium-rerun-review.md).

Round 2 independently re-derived all five scores and confirmed all three
minor findings. The additional engine/Chromium assertions above pass at both
sizes; scores, rank16 and all71 historical entries remain unchanged.

## Test-coverage comparison

This compares tested behavior and assertion quality, not merely test-file size or printed test count. `Strong` means the suite makes deterministic, behavior-specific assertions; `Some` means coverage is indirect or incomplete; `—` means no meaningful existing test was found.

| Behavior | DeepSeek OMP/PI | Luna Codex | Luna OMP | Luna PI | Sol Codex | Sol OMP |
|---|---|---|---|---|---|---|
| Seven-bag distribution | Strong: seven bags / 49 draws | Strong | Strong | Strong: two bags | Strong | Strong |
| Movement and drops | Strong | Some | Strong | Some: hard drop via scoring | Strong | Strong |
| Real SRS kick outcomes | Strong: T and I wall kicks | — | Some: rotation state/cell count | Strong: I wall kick | Strong: wall kick | Some: rotation state |
| Ghost piece | Some: hard drop shares ghost projection | — | — | Some: projection relation | — | — |
| Hold and next queue | Strong | Strong | Some | Strong: hold; queue indirect | Some: hold only | Some: hold only |
| Lock delay and reset limit | — | — | — | — | — | — |
| Scoring | Some: drops and normal clears | Strong helpers: normal/T-spin/B2B | Some: line clear | Some: single/perfect clear | Some: line clear | — |
| Gravity/level progression | Strong | Some | Strong, including pause | Some: gravity | — | Some: pause |
| Top-out and restart | Strong | Strong | — | — | Strong | — |
| Browser controls/layout/runtime | — | — | — | — | — | — |

The original six suites are deterministic enough for repeatable smoke testing and are connected to `npm test`. None would catch every confirmed defect: no suite probes moving off a supporting ledge, canonical coordinates for all 28 SRS states, higher-level combo scoring, mini T-spin scoring, responsive overflow, or hidden-overlay rendering.

### October test suites

| Behavior | Beam | Cat-jam | Gemini-4 | Nemotron | Space-bunny |
|---|---|---|---|---|---|
| Seven-bag distribution | Strong: one bag | Strong: one bag | Strong: ten bags | — | Strong: seeded sequence and 700 draws |
| Movement and drops | — | Strong: board and hard drop | Strong: movement and exact drop points | Some: movement/hard drop | Strong: movement and tap/hard-drop points |
| Real SRS kick outcomes | — | Some: state changes and table presence | Strong: concrete T wall kick | Some: rotations succeed | Some: I wall kick; CCW oracle is incorrect |
| Ghost piece | — | Strong: floor projection | Strong: hard drop matches ghost | — | Some: projection; misses collapsed cell coordinates |
| Hold and next queue | Some: initial queue only | Strong | Strong: hold; next indirect | Some: hold | Strong |
| Lock delay and reset limit | — | — | Strong: grounded 500 ms boundary; no reset-cap case | — | Strong: delay, reset cap, pause |
| Scoring | — | Some: normal/combo helpers and single clear | Some: drop points and Tetris | — | Broad integration; incorrect spin/B2B expectations and no level-two combo case |
| Gravity/level progression | — | Some: level helper; long simulation | Some: timer exercised | — | Strong: timing and levels |
| Top-out and restart | — | Strong | Strong: blocked spawn | Some: restart only | Strong |
| Browser controls/layout/runtime | — | — | — | — | — |

Printed counts are 5 tests for Beam, 16 cases for Cat-jam, 7 function groups for Gemini-4, an uncounted assertion script for Nemotron, and 479 checks for Space-bunny. Those units are not directly comparable. Space-bunny has the broadest new suite, but several assertions explicitly encode incorrect behavior, so its raw check count does not earn the highest test-quality score. Nemotron's source tests use `tsx`, which resolves imports differently from the browser and masks the delivery failure.

### October 23 test suites

| Behavior | Claude Opus 5.5 (medium, original): 19 cases | Muse Spark `muse-spark-1.3-medium` (reference-assisted): 7 groups |
|---|---|---|
| Bags and spawning | Strong: seeded ten bags, spawn positions and queue | Strong: seeded ten bags; distinct colors |
| Movement and drops | Strong: walls, exact soft/hard-drop points | Some: movement, soft points and ghost/drop distance |
| SRS | Strong: I states, concrete T wall kick, fixed O cells | Strong: concrete T wall kick; no full coordinate oracle |
| Ghost | Some: shared hard-drop path | Strong: hard-drop distance matches ghost |
| Hold | Strong: swap, once-per-lock, orientation reset | Strong: hold restriction and post-lock availability |
| Lock delay | Strong: exact 499/500 ms boundary and reset cap | Some: grounded delay boundary; no reset-cap case |
| Scoring | Strong: combo, B2B, full/mini T-spins, perfect clear, level crossing | Some: Tetris arms B2B; score uses a loose ≥800 assertion |
| Gravity, top-out, restart and pause | Strong: concrete timings, block/lock out, reset and pause | Some: blocked spawn and timer; no restart/pause assertions |
| Browser loading/layout/input | — | — |

Opus's suite is among the strongest in the current audited set, though its four-cells-per-state test is not a full canonical SRS oracle. Muse's tests were written after reading Gemini-4's tests and preserve important gaps, especially perfect clears and responsive layout. Added audit probes do not increase either implementation's own test-quality score.

### October 24 test suites

| Behavior | Haiku 5.5 (low): 8 cases | Haiku 5.5 (medium): 6 cases | Haiku 5.5 (high): 10 cases | Haiku 5.5 (xhigh): 23 cases | Haiku 5.5 (max): 19 cases |
|---|---|---|---|---|---|
| Bags and spawning | Strong: ten seeded complete bags; spawning indirect | Strong: twenty seeded complete bags; spawning indirect | Strong: three seeded bags; spawning/queue indirect | Strong: twenty seeded bags, colors, exact I/O/T spawns; queue indirect | Strong: three fixed-random bags; spawning/queue indirect |
| Movement and drops | Strong: exact O hard-drop points/cells; no soft-drop or wall assertion | Some: exact points and four locked cells; distance shares ghost; movement only fuzzed | Strong: both walls, exact hard-drop points and locked cells; no soft-drop assertion | Strong: wall/stack blocking, exact soft/hard-drop points and locked cells | Strong: exact soft/hard-drop points, floor cells; walls exercised through kick test |
| SRS | Some: I CW column X values only; no actual kick or coordinate oracle | Some: four-cell counts for all 28 states; rotations fuzzed without geometry assertions | Strong: concrete I wall kick; no canonical coordinate oracle or CCW case | Strong: concrete I kick, exact T CW cells, four-turn cycle for all shapes; no complete oracle/CCW fixture | Strong: concrete I wall kick, all T states and partial I oracle; no complete oracle/CCW fixture |
| Ghost | Some: exact O empty-floor landing row | Some: hard-drop distance derives from ghost; no independent landing oracle | Some: hard-drop distance shares ghost path | Strong: exact empty-floor and obstructed landing rows | Some: exact floor landing row; no independent obstructed geometry |
| Hold | Some: first hold and restriction; no post-lock swap/reset | Some: first hold and restriction; no post-lock swap/reset | Strong: first hold, once-per-lock restriction and post-lock swap | Strong: first hold, restriction and post-lock swap; orientation reset unasserted | Strong: first hold, restriction and post-lock swap; orientation reset unasserted |
| Lock delay | — | — | Some: grounded delay and eventual lock; no exact boundary/reset cap | Strong: exact 499/500 ms boundary and 15-reset cap; no ledge case | Some: move resets delay and eventual lock; no exact boundary/reset cap/ledge case |
| Scoring | Some: exact integrated single and Tetris/B2B start; no advanced assertions | Some: drop points only; clear-row helper without score | Some: exact single/perfect clear and full/mini detection helpers | Strong: exact single, Tetris/B2B/combo, perfect clear, integrated full/mini singles; no B2B break/continuity or level-two combo assertion | Strong helpers: normal/spin tables, combo, B2B/break and level progression; integrated single only; no PC or spin-score integration |
| Gravity, top-out and restart | Some: whole-hidden lock-out; no gravity, levels, blocked spawn or restart | Some: fuzz eventually tops out; no precise gravity, levels, spawn or restart assertion | Some: level-one timing and blocked-spawn/restart; no level progression | Strong: level-one timing, level increase/gravity helper, hidden lock-out and blocked-spawn/restart | Some: level-one timing, level/helper progression and blocked-spawn/restart; no hidden lock-out |
| State robustness | — | Some: twenty seeded playthroughs; nonnegative score/level and board dimensions, no active-cell bounds/non-overlap invariant | — | Strong: seeded 20,000-action play with board/active-cell invariants | — |
| Browser loading/layout/input | — | — | — | — | — |

These are each implementation's own tests. Audit probes do not raise these
scores. Xhigh earns 8.5 for broad integration and deterministic state-invariant
coverage; it remains below Opus's 9.0 because B2B break, exact level-crossing
score and hold orientation reset lack direct assertions. Max earns 8.0 for
broad deterministic helper coverage but fewer integration and timing checks;
high's narrower ten-case suite remains 7.5. No suite tests the soft-drop timer
transition, full 28-state SRS oracle, ledge move or browser layout.

Low earns **6.0** for precise bag, drop, basic scoring and hidden-lock checks,
but no gravity/lock-delay/actual-kick/blocked-spawn/reset assertions. Medium
earns **5.5** for real seeded bags, row shifting, hard-drop points, restricted
hold and modest fuzz invariants; it lacks any exact line/advanced score,
actual kick, independent ghost, timing, level or restart check. All 8/6 own
cases pass. Audit-added probes do not raise either test score.

### Claude Sonnet 5.5 test suites — October 24

| Behavior | Sonnet 5.5 (low): 8 cases | Sonnet 5.5 (medium): 12 cases | Sonnet 5.5 (high): 24 cases | Sonnet 5.5 (xhigh): 25 cases |
|---|---|---|---|---|
| Bags and spawning | Some: only five initial draws, not a complete bag | Strong: two seeded bags; spawn indirect | Strong: five seeded bags; centered spawn/queue | Strong: ten seeded bags, non-consuming peek, exact I/O/T spawns and queue progression |
| Movement and drops | Strong: walls, exact hard-drop points/locked presence; no soft assertion | Strong: walls and exact hard-drop points/cells; no soft assertion | Strong: board bounds, exact hard/soft points/cells | Strong: walls, exact hard/soft points/cells |
| SRS | Some: T rotation number after four turns only | Strong: real I wall kick; cell counts only for geometry | Strong: concrete T kick, blocked I rotation, partial T/O/I coordinates and kick data | Strong: concrete I kick, blocked rotation and partial exact T/I/O coordinates |
| Ghost | Some: shares hard-drop distance path | Strong: L ghost cells match locked cells | Strong: independent obstructed O landing row | Strong: obstructed L ghost cells match locked cells |
| Hold | Some: first hold and restriction only | Strong: restriction and post-lock swap; orientation reset unasserted | Strong: restriction/post-lock swap; orientation reset unasserted | Strong: restriction/post-lock swap; orientation reset unasserted |
| Lock delay | Some: grounded wait and eventual lock; no exact boundary/cap | Some: grounded delay and eventual lock; no exact boundary/cap | Strong: exact 499/500 ms boundary and movement reset; purported cap case does not establish the limit | Strong: 499/501 ms boundary and bounded eventual locking under repeated movement; no exact cap/ledge |
| Scoring | Some: normal single with loose score threshold and exact drop points | Some: exact integrated full-spin double; Tetris score ≥800 only | Strong helpers: normal/full/mini/B2B/combo; integrated Tetris and full-spin/non-spin double; PC untested | Strong integration: perfect-clear single, Tetris/B2B/combo totals/messages and full-spin/non-spin double; minis untested |
| Gravity, top-out and restart | Some: stack-to-top-out/restart; no gravity/level assertions | Some: level increase/faster interval and blocked-spawn/restart | Strong: exact level-one gravity, level helpers, blocked-spawn/restart and pause; hidden lock-out untested | Strong: exact level-one timing, level helpers, hidden lock-out, blocked-spawn/restart guard and pause |
| Input | — | — | — | Strong: deterministic DAS/ARR and direction/release actions |
| Browser loading/layout/real keys | — | — | — | — |

Only implementation-owned assertions earn test credit. Low's nominal bag
test sees only five pieces; its test score is 6.0. Medium's seeded bags,
actual kick, ghost coordinates and integrated full-spin fixture earn 7.5.
High's broader exact timing/board/rule helpers and spin integration earn
8.0. Xhigh's integrated B2B/combo/perfect clear, queue, lock-out and input
coverage earn 8.5, below Opus's 9.0 because mini scoring, B2B break, level
crossing and hold orientation reset lack assertions. None tests the timer
transition, full canonical oracle, ledge move or browser layout. The
[Sonnet record](.audit/sonnet-review.md) details each score and gap.

### Gemini 4 Argon (high) test suite — October 24

| Behavior | Gemini 4 Argon (high): 11 groups |
|---|---|
| Bags and spawning | Strong: ten seven-bag distribution invariants, colors and exact five-item queue/advance; random order is unseeded |
| Movement and drops | Strong: exact wall limits, soft/hard-drop distances and points |
| SRS | Strong: concrete T CW and I CCW wall kicks; four-turn T state cycle; no canonical coordinate oracle |
| Ghost | Strong: exact empty-floor and obstructed landing rows |
| Hold | Strong: first hold, once-per-lock restriction and post-lock swap; orientation reset unasserted |
| Lock delay | Some: 400 ms, grounded move reset and 400+100 ms lock; cap constant checked, cap behavior/ledge absent |
| Scoring | Strong: exact integrated Tetris/B2B/combo totals; no single/double/triple, full/mini spin, B2B continuity/break, higher-level combo or perfect-clear assertions |
| Gravity, top-out and restart | Some: gravity-helper ordering, blocked-spawn/inert-input and R reset; no actual gravity cadence, level increase or hidden lock-out assertion |
| Browser loading/layout/input | — |

The 298 test lines earn 8.0 for meaningful behavior-specific assertions.
The scoring test's broad title exceeds its actual Tetris/B2B coverage; the
reset-cap constant assertion does not test the cap. Added audit probes do
not count as implementation tests. See the [Gemini high record](.audit/gemini-high-review.md).

### Muse contributor test suites — October 24

Columns identify `muse-spark-1.3-contributor-{effort}`; **medium is from
scratch**, not reference-assisted `muse-spark-1.3-medium`.

| Behavior | minimal: 3 groups | low: 11 cases | medium, from scratch: 10 groups | high: 12 cases | xhigh: 14 cases |
|---|---|---|---|---|---|
| Seven-bag distribution | Strong: four fixed-random helper bags | Strong: four seeded bags | Strong: three deterministic bags | Strong: one seeded bag through spawns | Strong: twenty bag-helper invariants |
| Movement and drops | Some: one left move; no hard-drop call | Some: soft points increase; no exact drop | Some: one wall; loose hard points | Some: both walls; loose drop/line points | Some: left wall and positive hard points |
| Real SRS kicks | —: only cell/table counts | —: empty-board rotation state | —: rotation result is boolean | —: I fixture does not force a kick | Some: T floor kick succeeds; no exact offset |
| Ghost | Some: Y is at/below active | Some: lower Y only | Some: Y is at/below active | Some: floor collision below ghost | Some: four cells and collision below |
| Hold/queue | Some: stores kind; manually re-enables hold | Strong restriction; no post-lock swap | Strong restriction; no post-lock swap | Strong restriction/post-lock availability; weak queue | Strong restriction/post-lock availability |
| Lock delay/reset cap | — | Some: eventual locking | — | Strong 100+200+200 ms boundary; no cap/ledge | —: lock assertion ends in lines>=0 |
| Scoring | —: lines>=before, no points | Some: single>=100 and soft increase | Some: hard>=distance*2; forced clear count | Some: single/Tetris lower bounds | Some: single>=100; manually flagged spin helper |
| Gravity/levels | — | Some: high-level eventual lock | —: gravity assertion ends in board!=null | Some: gravity helper ordering | Some: exact level crossing; gravity assertion vacuous |
| Top-out/restart | Some: blocked spawn only | Some: blocked spawn only | Some: blocked spawn only | Strong blocked spawn and reset | Some: blocked spawn only |
| Browser/runtime/layout | — | — | — | — | — |

All own workflows pass, but counts do not equate to coverage. Medium's
gravity assertion and xhigh's gravity/lock assertions can pass with no time
progression. No suite has a complete SRS coordinate oracle, spin-scoring
integration, B2B/combo/perfect-clear integration, reset-cap/ledge, hidden
lock-out or browser assertions. Added audit probes do not earn own-test credit.

### GLM-5.3-Flash test suites — October 24

| Behavior | low: 10 unconditional assertions | high: 14 cases | max: 23 cases |
|---|---|---|---|
| Seven-bag distribution | — | Strong: one unseeded complete bag | Strong: four bag invariants and twenty-bag distribution |
| Movement and drops | —: movement/drop block skips after game over; hard assertion is true | Some: collision helpers and exact hard points; no soft assertion | Strong: wall, exact hard/soft points and welded cells |
| Real SRS kicks | —: selected four-cell counts only | —: selected tables and T/I/O coordinates, no real rotation | Strong: exact I fifth/T third floor kick and blocked rotation; exact T states |
| Ghost | — | Some: hard drop shares projection path | Strong: exact floor row; obstruction untested |
| Hold/queue | Some: initial queue and flags only; second hold does not check piece | Strong: restriction and post-lock availability; no retrieved swap | Strong: restriction and post-lock retrieval; orientation reset unasserted |
| Lock delay/reset cap | — | Some: grounded delay and bounded repeated-move locking; no exact cap/ledge | Some: 300/600 ms lock; no reset/cap/ledge |
| Scoring | Some: clears an already-full row; no point assertions | Some: exact single/drop; manually flagged spin-zero fixture | Strong: integrated double/combo and full/mini spin-zero after real rotation; B2B/PC untested |
| Gravity/levels | —: over-or-piece assertion is vacuous | Strong: 1000 ms falling and formula helpers; no level crossing | Some: table timing and exact ten-line level crossing |
| Top-out/restart | — | Strong blocked spawn and restart; hidden lock-out untested | Strong blocked spawn and restart; hidden lock-out untested |
| Browser/runtime/layout/input | — | — | — |

Low's 79 lines earn **3.5**: movement checks are skipped in the observed
workflows and several assertions cannot establish the named behavior.
High's 167 lines earn **7.0** for meaningful exact drops, gravity, hold,
timing and top-out checks, but no real kicks, ghost or legal spin integration.
Max's 352 lines earn **7.5** for actual kicks and scoring integration; its
hard-drop test incorrectly assumes the next random piece cannot be I.
Seed 16 gives 22 passes / one failure; declared seed 1 gives all 23 passes.
That test-quality limitation is separate from correctness deductions. None
tests the full canonical oracle, ledge behavior, hidden lock-out or browser.
Audit-added probes do not earn own-test credit. See the [GLM audit](.audit/glm-review.md).

### DeepSeek V4.1 Flash test suites — October 24

| Behavior | low: 16 cases | high: 24 cases | max: 19 cases |
|---|---|---|---|
| Bags/spawning | Strong: 25 seeded bags and stable non-consuming peek | Strong: 100 seeded bags, deterministic order, centered spawns/full queue | Strong: four seeded bags and exact spawns |
| Movement/drops | Strong: wall and exact soft points; hard points unasserted | Strong: exact hard/soft points and new spawn | Strong: exact hard/soft distance/points and welded count |
| SRS | Some: four-cell counts/O invariance and real T CCW wall kick | Some: counts/table entries and real T/I floor kicks; I expectations share wrong Y signs | Some: counts and exact T floor kick |
| Ghost | Some: exact empty-floor I row | Some: hard drop shares ghost path; no direct assertion | Some: floor fit/collision below; obstruction absent |
| Hold | Strong: restriction and post-lock retrieval; orientation unasserted | Strong: restriction and post-lock retrieval; orientation unasserted | Some: restriction/post-lock availability, no retrieval |
| Lock delay/cap | Some: 400/600 ms grounded lock; no reset/cap/ledge | Some: grounded delay after soft fall; no reset/cap/ledge | Some: 490/510 ms boundary; no reset/cap/ledge |
| Scoring | Some: exact single/Tetris/B2B/combo and legal timed full-spin single; PC fixtures expect no bonus | Strong helpers: normal/full/mini/B2B/combo/PC; integrated single PC, no integrated spins | Strong: exact single/Tetris/B2B/combo/PC and legal full-spin zero integration; helper mini tables |
| Gravity/levels | Some: level-one falling and monotone helper; no actual level crossing | Some: formula/level helpers, no actual falling cadence/level crossing | Strong: actual level-one cadence, exact L2/L15 curve helpers and ten-line crossing |
| Top-out/restart/pause | Strong: hidden lock-out and restart; blocked spawn untested | Strong: blocked spawn/restart; hidden lock-out untested | Strong: blocked spawn/reset and pause; hidden/ceiling untested |
| Input/browser/layout | — | — | — |

All workflows pass with deterministic own fixtures; no flaky assertion was
found. Tests **7.5/8.0/8.0** reflect assertion strength and integration,
not case counts. None tests the full canonical oracle, precise reset cap,
ledge move, normal-to-soft transition, B2B PC variants, hold orientation or
browser behavior. Audit probes earn no own-test credit. Full rationale is
in the [DeepSeek V4.1 record](.audit/deepseek-v41-review.md).

### GPT-6 Luna test suites — October 24

| Behavior | low: 4 cases | medium: 2 source cases, blocked | high: 5 text checks | xhigh: 2 pass / 1 fail | max: 4 cases |
|---|---|---|---|---|---|
| Bags/spawn/queue | Some: initial active/five previews, no bag | Some: fixed-random bag helper | Text names only | Broken: seed 1234 stacks to game over | Some: exact initial seven-piece bag |
| Movement/drops | Weak: pieces=1, score >=0, next active | — | — | Some: actual hard drop completes a row; no points | Strong: exact hard distance/points and four locked cells |
| SRS/kicks | Weak: four rotations leave an active piece | Weak: one rotation number, no coordinates | Text names only | — | — |
| Ghost | — | — | — | — | Some: hard-drop distance derived from shared ghost method |
| Hold | Some: first/restricted/post-lock availability; no retrieval | — | — | Some: first/restricted/post-lock availability | Some: first/restricted/post-lock availability |
| Lock timing/cap/ledge | — | — | — | — | — |
| Normal/advanced scoring | Vacuous score >=0 | Some: clear helper only; no score | Text name only | Some: actual line count, no score | Exact hard-drop points only |
| Gravity/levels | — | — | — | — | — |
| Top-out/restart | — | — | — | — | Some: actual blocked next spawn; no restart |
| Input/browser/layout | — | — | — | — | — |

Tests **4.0/3.5/1.5/4.5/5.5** reflect assertion strength, not counts or
reasoning labels. Medium's declared `npm test` stops at compilation, so
neither case runs. High only regex-matches HTML/emitted source. Xhigh's
failing bag fixture is not charged as an implementation bug; the unchanged
failure and real randomizer correctness are independently asserted. No own
suite covers precise delay/reset/ledge, gravity/levels, spin/B2B/combo/PC,
hidden lock-out, full SRS, soft timing or browser behavior. Added audit
probes earn no own-test credit. See the [audit](.audit/gpt6-luna-review.md).

### GPT-5.6 Luna test suites — October 25

Only medium has named cases (5). Others are uncounted assertion scripts;
strength of assertions, not printed counts, determines these scores.

| Behavior | low | medium | high | xhigh | max |
|---|---|---|---|---|---|
| Bag/spawn/queue | Initial active/queue only | Strong: one fixed-random bag | Some: bag helper, initial spawn/queue | Some: one real bag invariant, next-spawn order | Some: one real-drop bag, dimensions/queue |
| Movement/drops | Vacuous nonnegative score | Some: move, 4 hard-locked cells, left bound; no points | Some: positive hard score, next active | Some: next type; distance >=0 is vacuous | Some: loose origin bounds both walls |
| SRS/kicks | — | Weak: rotation number only | Weak: 4-cell counts r0/r1 | — | — |
| Independent ghost | — | — | — | — | — |
| Hold | Weak: truthy held type | Some: first/restricted/post-lock availability | Some: first/restricted | Some: first/restricted | Some: first/restricted/post-lock availability |
| Lock timing/cap/ledge | — | — | — | — | — |
| Line/advanced scoring | — | Clear helper only; no score | Clear helper only; no score | Clear helper only; no score | — |
| Gravity/levels | — | — | Weak: helper monotonicity | — | Vacuous: y >= startingY permits no fall |
| Top-out/restart | — | — | — | — | — |
| Real input/browser/layout | — | — | — | — | — |

Tests **3.0/5.0/5.0/4.5/5.0** reflect implementation-owned assertions.
None checks exact SRS/kicks, ghost, integrated scoring, precise clocks/caps/
ledge, levels, hidden lock-out, blocked-spawn/restart, soft timing or the
browser. Medium’s passing tests never load its failing entry graph. Fixed
callbacks/sequences and xhigh’s order-independent bag invariant showed no
seed-dependent own-test failure. Added audit probes earn no own-test credit.
See the [audit](.audit/gpt56-luna-review.md).

### GPT-6.1 Sol test suites — October 25

All four run unchanged `npm test` with `node:test`: **11/16/23/37** cases pass.

| Behavior | low | medium | high | xhigh |
|---|---|---|---|---|
| Bag/spawn/queue | Some: two unseeded initial bags | Strong: consecutive bags | Strong: bags across many refills | Strong: 100 seeded bags, queue |
| Movement/drops | Some: hard-drop distance points and cells | Strong: walls/floor, hard/soft points | Strong: collision incl. hidden buffer, hard/soft points | Strong: walls/cells, exact hard/soft points |
| SRS/kicks | Some: one I wall kick, four-turn cycle | Some: T floor, I wall, blocked rotation | Strong: ordered JLSTZ floor/wall and I kicks, blocked | Strong: T/I wall, T floor, blocked, cycles |
| Independent ghost | Weak: ghost reused as expectation | Some: ghost equals drop distance | Some: non-mutating, lock at ghost | Some: obstructed ghost row, non-mutating |
| Hold | Some: once per piece, post-lock retrieval | Strong: once, spawn orientation | Strong: once, orientation and position | Strong: once, orientation reset, blocked hold spawn |
| Lock timing/cap/ledge | Strong: 500 ms, fifteen-reset cap | Strong: 500 ms, reset, cap | Strong: 500 ms, cap, O-rotation reset | Strong: 499/500 ms, reset, cap, blocked moves |
| Line/advanced scoring | Some: PC single, B2B Tetris+combo | Strong: pre-clear level, B2B, combo, B2B PC 3200, T-spin single | Strong: B2B/combo chain, break, PC, full/mini, T-spin single | Strong: B2B/combo, break, PC incl. B2B PC, full/mini, cancel |
| Gravity/levels | Weak: ten-line crossing only | Some: one-second gravity, crossing | Strong: gravity/soft elapsed time, crossing, frame segmentation | Strong: gravity, monotone curve and cap, crossing, frame rate |
| Top-out/restart | Some: blocked spawn; pause guards | Some: blocked spawn/hold; pause/reset | Strong: blocked spawn, hidden lock-out, restart | Strong: blocked spawn/hold, hidden lock-out, restart |
| Real input/browser/layout | — | — | — | Some: key map, DAS/repeat, blur reset |

Tests **7.0/8.5/9.0/9.5** reflect implementation-owned assertions. No
suite has the complete SRS oracle, the ledge mid-air case, a soft-drop
transition or a browser/layout check. Low's two unseeded cases test
order-independent invariants; repeated runs found no flakiness. Xhigh's
DAS/key-map/frame-rate cases make it the broadest own suite in the
benchmark. Added audit probes earn no own-test credit. See the
[audit](.audit/gpt61-sol-review.md).

### GPT-5.6 Terra test suites — October 25

| Behavior | low: behavioral smoke | medium: text checks | high: behavioral smoke | xhigh: six functions | max: behavioral smoke |
|---|---|---|---|---|---|
| Bags/spawn/queue | Valid initial spawn, five queued; no bag | Names only | Dimensions; Set.size>0 is vacuous | Some: real first bag | Some: one fixed-random opening bag, dimensions/queue |
| Movement/drops | Exact left, four hard cells, exact distance points | Names only | Move true; distance>=0 and score monotonic weak | Boundary; hard drop completes row, score>=100 | Hard replacement only; no exact distance/points/cells |
| Real SRS kicks | — | Names only | — | Some: T CCW wall kick, loose final x | — |
| Independent ghost | — | Name only | — | — | — |
| Hold | — | Name only | First/restricted/post-lock availability; no retrieval | First/restricted; no retrieval | First/restricted/post-lock availability; no retrieval |
| Lock clocks/cap/ledge | — | — | — | — | — |
| Line/advanced scoring | Hard points only | — | Nondecreasing score only | Single/line count; loose points | Legal single/exact line count, score>=100 |
| Gravity/levels | — | — | — | — | Weak: actual fall only; no boundary/levels |
| Top-out/restart | Some: clean score/lines/over reset | — | — | Some: actual blocked spawn; no restart | Some: blocked spawn; no restart |
| Real input/browser/layout | — | — | — | — | — |

Tests **4.0/1.5/3.5/5.5/5.5** reflect assertion strength, not case count or effort.
All workflows pass. Low's order-independent random smoke passed twenty
repeats; other behavioral fixtures use deterministic callbacks. Medium
executes no game logic. None covers clocks, complete SRS, integrated
advanced scoring, independent obstructed ghosts or the browser. Added
audit probes earn no own-test credit. See the [audit](.audit/gpt56-terra-review.md).

### Qwen3.8 Max test suites — October 25

| Behavior | low: 15 cases | medium: 13 cases |
|---|---|---|
| Bags/spawn/queue | Strong: ten seeded bags and refilled queue | Some: two bags and initial queue |
| Movement/drops | Exact hard points/four cells, five soft rows/points | Hard lock/new piece only; exact soft rows/points |
| SRS/kicks | Actual I right-wall kick; blocked T rotation | Actual I left-wall kick |
| Independent ghost | Shared ghost-to-hard expected cells | Empty-floor O only |
| Hold | First/restricted/post-lock retrieval | First/restricted/post-lock retrieval |
| Lock clocks/cap/ledge | Some: 300/600 ms; repeated resets accept cap early lock | Some: 400/600 ms; no reset/cap/ledge |
| Normal/advanced scoring | Exact integrated double and drop points | Exact Tetris and timed T-spin double |
| Gravity/levels | Actual one-second row; helper monotonicity | Exact level-one/two helpers; no actual normal fall |
| Top-out/restart | Blocked spawn, wholly hidden lock, restart | Wholly hidden lock/restart; no blocked spawn |
| Real input/browser/layout | — | — |

Tests **7.5/7.0** reflect the stronger exact hard-drop/board/rotation/reset
coverage in low, despite medium's additional spin case. Both fixed-seed
suites pass. Neither owns a full SRS oracle, mini/B2B/combo/PC integration,
precise reset/ledge/soft transition, higher-level/crossing or browser case.
The default runners assert recorded findings without adding own-test credit.
See the [audit](.audit/qwen38-max-review.md).

### GPT-5.6 Sol test suites — October 25

| Behavior | Sol low: assertion script | Sol medium: 6 cases | Sol high: 6 functions | Sol xhigh: 83 assertions |
|---|---|---|---|---|
| Bags and queue | Some: varied six-piece prefix, not a full bag | Strong: one fixed-random initial bag | Strong: one actual seven-piece bag | Some: bag helper permutation; preset queue/advance |
| Movement and drops | Some: exact right move, locked presence/positive points | Some: exact hard points, locked presence; no wall/soft case | Strong: both walls and exact hard points | Strong: left wall, exact hard points/four cells; no soft case |
| Real SRS kicks | — | — | Some: real T CCW wall kick/in-bounds | Some: real I wall kick/final state/in-bounds |
| Canonical geometry | — | Some: four active cells | — | Some: four distinct cells per state; no coordinate oracle |
| Ghost | — | — | — | Some: shares hard-drop path, no independent projection |
| Hold | Some: stores/restricts first hold | Some: restriction/post-lock availability | Strong: restriction/post-lock retrieval | Strong: restriction/post-lock retrieval |
| Lock boundary/cap/ledge | — | — | — | — |
| Line/advanced scoring | Some: pre-filled four-row clear, loose >=800 | Some: exact legal non-PC single | Some: legal single >=100 | Some: PC single empties board with score >=900 |
| Gravity/levels | — | — | — | Some: interval ordering, actual level-one fall/pause |
| Top-out/restart | — | Some: blocked spawn only | Some: blocked spawn only | Some: blocked spawn only |
| Input/browser/layout | — | — | — | — |

All own suites pass and use fixed callbacks/sequences. Low's 28 test lines,
medium's 56, high's 90 and xhigh's 114 are not used as scoring shortcuts.
Tests **4.5/5.5/6.0/6.5** reflect meaningful assertion breadth: no suite
covers actual lock timing, independent obstructed ghost, full/mini/B2B/combo,
precise gravity curve/levels, hidden/partial lock-out, restart or browser
behavior. Xhigh's 56 cell-count assertions do not establish canonical SRS.
Audit probes earn no own-test credit; [full rationale](.audit/gpt56-sol-review.md).

### Claude Opus 5.5 test suites — October 26

Only implementation-owned tests count. All **11/12/16** deterministic cases pass.

| Behavior | low | high | xhigh |
|---|---|---|---|
| Bag/spawn/queue | Five seeded helper bags; hard-drop next type | Ten helper bags, centered actual spawn/entry/five-next | Twenty helper bags, twelve peek/deal matches, exact T/O/I spawn properties |
| Movement/drops | Both walls; floor presence and positive hard points | Exact T walls, hard points/two welded coordinates | Exact soft rows/points, hard distance points/one cell/next type |
| SRS geometry/kicks | Four-cell counts, four-turn rotation number only | Exact T CCW and I CW wall kicks | Partial exact I/T coordinates/O invariance; exact T/I wall kicks |
| Independent ghost | — | — | —: hard points share ghost projection |
| Hold | First/restricted; no retrieval | First/restricted/post-lock retrieval | First/restricted/post-lock retrieval |
| Lock clocks/cap/ledge | Eventual gravity lock only | Grounded wait, movement reset and eventual lock | Grounded wait/reset; cap assertion expects early fifteenth lock |
| Normal/advanced scoring | Exact legal single/Tetris; PC Tetris expects only 800 | Exact single/Tetris/B2B/combo and full-spin double; PC expects no bonus | Exact Tetris/B2B/combo/full-spin double; PC expects no bonus |
| Gravity/levels | Formula L1 and relative L5/L10 only | Actual one-second row and L1/L2 helper | L1/L2/L15 helper and twelve-line progression; no actual cadence |
| Top-out/restart | Actual stack-to-top-out/reset | Blocked hold spawn, terminal hard drop and reset | Actual hidden lock-out, blocked spawn/inert shift; no restart |
| Input/browser/layout | — | — | — |

Tests **6.0/7.5/8.0** reflect meaningful breadth, not counts. No own suite
covers minis, correct PC variants, B2B break/no-clear continuity,
higher-level combo/pre-clear-level crossing, full canonical oracle,
independent obstructed ghost, precise contact/ledge/soft transition,
held orientation or real input/browser layout. Xhigh's early-cap expectation
receives no cap-conformance credit. Audit probes do not increase these scores.
[Full coverage and rationale](.audit/opus55-efforts-review.md).

### Beam efforts and MiMo-V2.6-Flash own suites — October 26

All declared workflows pass; audit probes do not increase own-test scores.

| Behavior | Beam low | Beam medium | MiMo default |
|---|---|---|---|
| Own workflow | `console.log('ok')`; zero assertions | Four assertions / 16 lines | 76 reported assertions / 385 lines |
| Bag/spawn/queue | — | Active existence only | Ten seeded helper bags; actual centered/top spawn/five next |
| Movement/drop points/cells | — | Exact right move; loose post-drop condition | Both walls; exact soft/hard points and four hard-locked cells |
| SRS geometry/kicks | — | — | Exact actual T/I CW wall kicks; no complete oracle/floor/CCW |
| Independent ghost | — | — | —: hard distance shares board projection |
| Hold | — | — | First/restricted/post-lock storage; no retrieval type/orientation assertion |
| Scoring | — | Full-row helper only | Normal/full helpers and integrated B2B/combo; double injects rotation flag; mini/PC expectations wrong |
| Lock/reset/cap/ledge | — | — | Grounded 400/550 ms wait/lock only |
| Gravity/levels | — | — | L1/L2/order/positive-high-level helpers only |
| Top-out/restart | — | — | Blocked spawn, frozen update and reset |
| Input/render/browser | — | — | Stubbed required keys/default suppression/repeat/R, three renderer states, bounded seeded fuzz; no real browser/layout |

Tests **0.0/3.5/7.5** reflect assertion quality/breadth. Low's successful
build is not a logic test. Medium's Node tests mask its CommonJS browser
failure; no exact drop outcome or game scoring is established. MiMo's
incorrect mini/PC assertions earn no conformance credit; its manually
assigned spin flag is not a real rotation-to-spin test. None covers
independent ghost, full geometry/candidate oracle, exact lock cap/ledge,
soft entry, hidden/partial locks or actual browser layout. Detailed rationale:
[Beam](.audit/beam-efforts-review.md), [MiMo](.audit/mimo-v26-flash-review.md).

### GPT-6.1 Terra own suites — October 26

All unchanged workflows pass. Only delivered own tests earn this credit.

| Behavior | low: 9 assertions | medium: 12 assertions | high: 8 cases | xhigh: 7 cases | max: 10 cases | ultra: 8 cases |
|---|---|---|---|---|---|---|
| Bag/queue | Opening bag | Opening bag | Two actual bags | Two actual bags | Three actual bags/queue length | Two initial queued bags |
| Movement/drops | Exact left; positive hard/any cell | Exact hard points/four cells | Exact hard points/four cells | Left bound; exact hard points/presence | Exact soft/hard points/distance/floor cell | Exact hard points/obstructed floor cells |
| Real SRS/geometry | Rotation number only | CW/CCW numbers, four-cell count | Exact T CCW wall | Exact T CCW wall; 28 unique-cell counts | Exact T CW/I CCW wall, O invariance | Exact T CCW wall |
| Independent ghost | — | — | Shared legality/collision below | Shared legality/collision below | Exact empty O floor row | Exact obstructed O landing row |
| Hold | First/restricted | First/restricted | Post-lock retrieval | Post-lock retrieval | Retrieval/orientation/position/restriction | Post-lock retrieval |
| Lock/contact/cap/ledge | — | — | 499/500 | — | 499/500, reset/fifteen cap, exact contact; no ledge | 499/500 |
| Normal/advanced scoring | Single count, score≥100 | Exact legal single | Crossing single; PC expects100 | Correct PC single/crossing | B2B/combo/B2B-PC/pre-clear level; legal full/mini zero | Exact non-PC single/row shift |
| Gravity/levels | — | — | Ten-line crossing | Ten-line crossing | Actual one-second fall/pause, crossing | — |
| Top-out/restart | — | — | Blocked spawn/reset | Blocked spawn/reset | Blocked hold spawn/hidden pose, pause/reset | Hidden/blocked spawn/reset |
| Input/browser/layout | — | — | — | — | — | — |

Tests **5.0/5.0/6.5/6.5/8.5/6.5** reflect assertion strength and breadth.
Low/medium are narrow behavioral smoke suites. High/xhigh/ultra cover basic
state transitions but omit integrated advanced scoring and precise cap/ledge
coverage. Max has much broader exact scoring/contact/hold tests, comparable
to Sol medium's 8.5, below Sol high's 9.0/Sol xhigh's 9.5. No suite has a
complete canonical/candidate oracle, exhausted ledge, soft entry, actual
browser/layout or real input test. Added audit probes earn no own-test credit.
[Full rationale and gaps](.audit/gpt61-terra-review.md).

### Claude Opus 5.5 medium rerun own suite — October 27

All **13 deterministic node:test cases pass**; audit probes earn no own-test credit.

| Behavior | medium rerun: 158 own test lines |
|---|---|
| Bag/spawn/queue | Ten seeded helper bags; centered actual spawn/immediate entry/five-next count |
| Movement/drop | Exact hard distance points/two welded cells; exact timed soft rows/points; no wall bound |
| Real SRS/geometry | Exact I CW wall kick; blocked rotation; no full geometry/T/floor/CCW oracle |
| Independent ghost | — |
| Hold | First/restricted/post-lock retrieval; orientation unasserted |
| Lock/reset/cap/ledge | Grounded499/501 wait/lock; no reset/cap/contact/ledge |
| Normal/advanced scoring | Exact legal single/row shift; Tetris/B2B/combo/message; real full-spin double; PC expects no bonus |
| Gravity/levels | Actual999/1001 ms gravity; exact L1/L2 helper; no crossing |
| Top-out/restart | Actual stack-to-top-out/reset; no precise blocked/hidden fixture or terminal before/after assertion |
| Input/browser/pause/layout | — |

Tests **7.5** match Opus high/Sonnet medium's meaningful integration,
below original medium's **9.0** broader mini/PC/cap/level/pause coverage.
No minis, B2B break/no-clear continuity, higher-level combo, correct PC,
held orientation, independent ghost, exact cap/ledge/soft-entry or actual
browser assertion exists. The PC Tetris expectation is not PC-conformance
credit. [Full own-test rationale](.audit/opus55-medium-rerun-review.md).

## Per-implementation audit

### 1. GPT-6.1 Sol (high) — 9.35

Run ID: `gpt-6.1-sol-high`. Summary: **Every engine and browser probe passes; Opus-level suite, event-ordered clock and polished responsive UI**.

Scores (correctness/tests/code/simplicity/browser UX): **10.0/9.0/9.0/8.5/9.0**.

Strengths: canonical SRS geometry and all 48 ordered kick sequences, seven-bag with five previews, hold with orientation reset, independent ghost, exact 499/500 ms lock delay, natural contact, fifteen-reset cap, ledge mid-air safety, full/mini T-spins, B2B (including B2B Tetris PC 5200), combos, perfect clears, the Guideline curve, ten-line levels, blocked-spawn and wholly hidden lock-out, inert game over and full restart in [`src/engine.ts`](gpt-6.1-sol-high/src/engine.ts). One event-ordered millisecond clock advances to the next gravity or lock event, so 60/144 Hz agree.

Tests **9.0**: all **23 own cases** pass with exact assertions: bags across refills, collision with the hidden buffer, ordered JLSTZ floor/wall and I kicks, blocked rotation, hold orientation/position, ghost and hard-drop points, soft points, gravity and soft elapsed time, 500 ms lock and fifteen-reset cap, O rotation resets, frame segmentation, B2B/combo chains and breaks, level crossing, perfect clear, full/mini spins, hidden lock-out and restart. Gaps: complete SRS oracle, B2B PC variant, higher-level combo, ledge, soft transition, input and browser checks. This matches Opus's breadth.

Code **9.0**, simplicity **8.5**: **1,022 source TS lines** across a DOM-free engine, renderer and entry. Strict types, injected RNG and the event-ordered clock are clear; the 361-line entry mixes input, audio and DOM state, which adds machinery. UX **9.0**: polished labeled board, ghost, five separate previews, hold dimming, stats/time/progress, pause/sound, clear messages, DAS, blur pause, high-DPI canvases and fitting phone layout with touch controls. Header buttons blur after clicks, so Space still hard-drops.

Confirmed findings:

- **No confirmed bug in the audited scope.** This does not mean the implementation is exhaustively proven correct. Starting soft drop after 800 ms of normal gravity gives one extra row (2 rows/points after real Down plus 1 ms) because fallTime is zeroed after one step rather than consumed. The error is bounded by one 50 ms soft interval, the same as the timer phase any soft-drop clock carries, and unlike the multi-row jumps charged elsewhere. It is recorded, not deducted.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md).

### 2. GPT-6.1 Sol (xhigh) — 9.25

Run ID: `gpt-6.1-sol-xhigh`. Summary: **Every engine probe passes with the broadest own suite; focused header buttons swallow Space**.

Scores (correctness/tests/code/simplicity/browser UX): **9.5/9.5/9.0/8.5/9.0**.

Strengths: every engine probe passes, including all 28 states, 48 kick sequences, hold, ghost, 499/500 ms lock, natural contact, cap, ledge safety, full/mini/B2B/combo/PC (B2B Tetris PC 5200), the Guideline curve with a 1/1.2 ms floor, levels, hidden lock-out, blocked spawn, inert game over and restart. Soft drop resets the gravity timer, so there is no transition jump. Rules live in [`src/engine.ts`](gpt-6.1-sol-xhigh/src/engine.ts) with separate pieces, input, renderer, audio and entry modules.

Tests **9.5**: all **37 own cases** pass. Beyond high's coverage they assert 100 seeded bags, blocked moves not resetting lock, B2B Tetris PC 3200, level-two combo, translation cancelling a spin, a blocked hold spawn, invalid elapsed times, 60/30 Hz equivalence, the full key map and DAS/repeat/blur reset through the real Input class. Gaps: complete SRS oracle, ledge, soft transition and browser/focus checks. This is the broadest own suite in the benchmark.

Code **9.0**, simplicity **8.5**: **752 source TS lines** in six focused modules: precomputed SRS states, a DOM-free engine, own key repeat, high-DPI renderer, Web Audio and an entry with revision-gated DOM updates. Revision counters and the help dialog add some machinery. UX **9.0**: polished labeled board/previews, ghost, lock-progress, clear toasts, time/progress, pause, sound, How to play dialog, blur pause and fitting phone layout with touch controls.

Confirmed findings:

- **Minor (−0.5 correctness): a clicked header button captures Space instead of hard drop.** Mid-game, mouse-click Sound, or How to play then Got it. Focus stays on that button and Input deliberately ignores Space/Enter on focused buttons, so real Space toggles sound back or reopens the help dialog (pausing play); the T does not drop at either size. Play/Pause refocus the board; Sound and the dialog's restored focus do not. Low, medium and high hard-drop in the equivalent check. Scoring effect: `10.0 → 9.5`.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md).

### 3. Claude Opus 5.5 (medium, original) — 9.05

Strengths:

- The most complete new implementation: canonical SRS geometry generated from spawn shapes, correct kick tables, a 40-row internal field, five-piece queue, hold, ghost, extended-placement lock delay, full/mini T-spin scoring, B2B, combos, perfect clears, gravity, block/lock out, and restart in [`src/game.ts`](opus-5.5/src/game.ts).
- A particularly strong deterministic suite with exact scoring and timing assertions, actual kick results, full and mini spin integration, lock-reset limits, restart, and pause. Additional audit probes confirm all 28 SRS states, ledge handling, B2B continuity, level-two combo scoring, and a perfect clear.
- Focused rules, geometry, input, bag, renderer, and entry-point modules. One animation clock drives timing; input handles repeat and focus loss. Desktop rendering is crisp and readable, and the required keyboard flow loads and runs without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): fixed-width layout does not fit a phone-sized viewport.** At 390×844, document width is 760 px; the 300 px board begins at x=230, so much of the board and next panel lie beyond the viewport. Scoring effect: `10.0 → 9.5`.

Test gaps and rationale:

- Existing tests omit browser layout, high-DPI rendering, explicit ghost-cell coordinates, the complete SRS data oracle, and ledge handling. The engine exposes mutable state, which helps deterministic setup but relies on callers respecting invariants.
- At 932 source lines plus 290 test lines, the modules remain proportionate and easy to follow. The desktop layout is polished but restrained and has no touch controls. The mobile finding is deducted once in correctness, not charged again as a separate numerical UX penalty.

### 4. Claude Sonnet 5.5 (xhigh) — 9.00

Strengths:

- Canonical SRS, a 40-row field, seven-bag generation, five previews, ghost, hold, capped lock delay, full/mini scoring, B2B, combos, perfect clears, levels, block/lock out and restart in [`src/game.ts`](claude-sonnet-5-5-xhigh/src/game.ts).
- All 25 own tests pass, including seeded bags/peek, exact spawns/queue, real kick and blocked rotation, drop/ghost cells, hold, grounded delay and bounded eventual locking under repeated movement, integrated B2B/combo/perfect-clear/full-spin totals, hidden lock-out, restart guard/pause and precise DAS/ARR input actions. Equivalent engine probes also pass complete geometry/kicks, ledge safety, full/mini fixtures and higher-level scoring.
- Focused strictly typed modules, injectable piece source, one millisecond clock and focus cleanup. High-DPI drawing, labeled canvas and a complete legend fit desktop and phone; the phone canvas scales to 358 px with no horizontal overflow. Required keys and real R restart work without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): soft drop consumes previous normal-gravity time.** Fifty 16 ms updates leave O at y=19; real ArrowDown plus a 1 ms update moves it to y=35 and awards 16 points. Both engine and browser reproduce the transition. Scoring effect: `10.0 → 9.5`.

Test gaps and rationale:

- Tests 8.5 recognizes broad behavior-specific integration and input coverage. There is no mini-spin assertion, full score-table oracle, B2B break/no-clear continuity, exact level crossing, higher-level combo, hold orientation reset, full geometry, exact reset-cap, ledge, timer-transition or browser test. Opus's stronger scoring suite remains 9.0. Audit probes do not increase the score.
- Code 9.0 and simplicity 8.0 reflect 896 source lines plus 342 test lines across focused and proportionate modules. UX 9.0 reflects clear desktop state, responsive supporting panels/legend, labeled canvas, dimmed used hold and pause; there are no touch controls. The phone board is smaller but fully visible (161.75×323.49 at x≈114.13). The timing defect is charged only to correctness.

See the [Sonnet record](.audit/sonnet-review.md) for the full test rationale, fixtures and browser/isolation evidence.

### 5. GPT-6.1 Sol (medium) — 9.00

Run ID: `gpt-6.1-sol-medium`. Summary: **Every engine probe passes; strong deterministic suite, compact readable engine, touch UI; stretched previews**.

Scores (correctness/tests/code/simplicity/browser UX): **9.5/8.5/8.5/9.0/9.0**.

Strengths: every engine probe passes: 28 states, 48 kick sequences, 100 bags, hold, ghost, 499/500 ms lock, natural contact, cap, ledge safety, full/mini/B2B/combo/PC including B2B Tetris PC 5200, the Guideline curve (5 ms floor), levels, hidden lock-out, blocked spawn, inert game over and reset. Soft drop resets the gravity timer. The 249-line [`src/game.ts`](gpt-6.1-sol-medium/src/game.ts) is DOM-free and steps time in 10 ms substeps.

Tests **8.5**: all **16 own cases** pass: consecutive bags, walls/floor, T floor and I wall kicks, blocked rotation, hold orientation, ghost/hard-drop points, soft points, 500 ms lock, reset and cap, pre-clear level scoring, Tetris/B2B/combo with B2B Tetris PC, a T-spin single, blocked spawn and held spawn, pause/reset and a 250-piece invariant run. Gaps: mini, hidden lock-out, gravity curve, frame rate, ledge, soft transition, input and browser checks.

Code **8.5**, simplicity **9.0**: **452 source TS lines** in two modules. The engine is compact and readable; the 203-line entry combines drawing, audio, input repeat and overlay state with some long lines. UX **9.0**: polished hold/score/progress/legend layout, labeled canvas, ghost, used-hold dimming, messages, pause, sound, DAS, blur/visibility pause and a fitting phone layout with touch controls. The preview defect is charged only to correctness.

Confirmed findings:

- **Minor (−0.5 correctness): hold and next previews are stretched non-uniformly.** Fixed 144×90 hold and 144×310 next backings are drawn into CSS boxes of other proportions. Desktop next is 124×225 px (cell width/height 1.186; hold 1.107), so queued pieces render visibly wide; the phone hold is 77×60 (0.802), so a held O is taller than wide. Measured from bounding boxes and confirmed in screenshots. The 600×1200 board scales uniformly. Scoring effect: `10.0 → 9.5`.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md).

### 6. GPT-6.1 Terra (max) — 8.85

Run ID: `gpt-6.1-terra-max`. Summary: **Broad deterministic suite and event-ordered gravity; exhausted ledge retains old lock time and desktop queue is stretched**.

Scores (correctness/tests/code/simplicity/browser UX): **9.0/8.5/9.0/8.5/9.0**.

- **Minor (−0.5 correctness): A new lowest row retains exhausted lock time.** O r0,(-1,12) on only support(0,14),15 actual CW rotations, wait490 ms, Right off ledge. With1 ms frames floor contact is6000 ms after the move, weld6010, only10 ms later instead of500. Previous-contact lockElapsed=490 survives six new lower rows. Ordinary contact and pre-cap ledge safety pass; real Up/Right and unchanged Chromium RAF agree.
- **Minor (−0.5 correctness): The desktop next preview is stretched non-uniformly.** At1280x800, the next128x240 backing displays128x210 because the short-desktop media rule changes height alone. Cell width/height ratio1.142857 makes squares wide. Hold and phone previews remain proportional; all24 preview cells paint inside the backings.

Correctness: `10 − 2×0.5 = 9.0`. Weighted: `3.60 + 1.70 + 1.80 + 0.85 + 0.90 = 8.85`.

Tests **8.5**: ten seeded cases with precise cap/contact, full/mini zero, B2B/combo/PC and held orientation; all pass. Audit probes do not earn own-test credit. Code **9.0**, simplicity **8.5**, UX **9.0**: readable typed engine with event-ordered clocks and a larger direct UI; custom keyboard/pointer repeat, full responsive state and labels.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 7. Claude Haiku 5.5 (xhigh) — 8.80

Strengths:

- Canonical SRS states/kicks, seven-bag generation, five-piece preview, hold, ghost, capped lock delay, full/mini spin scoring, B2B, combos, perfect clears, levels, blocked-spawn and hidden lock-out in [`src/game.ts`](claude-haiku-5-5-xhigh/src/game.ts).
- All 23 own tests pass in a fresh copy, including exact grounded lock/reset boundaries, integrated full/mini singles, B2B/combo/perfect-clear totals and a seeded 20,000-action board-invariant check. Independent probes confirm all 28 SRS states, both kick directions, real T/I kicks, seven ghost geometries, safe ledge handling, level-two combo 300 and perfect-clear single 900.
- Focused geometry, bag, engine, input, rendering and bootstrap modules. Strict types, one millisecond clock, no runtime dependencies and short direct methods keep the 750 source lines readable. The full desktop keyboard flow works without application asset/runtime errors.

Confirmed bugs:

- **Minor (−0.5 correctness): starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms updates, the O remains at y=2. Send Down through the real Controller handler and advance 1 ms: it jumps to y=18 and earns 16 points. The accumulator is consumed at the new 50 ms interval. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): fixed-width layout clips the phone playfield.** At 390×844, document width is 752 px and the board's 304×604 border box spans x=224–528; next starts at x=552. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- The 310 test lines make precise assertions across most rules, but omit B2B continuity/break, higher-level combo and exact crossing-level score, hold orientation reset, explicit CCW kick fixtures, the complete SRS oracle, ledge handling and browser checks. These coverage gaps determine tests 8.5; the audit's findings are deducted only from correctness.
- Code 9.0 reflects clear boundaries and useful small helpers; public mutable state makes fixtures easy while relying on caller discipline. Simplicity 8.5 reflects restrained machinery across six source modules. Desktop UX 8.5 matches the other Haiku runs' clear board, ghost, supporting state and keyboard legend; previews are visibly enlarged by the panel layout and there are no touch controls or canvas accessibility labels. Phone clipping is charged once in correctness.

Evidence and the port-8321 isolation incident are in the [Haiku audit record](.audit/haiku-review.md).

### 8. GPT-6.1 Terra (ultra) — 8.65

Run ID: `gpt-6.1-terra-ultra`. Summary: **Canonical engine passes audited rules; narrower own suite, responsive UI and clicked Pause capturing Space**.

Scores (correctness/tests/code/simplicity/browser UX): **9.5/6.5/9.0/9.0/8.5**.

- **Minor (−0.5 correctness): A clicked Pause button captures Space instead of hard drop.** Fresh T r0,(3,5), mouse-click Pause twice, then real Space. #pause keeps focus; active pose/score and zero welded cells are unchanged while overlay becomes display:flex as native Space pauses again. Both Chromium sizes reproduce it. Required keys work with board/body focus; all engine probes pass.

Correctness: `10 − 1×0.5 = 9.5`. Weighted: `3.80 + 1.30 + 1.80 + 0.90 + 0.85 = 8.65`.

Tests **6.5**: eight basic cases with obstructed ghost, exact delay and hidden/blocked spawn; all pass. Audit probes do not earn own-test credit. Code **9.0**, simplicity **9.0**, UX **8.5**: readable strict two-module engine with event-ordered time and separate hidden rows; responsive three-preview UI and pointer repeats.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 9. Claude Sonnet 5.5 (high) — 8.65

Strengths:

- Canonical SRS, seven-bag generation, five previews, ghost, hold, capped lock delay, full/mini spins, B2B, combos, perfect clears, levels, blocked-spawn/hidden lock-out and restart in [`src/game.ts`](claude-sonnet-5-5-high/src/game.ts).
- All 24 own tests pass, with exact gravity/drop/grounded-lock assertions, movement reset, actual and blocked kicks, independent obstructed ghost, scoring helpers, full-spin versus ordinary double integration, top-out/restart and pause. Equivalent audit probes pass all 28 states, both kick directions, exact reset cap, ledge safety, level-two combo 300 and perfect-clear single 900.
- Focused board/geometry/bag/scoring/engine/input/renderer modules, strict types, one millisecond clock, DAS/ARR and focus release. Clear high-DPI desktop rendering, complete keyboard legend and working required keys/R restart without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): soft drop consumes previous normal-gravity time.** Fifty 16 ms updates leave O at y=1; real ArrowDown plus a 1 ms update moves it to y=17 and awards 16 points. Engine and browser reproduce the same jump. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): phone sidebars are clipped.** At 390×844, document width is 496 px and the 602 px canvas border box begins at x=−106. The board fits at x=45, but hold/stats begin at x=−85 and next at x=365. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- Tests 8.0 reflects precise timing and broad deterministic helpers/integration, but integrated mini, B2B/combo chains, perfect clears, hidden lock-out, level crossing, higher-level combo, hold orientation reset, complete geometry, ledge and browser checks are absent. The nominal reset-limit case waits a full 500 ms after its last move, so it does not establish a finite cap. These gaps keep it below Opus and the stronger 8.5 suites.
- Code 9.0 and simplicity 8.0 reflect 873 source lines plus 280 test lines with proportionate, readable rules and rendering. UX 8.5 reflects clear hierarchy, ghost/state, pause/banners and a complete legend; no canvas label or touch controls. Phone overflow and the transition defect are each deducted once from correctness.

The [Sonnet record](.audit/sonnet-review.md) contains reproductions and supplied isolation facts.

### 10. Luna OMP — 8.60

Strengths:

- The most complete rules implementation in the audited set: canonical SRS data, kick tables, a capped lock-delay reset policy, hidden-row-aware top-out, full/mini T-spin scoring, back-to-back, combos, perfect clears, hold, and a five-piece preview.
- State is encapsulated behind a clear engine API in [`src/game.ts`](luna-omp/src/game.ts), with deterministic random injection and useful read-only state snapshots.
- Desktop and narrow layouts are polished and readable. The 390 px layout has no horizontal overflow, keeps the board prominent, and the intended server loads all assets without console errors.

Confirmed bugs:

- **No confirmed bug in the audited scope.** This does not mean the implementation is exhaustively proven correct.

Test gaps and rationale:

- Existing tests cover the bag, movement, hard drop, hold, rotation, gravity/pause, dimensions, and a line clear, but do not assert concrete kick offsets, lock-delay timing/reset limits, ghost projection, top-out/restart, advanced scoring, or browser behavior.
- The engine is one of the larger implementations and contains proportionate but substantial rule machinery, which lowers simplicity relative to the compact Sol implementations.

### 11. Claude Haiku 5.5 (high) — 8.55

Strengths:

- Canonical SRS geometry and kick tables, seven-bag generation, a 40-row field, five-piece queue, hold, ghost, capped lock-delay resets, full/mini T-spins, B2B, combos, perfect clears, levels, blocked-spawn/hidden lock-out and restart in [`src/game/game.ts`](claude-haiku-5-5-high/src/game/game.ts).
- Ten deterministic tests pass in a fresh temporary copy. Additional audit probes confirm all 28 coordinate sets, every CW/CCW kick table, concrete T/I wall kicks, ghost/drop geometry, hold, the 499/500 ms lock boundary, reset cap, safe ledge handling, full/mini scoring integration, B2B continuity, a level-two combo of 300, and a single-line perfect clear of 900.
- Focused geometry, board, bag, scoring, engine, input and renderer modules with strict types, one animation clock, keyboard repeat and focus-loss cleanup. Desktop controls respond and application assets/runtime are clean in Playwright/Chromium.

Confirmed bugs:

- **Minor (−0.5 correctness): starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms updates at level one, an O remains at y=18. Press Down through `Input`, advance 1 ms, and it jumps to y=34 with 16 points. `setSoftDrop` leaves the gravity accumulator unchanged, so the next frame consumes the previous 0.8 seconds at the new 50 ms interval. Playwright also observed 12 rows/points during a 120 ms Down hold. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): fixed-width layout clips the playfield on phones.** At 390×844, document width is 758 px; the board's 302×602 px border box starts at x=228 and ends at x=530. The next queue starts at x=554. The fixed flex layout has no narrow-screen reflow. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- Existing tests cover seeded bags, walls, a real I kick, hard-drop points, single/perfect-clear scoring, grounded lock delay, level-one gravity, hold restrictions, blocked spawn/restart and spin-classification helpers. They omit soft drop, the full SRS oracle, independent ghost geometry, exact lock/reset/ledge behavior, spin-score/B2B/combo integration, level progression and browser assertions.
- The 876 source lines and 129 test lines are proportionate and readable. Engine state is private in TypeScript, though the read-only active-piece getter exposes its underlying object. Ten focused tests earn 7.5; broad coverage gaps keep it below Opus's suite. Code earns 9.0 and simplicity 8.0 for clear modules with proportionate rule machinery.
- Browser UX 8.5 reflects the clear desktop board, supporting state and keyboard legend, with no touch controls or canvas accessibility labels. Phone clipping is deducted once in correctness, following Opus's audit. The timer-transition finding is one non-blocking control/scoring defect, not two deductions.

Reproductions, browser measurements and isolation context are in the [Haiku audit record](.audit/haiku-review.md).

### 12. Gemini-4 — 8.50

Strengths:

- The strongest October implementation: all 28 canonical SRS states, correct kick tables, hold and five-piece preview, ghost projection, capped lock-delay resets, full/mini T-spins, back-to-back, combos, pause, high scores, and blocked-spawn/lock-out handling in [`src/engine.ts`](gemini-4/src/engine.ts).
- Clear state snapshots, deterministic test setup APIs, and a clean separation of engine, input, rendering, randomization, and constants. Browser rendering is polished and the keyboard flow completes without application asset or runtime errors.
- Existing tests assert exact drop points, ghost-to-hard-drop agreement, a concrete T wall kick, hold restrictions, a Tetris clear, blocked spawn, and the grounded lock-delay boundary.

Confirmed bugs:

- **Minor (−0.5 correctness): no perfect-clear bonus under the benchmark's scoring profile.** An I piece completing a single-line perfect clear at zero drop distance awards 100 rather than 900. `scorePlacement` has no empty-board/perfect-clear branch. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): supporting panels overflow on narrow screens.** At 390 px, document width is 570 px; hold is at x=−150 and next at x=415. The main board fits, but important state is off-screen. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- The suite lacks mini/full T-spin integration, back-to-back/combo edge cases, perfect clears, reset-cap/ledge timing, restart, and browser checks. The bag test uses random order but asserts invariant distribution.
- At 1,587 source lines, the implementation is substantial; its abstractions remain readable, but the large rule/constant modules lower simplicity relative to the compact engines. Desktop UX is excellent; touch controls are absent.

### 13. Luna PI — 8.45

Strengths:

- A comprehensive engine with canonical SRS orientations and kick tables, a seven-bag, five-piece queue, hold, ghost, a 500 ms lock delay with a 15-reset cap, T-spin mini/full detection, back-to-back, combos, perfect clears, Guideline-style gravity, and blocked-spawn top-out in [`src/game.ts`](luna-pi/src/game.ts).
- The cleanest separation among the larger implementations: board, geometry, randomizer, rules, rendering, and browser input live in focused modules with strong types and defensive handling of invalid time/random input.
- Desktop presentation is polished, the 390 px layout has no horizontal overflow, the full required keyboard sequence works, and the exercised browser flow has no application console errors.

Confirmed bugs:

- **Minor (−0.5 correctness): combo points are multiplied by the level twice.** At level two with one prior consecutive clear, a single should award `100×2 + 50×1×2 = 300`. [`awardLineScore`](luna-pi/src/game.ts) adds an already level-scaled combo bonus to `base`, then multiplies all of `base` by the level, awarding 400. The committed audit probe reproduces the over-award. Scoring effect: correctness `10.0 → 9.5`.

Test gaps and rationale:

- Existing tests cover two seven-bags, line clearing, a concrete I-piece kick, hold, gravity, ghost projection, and single-line perfect-clear scoring. They omit lock-delay timing/reset limits, top-out/restart, T-spins, back-to-back, higher-level combos, the full SRS matrix, and browser behavior.
- At 1,076 source lines it is one of the larger implementations. The modules remain easy to reason about, but the size and complete rule machinery lower simplicity; the mobile layout is also vertically long and has no touch controls.

Detailed evidence is in the [Luna PI audit record](.audit/luna-pi-review.md).

### 14. Gemini 4 Argon (high) — 8.45

Strengths:

- Canonical SRS states/kicks, seven-bag generation, hold/five previews, ghost, capped lock delay, full/mini spins, B2B, combos, gravity, blocked-spawn/hidden lock-out and restart in [`src/game.ts`](gemini-4-argon-contributor-high/src/game.ts).
- All 11 own test groups pass in fresh copies. Independent probes confirm all 28 states, every CW/CCW kick table, concrete T/I kicks, seven ghost/drop geometries, exact lock boundary/reset cap, safe ledge handling, spin integration, B2B continuity/break, level-two combo 300, level crossing and a public-action hidden lock-out.
- Strictly typed, dependency-free rules/input/render modules with copied snapshots and one animation clock. Required desktop keys, overlays and real R restart work without application asset/runtime errors. The soft-drop transition probe moves one row/point, with no accumulated-time jump.

Confirmed bugs:

- **Minor (−0.5 correctness): no benchmark perfect-clear bonus.** A horizontal I at x=3,y=18 fills row 19 at zero drop distance and empties the board, but earns 100 rather than 900. `lockPiece` has no empty-board bonus branch. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): phone sidebars are clipped.** At 390×844, document width is 543 px. The 300×600 board fits at x=35, but hold/stats start at x=−153 and next/controls at x=353; their preview canvases start at x=−128 and x=388. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- Tests 8.0 reflects exact bags/queue, walls, drop points, ghost rows, concrete T/I kicks, hold, grounded delay, Tetris/B2B/combo and blocked-spawn/R assertions. There are no integrated full/mini spins, B2B continuity/break, higher-level combo, perfect clears, actual gravity/level progression, behavioral reset cap/ledge, hidden lock-out, hold orientation reset, complete SRS oracle or browser assertions. The scoring test's title mentions singles/doubles/triples without asserting them.
- Code 8.5 and simplicity 7.0 reflect clear strict modules and snapshots, with public mutable state, redundant aliases, repeated movement code and substantial rule/constant machinery: 1,892 source lines excluding 298 test lines. UX 8.5 reflects polished desktop board/ghost/state, dimmed used hold, full legend, labeled focusable playfield and restart button; input relies on native repeat, with no touch controls or high-DPI scaling. Findings are each deducted only from correctness.

The [Gemini high audit](.audit/gemini-high-review.md) records exact reproductions and the supplied failed-launch/first-attempt/isolation context. Those generation facts have no quality-score effect.

### 15. Muse Spark 1.3 (medium, reference-assisted) — 8.40 — `muse-spark-1.3-medium`

Strengths:

- Correct canonical SRS states/kicks, a seven-bag, hold, five-piece preview, ghost projection, lock delay/reset caps, full/mini spin support, B2B, combos, gravity, top-out, pause and restart. [`src/game.ts`](muse-spark-1.3-medium/src/game.ts) has a clear rules API and copied state snapshots.
- Both declared tests and additional geometry/ledge/B2B/combo probes pass. The desktop game is polished, the core controls respond, and no application asset failures or runtime exceptions appeared in the exercised flow.

Confirmed bugs:

- **Minor (−0.5 correctness): perfect-clear bonus is absent under the benchmark profile.** A zero-distance single-line perfect clear leaves an empty field but awards 100, not 900. The scoring method has no empty-board bonus branch. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): the playfield collapses to 0×0 CSS pixels on a 390 px viewport.** Fixed side columns consume the available grid width and `canvas { max-width:100% }` shrinks the automatic center column to zero. The board is entirely invisible even though desktop play works. This is scored as one responsive-layout defect under the same rubric as earlier narrow-layout findings. Scoring effect: `9.5 → 9.0`.

Test gaps and rationale:

- Seven deterministic groups cover bags, colors, basic input/drop/ghost behavior, a T wall kick, hold, Tetris and a grounded delay/top-out scenario. They omit exact advanced scoring, PC bonuses, reset caps, level progression, restart/pause and browser checks. The Tetris assertion only checks ≥800, so it cannot distinguish some scoring errors.
- The 840-line source is readable and compact. Input/rendering/storage share a large browser bootstrap; an unused repeat timer/comment and local-storage writes every rendered frame lower structural/performance robustness relative to more focused implementations.
- **Reference-assisted:** the child read Gemini-4's implementation and tests before writing this version. This affects efficiency comparability, not the quality score of the delivered code. The separately recorded xhigh parent did setup/delegation and verification; the implementation child used medium reasoning.

### 16. Claude Opus 5.5 (medium) — 8.40

Run ID: `claude-opus-5-5-medium`, the isolated rerun of the original medium run. Scores (correctness/tests/code/simplicity/browser UX): **8.5/7.5/9.0/8.5/8.5**.

Summary: **Canonical SRS and sound audited lock/spin rules; missing PC
bonuses, a soft-drop jump and clipped phone supporting state**.

Confirmed bugs:

- **Minor (−0.5 correctness): benchmark perfect-clear bonuses are absent.** A zero-travel horizontal I at (3,18) empties the board on a single and scores 100, not 900; Tetris and single perfect clears after B2B also miss their bonuses. `applyScore` has no empty-board branch. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): entering soft drop consumes old normal-gravity time.** Fifty 16 ms updates on a fresh O, then `setSoftDrop(true); update(1)` move 16 rows and award 16 points. Real ArrowDown reproduces it at both sizes. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): the fixed phone layout clips hold, stats and next.** At 390×844 the document is 503 px wide; the board fits at x=45, but hold starts at x=−93 and next extends to x=483. Scoring effect: `9.0 → 8.5`.

Test gaps and rationale:

- Tests 7.5: 13 deterministic cases (158 lines) cover seeded bags, spawn/next, one-second gravity, exact hard-drop and single scoring, consecutive Tetris/B2B/combo, a real I kick, blocked rotation, a final-rotation full-spin double, hold, grounded lock timing, soft drop and top-out/reset. The second Tetris asserts 2050, encoding the absent PC bonus. No ghost oracle, wall bounds, T/floor/CCW kicks, minis, reset cap/ledge, hidden lock-out, pause, input or browser assertions.
- Code 9.0 and simplicity 8.5 reflect 787 source lines in six strict modules with a DOM-free engine, injected RNG and one millisecond clock. UX 8.5 reflects a clear board, ghost, hold/five-next previews, legend, overlays and high-DPI setup, without pointer controls or canvas labels. Findings are deducted only from correctness.

The [medium rerun audit](.audit/opus55-medium-rerun-review.md) records exact fixtures, browser measurements and the comparison with the original medium run.

Round 2 independently confirms the three minor severities and all five
scores. Added actual SRS outcome/orientation scoring, compaction, pause/
soft-release and real held-key/blur checks all pass in Node/Chromium;
these audit additions do not increase the own-test score.

### 17. Claude Sonnet 5.5 (medium) — 8.35

Strengths:

- Canonical SRS, seven-bag generation, five rendered previews, ghost, hold, capped lock delay, full/mini spin scoring, B2B, combos, gravity, blocked-spawn/hidden lock-out and restart in [`src/game.ts`](claude-sonnet-5-5-medium/src/game.ts).
- All 12 own tests pass, including two seeded bags, walls, exact hard-drop points, actual I kick, ghost-to-lock coordinates, hold/post-lock swap, level progression, a full-spin double and blocked-spawn/restart. Audit probes independently confirm all states/kicks, ledge safety, advanced scoring and hidden lock-out.
- Clear geometry/engine/renderer/bootstrap boundaries, strict typing, millisecond timing, high-DPI rendering, DAS/ARR and focus cleanup. Required desktop keys and real R restart work with no application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): no benchmark perfect-clear bonus.** A horizontal I at x=3,y=20 fills row 21 at zero drop distance and empties the board, but earns 100 rather than 900. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): soft drop consumes previous normal-gravity time.** After fifty 16 ms updates, real ArrowDown and a 1 ms update move O from y=1 to y=17 and award 16 points. Both engine and browser reproduce it. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): phone sidebars are clipped.** At 390×844, document width is 485 px; the 580 px canvas begins at x=−95. The board fits at x=45, but hold begins at x=−75 and next/stats at x=365. Scoring effect: `9.0 → 8.5`.

Test gaps and rationale:

- Tests 7.5: meaningful bags/kick/ghost/full-spin integration, but Tetris uses ≥800 and there are no mini, B2B/combo, perfect-clear, exact gravity/lock/reset-cap/ledge, hidden lock-out, hold orientation reset or browser assertions.
- Code 9.0 and simplicity 8.5 reflect 622 source lines excluding 147 test lines, direct helpers and proportionate machinery. UX 8.0 reflects clear board/ghost/state with high-DPI blocks; there is no keyboard legend, canvas label or touch control. The six-piece engine queue renders five previews and satisfies the task. Findings are deducted only from correctness.

See the [Sonnet record](.audit/sonnet-review.md) for scores, exact fixtures and browser measurements.

### 18. Sol OMP — 8.30

Strengths:

- A well-structured engine with canonical SRS, a 15-reset lock-delay cap, reliable ledge handling, full queue/hold state, T-spin detection, back-to-back, combos, and perfect-clear bonuses in [`src/game.ts`](sol-omp/src/game.ts).
- Clear state types and restrained abstractions make the implementation easier to follow than its feature count suggests.
- Strong visual presentation on desktop and mobile, with responsive touch controls, no horizontal overflow, clear status information, and no application runtime errors during the exercised flow.

Confirmed bugs:

- **Minor (−0.5 correctness): mini T-spins are not distinguished.** Reproduction: construct a valid mini T-spin position, make rotation the final action, and lock it. [`isTSpin`](sol-omp/src/game.ts) returns only a boolean and [`applyScoring`](sol-omp/src/game.ts) uses the full T-spin table, so a mini receives full-T-spin treatment. Scoring effect: correctness `10.0 → 9.5`.

Test gaps and rationale:

- The compact tests cover bag uniqueness, wall blocking, hard drop, hold, rotation state, and pause, but omit line scoring, actual kick displacement, gravity cadence, ghost/next projection, lock delay, top-out, restart, and the browser.
- The sparse suite is the main reason it ranks below Luna OMP despite excellent implementation quality.

### 19. Claude Opus 5.5 (xhigh) — 8.30

Run ID: `claude-opus-5-5-xhigh`. Scores (correctness/tests/code/simplicity/browser UX): **8.0/8.0/9.0/8.5/8.5**.

Summary: **Canonical core and stronger deterministic suite; missing PC,
contact/reset timing and a clipped phone playfield**.

Tests **8.0**: **219 lines / 16 deterministic cases** check twenty seeded
bags, twelve non-consuming peeks/deals, exact I1/I3/T1/T2 coordinates and
O invariance, exact T spawn/O column/I row, exact T/I real wall kicks,
soft rows/points, hard distance points/one floor cell/next type, grounded
wait/movement reset, reset-count behavior, first/restricted/post-lock held
retrieval, exact consecutive Tetris/B2B/combo points/messages, twelve-line
level progression, legal final-rotation full-spin double, L1/L2/L15 curve
helpers, eleven O drops to hidden lock-out and blocked spawn/inert shift.
The cap test explicitly expects immediate fifteenth-reset locking; the PC
Tetrises expect no bonus. Those assertions earn no conformance credit for
these behaviors. It lacks full shape/kick oracle, independent ghost, minis,
B2B break/no-clear continuity, correct PC, pre-clear level/higher-level combo,
actual gravity cadence, restart/pause, held orientation, ledge/contact/soft
transition, input and browser assertions. Its useful shape/soft/level/hidden
integration exceeds high; missing minis/PC/restart keeps it below Opus
medium **9.0** and Sonnet xhigh/Haiku xhigh **8.5**.

Code **9.0**, simplicity **8.5**: **794 source TS lines**, focused strict
board, shapes, source/randomizer, scoring, game, input, renderer and entry
modules; injectable piece source, clear small methods, one millisecond
clock and no runtime dependencies. Source peeks return copies; active
objects are replaced on movement. The board/state remains mutable for
fixtures. UX **8.5**: clear high-DPI board, complete proportional hold/five
previews, DOM stats, scoring animation, full keyboard legend, custom repeat,
pause and blur pause/release. No labels/pointer controls. Phone clipping
is deducted only from correctness.

Confirmed **minor** findings: missing PC; landing-frame pre-contact time;
fifteenth-reset immediate lock; clipped phone playfield/next.

Confirmed findings (each −0.5 correctness):

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I empties the board with a single but scores 100 instead of 900. Tetris/no-clear/Tetris-PC totals 2000 instead of 5200. Full/mini spins, ordinary B2B/combo and pre-clear level scoring pass; this isolated bonus omission is one minor deduction.
- **Minor: Landing frames charge pre-contact time to lock delay.** O one row above the floor receives 990 ms in <=16 ms parts, then 16 ms, then 484 ms. It welds four cells at absolute 1490 ms instead of 1500; at 1489 it is unlocked. The whole landing-frame delta is charged as grounded. Engine and unchanged Chromium RAF reproduce it; ordinary 499/500 ms locking and pre-cap ledge safety pass.
- **Minor: The fifteenth reset forces an immediate lock.** A floor O receives fifteen alternating successful moves separated by 10 ms. It remains unlocked at 150 ms immediately after the last reset, then welds four cells on update(1) at 151 ms because lockResets>=15 is itself a lock condition. The last allowed reset does not receive its fresh delay; this matches the Qwen low minor finding.
- **Minor: The fixed phone cabinet clips the playfield and next.** At 390x844 document width is 684 px. The 300x600 board starts at x=192 and ends at 492, so part of the field is outside the viewport; next begins at x=527, width 124. Desktop and proportional preview painting work.

Exact fixtures, browser evidence, limits and supplied isolation context: [Opus effort audit](.audit/opus55-efforts-review.md).

### 20. Claude Haiku 5.5 (low) — 8.25

Summary: **Broad core rules; B2B perfect-clear under-award and soft-drop timing jump**.

Scores (correctness/tests/code/simplicity/browser UX): **9.0/6.0/9.0/8.5/8.0**.

All **8 own tests pass**. Tests **6.0** reflects ten complete seeded bags,
partial I CW geometry, exact O hard-drop points/cells, an independent O
floor ghost row, exact integrated single/Tetris scores and B2B start,
first/restricted hold and hidden lock-out. There is no actual kick, full
geometry oracle, wall/soft-drop assertion, post-lock hold retrieval/reset,
lock-delay/cap/ledge, gravity/levels, advanced score, blocked-spawn/restart or
browser check. Code **9.0**, simplicity **8.5**: **681 source TS lines**
across focused geometry, bag, game, rendering and main/input modules; strict
unused checks, seconds throughout, injectable randomizer and direct helpers.
Public mutable state relies on caller discipline. UX **8.0** reflects a clear
grid/ghost, dimmed used hold, five previews, score/lines/level, custom DAS/ARR
and a proportional cabinet that fits the phone. There is no visible keyboard
legend, canvas label, high-DPI rendering, focus cleanup or touch UI.

Confirmed findings:

- **Minor: Starting soft drop reuses accumulated normal-gravity time.** Fifty 16 ms normal updates leave O at y=0; real Down and 1 ms move it to y=16 and award 16 points. The 800 ms accumulator is consumed at the faster interval. Correctness **10.0 → 9.5**.
- **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, no-clear lock, then a zero-distance Tetris PC total 4000 instead of 5200; the final placement awards 3200 instead of 4400. A single PC correctly scores 900. Correctness **9.5 → 9.0**.

Independent probes confirm all 28 SRS states, both kick directions, actual T/I
kicks, 100 seeded bags, hold/queue, all seven obstructed ghost/drop geometries,
499/500 ms lock, fifteen resets, safe ledge handling, normal/full/mini scoring,
B2B continuity/break, level-two combo 300, pre-clear level scoring, normal
curve/levels, hidden lock-out, blocked spawn, inert game over and reinitialization.
Chromium exercises every required key and real R at desktop/phone sizes, and
the unchanged frame callback agrees at 60/144 Hz. The phone document is 390 px;
its playfield is 182.81×365.63 at x=103.59 within the 390×390 cabinet.

Exact evidence and supplied isolation context: [Haiku audit](.audit/haiku-review.md).

### 21. GPT-6.1 Terra (xhigh) — 8.25

Run ID: `gpt-6.1-terra-xhigh`. Summary: **Readable canonical core and complete PC scoring; stale manual spin credit, soft-entry jump and premature landing clock**.

Scores (correctness/tests/code/simplicity/browser UX): **8.5/6.5/9.0/9.0/8.5**.

- **Minor (−0.5 correctness): Landing frames charge pre-contact time to lock delay.** O r0,(3,17), advance990 ms in <=16 ms parts, then16 and483: zero welded cells at1489; another1 ms welds four at1490 instead of1500. Engine and unchanged Chromium RAF agree; ordinary499/500, successful/failed resets, fifteen-cap and pre-cap ledge safety pass.
- **Minor (−0.5 correctness): Manual soft drop preserves stale T-spin credit.** Stack(0,17),(0,19),(2,19), T r0,(0,3), actual CW and successful manual soft drops until grounded r1,(0,17), then zero-travel hard drop:100 extra mini points instead of0. Same corner pose with no rotation credit scores0. Engine and Chromium reproduce it without assigning spin flags.
- **Minor (−0.5 correctness): Starting soft drop consumes accumulated normal-gravity time.** After800 ms normal time in <=16 ms parts, real Down and the next1 ms unchanged RAF move/score17 rows: one immediate step and16 spending stale time at50 ms per row. Engine and both Chromium widths agree.

Correctness: `10 − 3×0.5 = 8.5`. Weighted: `3.40 + 1.30 + 1.80 + 0.90 + 0.85 = 8.25`.

Tests **6.5**: seven basic cases including a PC single and T kick; all pass. Audit probes do not earn own-test credit. Code **9.0**, simplicity **9.0**, UX **8.5**: readable strict two-module engine/entry; labeled responsive five-preview UI, pause/blur pause and phone buttons.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 22. Claude Haiku 5.5 (max) — 8.25

Strengths:

- All 28 canonical SRS states and all CW/CCW kick tables pass, with concrete T/I kick, seven-bag, hold/queue, ghost geometry, hard-drop, 499/500 ms lock boundary, reset-cap and ledge probes against [`src/game.ts`](claude-haiku-5-5-max/src/game.ts).
- All 19 deterministic own tests pass in a fresh copy. Additional integration probes confirm normal clears, full/mini spins, fifth-kick classification, B2B continuity/break, level-two combo 300, level crossing, blocked spawn and restart.
- Focused board, geometry, SRS, bag, scoring, spin, engine, input, renderer and bootstrap modules with strict types and no runtime dependencies. Desktop Chromium loads all assets and responds to the required keyboard flow; canvas labels and device-pixel-ratio sizing improve presentation.

Confirmed bugs:

- **Minor (−0.5 correctness): no perfect-clear bonus under the benchmark scoring profile.** A horizontal I completing row 21 at zero drop distance clears the board but awards 100 rather than 900. There is no empty-board scoring branch. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): an entirely hidden lock does not end the game.** Use T,I and blockers at (2,2), (3,3), (4,3). From the actual T spawn, CW uses SRS test 3 to reach x=2,y=0; CCW returns to orientation 0 at that position. The ghost is y=0. Hard drop locks all four T cells in hidden rows 0–1, but the unblocked I spawns and status remains playing. Blocked-spawn top-out still works; this is a specific edge-case lock-out omission. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): starting soft drop reuses accumulated normal-gravity time.** Fifty 16 ms updates leave the O at y=1. Down through Controls followed by 1 ms jumps it to y=17 and adds 16 points. Scoring effect: `9.0 → 8.5`.
- **Minor (−0.5 correctness): supporting state overflows the phone viewport.** At 390×844, document width is 596 px. The board remains visible at x=18, but the sidebar begins at x=340 and both hold and next canvases at x=424; previews and right-aligned scores are off-screen. Scoring effect: `8.5 → 8.0`.

Test gaps and rationale:

- Tests 8.0 reflects broad deterministic helper assertions, exact drops, a real I kick, hold, grounded delay and blocked-spawn/restart. The 239 test lines omit spin-scoring integration, perfect clears, hidden lock-out, exact lock boundary/reset cap, ledge timing, higher-level combo, the full SRS oracle and browser behavior. The added probes do not count as own tests.
- Code 9.0 and simplicity 8.0 reflect clear, proportionate rules modules (955 source lines). Read-only getters expose underlying active/queue objects, as in high. UX 8.5 reflects clean desktop hierarchy, readable controls, high-DPI rendering and canvas labels; there are no touch controls. Each confirmed finding is deducted only from correctness.

Exact probes, browser measurements and isolation context are in the [Haiku audit record](.audit/haiku-review.md).

### 23. DeepSeek V4.1 Flash (max) — 8.25

Run ID: `deepseek-v4.1-flash-max`. Summary: **Broad scoring and fitting UI; unlimited lock resets, ceiling-buffer and B2B-PC gaps, soft-drop jump**.

The independent probes for [`src/game.ts`](deepseek-v4.1-flash-max/src/game.ts) pass all 28 canonical shape states, ten seeded engine bags, hold/queue, seven obstructed ghosts/drop coordinates, ordinary grounded locking, the ledge-move mid-air safety fixture, levels, blocked spawn and restart. Its delivered field prevents legal hidden placements; the ceiling fixture below records that limitation. Required desktop/phone keys and real R restart work without application errors. The confirmed exceptions follow.

Confirmed bugs:

- **Minor (−0.5 correctness): Grounded actions reset lock timing after the fifteen-reset cap.** An O on the floor survives thirty alternating moves after 490 ms waits and a further 490 ms/move/10 ms (15.2 seconds total), with no locked cells. lockResets stops at 15, but touchLockDelay resets lockTimer unconditionally. The ordinary 499/500 ms boundary and ledge mid-air safety work. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): The missing above-top buffer rejects legal ceiling SRS kicks.** From the actual T spawn at rotation 0,x=3,y=0, add blockers (4,2),(3,2). Canonical CW test 3 fits at rotation 1,x=2,y=-1, but rotate(1) returns false and leaves the T unchanged because canPlace rejects every negative cell. The 20-row field has no hidden-buffer/whole-hidden-lock path; this is one ceiling/buffer fidelity finding, with no separate hidden-lock-out deduction. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): B2B Tetris perfect clears omit the larger benchmark bonus.** Tetris, a no-clear lock to reset combo, then a zero-distance Tetris perfect clear yields 4000 total instead of 5200. The final placement awards 3200 (1200 B2B clear + 2000 ordinary PC), instead of 4400 (1200 + 3200 B2B PC). Ordinary 900-point single perfect clear and normal B2B/combo scoring pass. Scoring effect: `9.0 → 8.5`.
- **Minor (−0.5 correctness): Starting soft drop consumes accumulated normal-gravity time.** Fifty update(0.016) calls leave O at y=0 with 0.8 seconds accumulated. Enable soft drop and update(0.001): it moves to y=16 and earns 16 points. Chromium real ArrowDown independently reproduces the same transition; ordinary 100 ms soft movement awards two points. Scoring effect: `8.5 → 8.0`.

Test gaps and rationale:

Tests **8.0**: **19 cases / 351 lines** cover four seeded bag invariants,
four-cell counts/spawns, a concrete T floor kick, exact level-one cadence
and level-two/fifteen equation values, soft/hard distances and points,
grounded delay, hold restriction/post-lock availability, integrated single,
Tetris/B2B/combo, legal full-spin zero-clear, PC single and exact ten-line
level crossing, blocked spawn, pause/resume, floor ghost and reset. Pure
score helpers cover normal/full/mini line values. There is no integrated
mini, B2B continuity/break or B2B PC assertion, post-lock held-piece retrieval/
orientation reset, exact reset-cap/ledge, ceiling/hidden state, obstructed
ghost, complete SRS oracle, input or browser test. This earns the same 8.0
as Haiku max's broad but incomplete integration coverage.

Code **9.0**, simplicity **7.5**: **1,562 source TS lines**, focused geometry,
randomizer, pure rules, game, input, renderer and bootstrap modules, strict
unused/return checks, seconds throughout, deterministic options and no
runtime dependencies. The event callback separates UI effects from rules;
storage is guarded. Public mutable state, repeated spawn/hold initialization,
a substantial main/HUD cache and effect renderer add proportionate machinery.
UX **9.0** reflects clear high-DPI grid/glowing blocks/ghost, dimmed used
hold, five complete previews, labeled canvases, DOM score/streak/progress,
full required keyboard bindings, visible legend, pause, best-score storage,
restart button and responsive phone rails. The phone board is 174×348 and
all supporting state fits. Left Ctrl works although the visible legend
lists Z only for CCW. No touch controls are provided.

Each finding is deducted once from correctness. See the [DeepSeek V4.1 audit](.audit/deepseek-v41-review.md) for exact fixtures, browser measurements and supplied isolation context.

### 24. GLM-5.3-Flash (max) — 8.20

Run ID: `glm-5.3-flash-free-max`. Summary: **Broad rules and responsive UI; wrong gravity curve and no perfect-clear bonus**.

Strengths:

All 28 canonical states, kick tables and actual kicks, ten actual seeded bags, hold, queue, seven obstructed ghosts/drops, exact lock boundary/reset cap/ledge safety, full/mini/B2B/combo scoring, hidden lock-out and blocked-spawn/restart pass in [`src/game.ts`](glm-5.3-flash-free-max/src/game.ts). A labeled high-DPI canvas scales the complete board, state and legend to fit desktop and phone, and all required keys/real R work without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): Gravity uses an unrelated fast table instead of the Guideline curve.** In frame-sized updates, level-one O stays at its starting row for 266 ms and falls on the next millisecond; level two falls at 217 ms. The established Guideline profile requires 1000/793 ms. GRAVITY_MS_BY_LEVEL starts 267,217,167 rather than deriving the Guideline curve, making ordinary play substantially too fast throughout these levels. Levels still advance every ten lines. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): Perfect-clear bonus is absent under the benchmark profile.** Fill row 21 except x=3..6, place horizontal I at x=3,y=20 and hard drop at zero distance. The board becomes empty and lines becomes one, but score is 100 instead of 900. Normal/full/mini/B2B/combo scoring passes the targeted fixtures. Scoring effect: `8.5 → 8.0`.

Test gaps and rationale:

Tests **7.5**: 23 cases / 352 lines cover bag invariants/distribution, board shifting, exact T states, real I/T floor kicks and blocked rotation, exact drops, floor ghost, hold restriction/post-lock retrieval, eventual grounded lock, blocked spawn/restart, integrated double/combo, level crossing and legal full/mini zero-spin integration plus fifth-kick helper. They omit B2B/PC, precise boundary/reset cap/ledge, obstructed ghost, hidden lock-out, hold orientation and browser/input checks. A random-dependent hard-drop assertion rejects a legitimate next I: seed 16 yields 22 passes / one failure; the runner declares passing seed 1 and separately asserts that failure. This affects tests, not correctness.

Code **9.0**, simplicity **8.0**: 1,121 source TS lines in focused typed modules, DOM-free rules, small direct helpers and separate normal/soft accumulators. Mutable state, repeated setup and reset/restart aliases add modest weight. UX **9.0** reflects responsive high-DPI rendering, canvas label, complete legend, ghost/grid, dimmed hold and scoring messages. Four previews satisfy the unspecified queue count. Phone text shrinks with the canvas; no touch controls are supplied.

Exact reproducible fixtures, browser measurements and generation/isolation context are in the [GLM audit](.audit/glm-review.md).

### 25. Sol Codex — 8.20

Strengths:

- By far the smallest engine in the set while retaining canonical shapes and SRS kicks, queue/hold, ghost, advanced scoring, and a clean state model in [`src/game.ts`](sol-codex/src/game.ts).
- Excellent local readability: short methods, few layers, no runtime dependencies, and little duplication.
- The best narrow-screen interaction design in this audit. At 390 px the page has no horizontal overflow and provides large visible touch controls while preserving the board, hold, next, and score displays.

Confirmed bugs:

- **Major (−1.5 correctness): stale lock timing can lock an airborne piece after a ledge move.** Reproduction: let a piece become grounded on a small support, wait close to 500 ms, then move it sideways so it can fall. `move`/`rotate` update `groundedAt` rather than clearing it when the piece becomes airborne; the animation loop can call `lock()` from the stale timestamp before gravity moves the piece. The isolated engine/source probe reproduced the stale state and the browser-loop lock path. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): mini T-spins are not distinguished.** [`isTSpin`](sol-codex/src/game.ts) is binary and all recognized spins use the full table. Scoring effect: `8.5 → 8.0`.

Test gaps and rationale:

- Tests cover bag behavior, hard drop, line clear, hold, a wall kick, and blocked-spawn top-out. They do not cover gravity, next/ghost output, lock delay, scoring beyond a normal clear, restart, or browser behavior.
- The serious ledge defect holds correctness below the two OMP implementations; otherwise this is the clearest and most maintainable codebase in the set.

### 26. DeepSeek V4.1 Flash (low) — 8.15

Run ID: `deepseek-v4.1-flash-low`. Summary: **Canonical core and responsive UI; hard-drop spin loss, incomplete scoring and soft-drop timing jump**.

The independent probes for [`src/game.ts`](deepseek-v4.1-flash-low/src/game.ts) pass all 28 canonical shape states, ten seeded engine bags, hold/queue, seven obstructed ghosts/drop coordinates, ordinary grounded locking, the ledge-move mid-air safety fixture, levels, blocked spawn and restart. Public-action hidden lock-out also passes. Required desktop/phone keys and real R restart work without application errors. The confirmed exceptions follow.

Confirmed bugs:

- **Major (−1.5 correctness): Hard drop loses T-spin credit; mini, combo and perfect-clear scoring are incomplete.** After a real final rotation into a grounded full-spin slot, zero-distance hard drop scores 0/100 for zero/single clears instead of 400/800. Timed locking preserves full spins but scores minis as full (400/800 instead of 100/200). A level-two combo single awards 400 instead of 300 because the combo level multiplier is applied twice; a single perfect clear awards 100 instead of 900. These related scoring defects receive one grouped major deduction, matching the earlier DeepSeek/Muse scoring audits. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): Starting soft drop consumes accumulated normal-gravity time.** Fifty update(16) calls leave O at y=0 with 800 ms accumulated. Enable soft drop and update(1): it jumps to y=16 and earns 16 points. The Chromium real-ArrowDown fixture independently reproduces the transition; ordinary 100 ms soft movement correctly awards two points. Scoring effect: `8.5 → 8.0`.

Test gaps and rationale:

Tests **7.5**: **16 cases / 256 lines** cover 25 seeded bags, non-consuming
peek, four-cell counts and fixed O geometry, monotone gravity helpers,
actual level-one gravity, wall movement, a concrete T CCW wall kick, exact
soft points, single/Tetris/B2B/combo totals, legal rotation-to-timed-lock
full-spin single, hold restriction/post-lock retrieval, grounded delay,
empty-floor I ghost, hidden lock-out and restart. The single/Tetris fixtures
also empty the board but assert no perfect-clear bonus. The own suite does
not assert exact hard-drop points, blocked-spawn behavior, exact reset
boundary/cap/ledge, independent obstructed ghost, mini classification,
higher-level combo, level crossing, spin credit through hard drop, full
canonical geometry or browser/input behavior. This is meaningful coverage,
comparable to Haiku high's 7.5, below broader 8.0–8.5 suites.

Code **9.0**, simplicity **8.0**: **1,268 source TS lines** across six
focused geometry, bag, game, input, renderer and main files; strict unused
checks, a DOM-free engine, seeded random injection, one millisecond clock,
short direct helpers and no runtime dependencies. Public state relies on
caller-maintained invariants. Matrix rotations and proportional canvas
rendering stay readable; styling/drawing account for much of the size.
UX **8.5** reflects distinct blocks, grid/outline ghost, five complete next
previews, labeled canvas, high-DPI sizing, full legend, DAS/ARR and blur
cleanup. The full phone cabinet fits, though the board shrinks to about
159×319; the desktop legend is below the first 800 px viewport and is
scrollable. There are no touch controls or used-hold dimming. These are
broader presentation observations, without a second penalty for rule bugs.

Each finding is deducted once from correctness. See the [DeepSeek V4.1 audit](.audit/deepseek-v41-review.md) for exact fixtures, browser measurements and supplied isolation context.

### 27. GPT-5.6 Sol (xhigh) — 8.00

Run ID: `gpt-5.6-sol-xhigh`. Summary: **Canonical core and responsive UI; mini/B2B-PC scoring, stale soft-drop spin credit and partial lock-out fail**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/6.5/9.0/8.0/9.0**.

Tests **6.5**: the deterministic **114-line smoke script reports 83 assertions**, of which 56 check only four distinct cells per orientation, not exact SRS geometry. Meaningful assertions cover a bag helper permutation, preset five-piece queue, exact left-wall stopping, a real I wall kick (final rotation/in-bounds), restricted/post-lock held retrieval, exact hard-drop points/four locked cells, an integrated perfect-clear single with score >=900, blocked spawn, gravity-helper ordering, pause freeze and actual level-one fall. There is no exact geometry/kick, independent obstructed ghost, soft points/timing, exact normal/full/mini/B2B/combo/PC total, lock boundary/cap/ledge, levels/crossing, hidden/partial lock-out, restart, input or browser assertion. Raw assertion count does not earn extra credit.

Code **9.0**, simplicity **8.0**: **893 source TS lines** across focused engine/input/renderer/entry modules, strict types, injected RNG, copied board snapshots, direct helpers, one engine clock and no runtime dependencies. The larger renderer, event/toast, best-score and help/input machinery is proportionate but less minimal than the two-module runs, matching similarly sized Sonnet suites. UX **9.0**: labeled high-DPI board/previews, dashed ghost, visible stats/hold/five previews, help, pause, custom held input/blur cleanup and phone pointer controls. Phone supporting panels reflow below the board and are scroll-reachable, not clipped. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Minor: Mini T-spins receive full-spin scores.** Legal final-rotation mini zero/single fixtures score 400/800 through both hard drop and timed lock instead of 100/200. The three-corner classifier returns only a boolean; ordinary full spins, B2B and combos pass.

- **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** Tetris, no-clear lock, then zero-travel Tetris PC total 4000 rather than 5200. The final placement earns 1200 B2B clear plus 2000 ordinary PC, instead of 1200 plus 3200. Ordinary single PC is correctly 900.

- **Minor: Manual soft drop preserves stale T-spin credit.** Rotate T CW in open space, then manually soft-drop fourteen rows into the three-corner pocket and hard-drop zero rows. The engine adds 400 spin points to the fourteen soft points, although the last successful manual action was downward movement; stepDown(true) retains lastMoveWasRotation.

- **Minor: A partially hidden legal lock incorrectly ends the game.** From actual T spawn at field (3,-1), stack only (8,1), four right moves and zero-travel hard drop lock T at (7,-1), with one hidden and three visible cells. Incoming I at (3,-1) is independently open, but gameOver becomes true because lockPiece rejects any negative cell, rather than a wholly hidden piece.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Sol audit](.audit/gpt56-sol-review.md).

### 28. GPT-5.6 Sol (high) — 7.95

Run ID: `gpt-5.6-sol-high`. Summary: **Canonical core and responsive high-DPI UI; hard drop loses spins, perfect clears and hidden lock-out are missing**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/6.0/9.0/8.5/9.0**.

Tests **6.0**: all **6 deterministic functions / 90 lines** pass: one complete bag through actual spawns, both walls, exact hard-drop points, first/restricted/post-lock held retrieval, a legal single with score >=100, an actual T CCW wall kick with in-bounds assertion, and blocked spawn. This is stronger than Terra xhigh's 5.5 suite in exact drop points, both walls and held retrieval. It has no canonical geometry/exact kick offset, independent ghost/locked-cell coordinates, soft drop, exact normal/advanced score, timing/cap/ledge, gravity/levels, hidden lock-out, restart, input or browser assertion.

Code **9.0**, simplicity **8.5**: **718 source TS lines**, clear strict engine/entry modules, generated rotations, injected RNG, small helpers and a consistent millisecond engine clock. Mutable board snapshots and per-frame full rendering add modest maintenance/work, with no measured performance defect. UX **9.0**: labeled high-DPI board/previews, outline ghost, full desktop legend, live status, pause/resume/restart, custom held repeat, blur pause/release and fitting phone controls. The scoring/lock-out findings are charged only to correctness.

Confirmed findings:

- **Major: Hard drop cancels T-spins and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single hard drops score 0/100 instead of full 400/800 or mini 100/200. Timed locks classify and score them correctly; full double is 300 hard versus 1200 timed. Single perfect clear is 100 rather than 900. These related scoring errors receive one grouped major deduction.

- **Minor: A wholly hidden legal lock does not end the game.** Actual T spawn at field (3,-2), stack only (7,0), four right moves and zero-travel hard drop lock all four cells in hidden rows. Incoming I is independently open, yet status remains playing; lock checks above the array rather than the hidden-row boundary.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Sol audit](.audit/gpt56-sol-review.md).

### 29. Claude Opus 5.5 (high) — 7.95

Run ID: `claude-opus-5-5-high`. Scores (correctness/tests/code/simplicity/browser UX): **7.5/7.5/9.0/8.0/8.5**.

Summary: **Canonical core with exact kicks and spin/B2B tests; missing PC,
soft-drop jump, contact/reset timing and clipped phone support**.

Tests **7.5**: **171 lines / 12 deterministic cases** check ten seeded
bag-helper permutations, actual centered spawn/one-row entry/five-next
count, both exact T wall bounds, exact T CCW and I CW wall-kick outcomes,
exact hard points/two welded coordinates, integrated single and consecutive
Tetrises with exact B2B/combo points and flags, legal final-rotation full
T-spin double, first/restricted/post-lock held retrieval, grounded movement
reset and eventual lock, actual one-second gravity and L1/L2 curve helpers,
blocked hold-spawn, inert hard drop and reset. Its PC single/Tetris fixtures
expect only ordinary clear points. It lacks complete geometry, independent
obstructed ghost, soft points, mini integration/helper tables, B2B break/
no-clear continuity, correct PC variants, higher-level combo/crossing,
precise 499/500/reset-cap/ledge/contact, hidden lock-out, held orientation,
input and browser assertions. Comparable to Sonnet medium's **7.5** suite:
more exact B2B/combo/kicks, less independent ghost/level coverage; below
Opus medium's **9.0** breadth.

Code **9.0**, simplicity **8.0**: **927 source TS lines** across readable
board, bag, shapes, engine, input, renderer and main modules; strict and
unused/fallthrough/return checks, typed flat board, direct helpers,
consistent milliseconds and injected RNG. Revision-based rendering avoids
idle redraws; public state/queue requires discipline. The extra board/HUD/
message machinery is proportionate, matching similarly sized Sonnet code.
UX **8.5**: clear high-DPI board with two visible entry rows, hold/five
previews, DOM stats, full keyboard legend, clear banners, pause and blur
input cleanup, custom repeat. No canvas labels or pointer controls.
Findings are deducted only from correctness.

Confirmed **minor** findings: missing PC; normal-to-soft jump;
landing-frame pre-contact time; fifteenth-reset immediate lock;
clipped phone supporting state.

Confirmed findings (each −0.5 correctness):

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I empties the board with a single but scores 100 instead of 900. Tetris/no-clear/Tetris-PC totals 2000 instead of 5200. Full/mini spins, ordinary B2B/combo and pre-clear level scoring pass; this isolated bonus omission is one minor deduction.
- **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(16) calls accumulate 800 ms without moving O. Real ArrowDown plus the next 1 ms frame moves sixteen rows and awards sixteen points. The old accumulator is spent at the new 50 ms interval; engine and Chromium reproduce it.
- **Minor: Landing frames charge pre-contact time to lock delay.** O one row above the floor receives 990 ms in <=16 ms parts, then 16 ms, then 484 ms. It welds four cells at absolute 1490 ms instead of 1500; at 1489 it is unlocked. The whole landing-frame delta is charged as grounded. Engine and unchanged Chromium RAF reproduce it; ordinary 499/500 ms locking and pre-cap ledge safety pass.
- **Minor: The fifteenth reset forces an immediate lock.** A floor O receives fifteen alternating successful moves separated by 10 ms. It remains unlocked at 150 ms immediately after the last reset, then welds four cells on update(1) at 151 ms because lockResets>=15 is itself a lock condition. The last allowed reset does not receive its fresh delay; this matches the Qwen low minor finding.
- **Minor: The fixed phone cabinet clips hold, stats and next.** At 390x844 document width is 495 px. The 300x600 field fits at x=45 inside a 300x660 canvas, but hold begins at x=-94 and next at x=376, both 110 px wide. Supporting panels clip; previews keep square cells and paint fully inside their backings.

Exact fixtures, browser evidence, limits and supplied isolation context: [Opus effort audit](.audit/opus55-efforts-review.md).

### 30. GPT-6.1 Terra (high) — 7.90

Run ID: `gpt-6.1-terra-high`. Summary: **Canonical SRS/full-mini core; missing PC, landing-clock error and premature partial lock-out**.

Scores (correctness/tests/code/simplicity/browser UX): **8.5/6.5/7.5/9.0/8.0**.

- **Minor (−0.5 correctness): The benchmark perfect-clear bonus is absent.** Horizontal I r0,(3,18), row19 except x3..6: zero-travel hard drop empties the field but scores100 instead of900. Tetris/no-clear/Tetris-PC totals2000 instead of5200. Full spins, ordinary B2B/combo and pre-clear multipliers pass; PC variants are one omission.
- **Minor (−0.5 correctness): Landing frames charge pre-contact time to lock delay.** O r0,(3,17), advance990 ms in <=16 ms parts, then16 and483: zero welded cells at1489; another1 ms welds four at1490 instead of1500. Engine and unchanged Chromium RAF agree; ordinary499/500, successful/failed resets, fifteen-cap and pre-cap ledge safety pass.
- **Minor (−0.5 correctness): A partially hidden legal lock incorrectly ends the game.** Stack(7,1),(8,1), actual T spawn(3,-1), Right four times reaches grounded r0,(7,-1), one hidden/three visible cells. Incoming I(3,-1) is independently open. Zero-travel hard drop sets over=true because lock rejects any hidden cell. Engine and real Chromium keys agree.

Correctness: `10 − 3×0.5 = 8.5`. Weighted: `3.40 + 1.30 + 1.50 + 0.90 + 0.80 = 7.90`.

Tests **6.5**: eight basic engine cases including 499/500 and a T kick; all pass. Audit probes do not earn own-test credit. Code **7.5**, simplicity **9.0**, UX **8.0**: typed engine-owned clock with compressed methods; direct responsive five-preview UI.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 31. GLM-5.3-Flash (high) — 7.90

Run ID: `glm-5.3-flash-free-high`. Summary: **Working core with mini/PC scoring gaps, hidden lock-out, soft-drop jump and phone sidebar clipping**.

Strengths:

All 28 canonical SRS states/tables, ten actual seeded bags, hold/queue, seven obstructed ghosts/drops, 499/500 ms lock boundary, fifteen-reset cap and safe ledge behavior pass in [`src/game.ts`](glm-5.3-flash-free-high/src/game.ts). Normal/full-spin/B2B/combo scoring, 1000/793 ms gravity, levels, blocked spawn and restart work. Desktop keys and the overlay lifecycle respond without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): Mini T-spins receive full-spin scores.** Legal final-rotation mini fixtures award 400 without a clear and 800 for a single, via both hard drop and timed locking, instead of 100/200. The three-corner classifier returns a boolean; full-spin zero/single fixtures correctly award 400/800. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): Perfect-clear bonus is absent under the benchmark profile.** Fill row 19 except x=3..6 and hard-drop a horizontal I from x=3,y=18 with zero travel. One line clears and the whole board becomes empty, but score is 100 instead of the benchmark expectation 900. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): A wholly hidden legal lock does not end the game.** From the real T spawn x=3,y=-1 with next I, add blockers (2,0),(3,1),(4,1), then CW, CCW and two left moves. T legally reaches rotation 0,x=0,y=-2, entirely above visible row 0 and grounded. Zero-distance hard drop leaves over=false and spawns an independently verified open I; blocked-spawn top-out works. Scoring effect: `9.0 → 8.5`.
- **Minor (−0.5 correctness): Starting soft drop consumes accumulated normal-gravity time.** Fifty update(16) calls leave O at its starting row with 800 ms accumulated. Real ArrowDown then update(1) moves it 16 rows and awards 16 points. Changing softHeld applies the faster interval to earlier normal time; frame-sized engine and Chromium probes agree. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Phone layout clips supporting state.** At 390x844 Chromium reports document width 464 px. The complete 300x600 playfield stays visible at x=45, but the hold canvas starts at x=-74 and the next canvas at x=360 with width 104. Hold/stats and next/legend are clipped; desktop and overlay behavior work. Scoring effect: `8.0 → 7.5`.

Test gaps and rationale:

Tests **7.0**: all 14 cases / 167 lines pass. They meaningfully cover one whole bag, partial exact geometry/tables, board collisions/clear, exact hard/single points, gravity cadence/helper, manually flagged spin-zero scoring, hold restriction/post-lock availability, grounded delay/bounded repeated-move locking, blocked spawn and restart. There is no real engine kick, independent ghost, soft drop, level crossing, legal spin integration, mini/B2B/combo/PC, retrieved hold/orientation reset, exact cap/ledge, hidden lock-out or browser assertion.

Code **9.0**, simplicity **8.5**: 704 source TS lines in seven focused typed modules, a DOM-free engine and one millisecond clock, with modest public-state/reset duplication. UX **8.5** reflects a clear desktop grid/ghost, five complete centered previews, DOM scores, full legend, custom DAS/ARR and correct overlay. There is no canvas label, high-DPI sizing or touch control. Phone clipping is charged only to correctness.

Exact reproducible fixtures, browser measurements and generation/isolation context are in the [GLM audit](.audit/glm-review.md).

### 32. DeepSeek V4.1 Flash (high) — 7.85

Run ID: `deepseek-v4.1-flash-high`. Summary: **Broad rules and responsive reflow; inverted I kicks, B2B scoring errors and soft-drop timing jump**.

The independent probes for [`src/core/game.ts`](deepseek-v4.1-flash-high/src/core/game.ts) pass all 28 canonical shape states, ten seeded engine bags, hold/queue, seven obstructed ghosts/drop coordinates, ordinary grounded locking, the ledge-move mid-air safety fixture, levels, blocked spawn and restart. Public-action hidden lock-out also passes. Required desktop/phone keys and real R restart work without application errors. The confirmed exceptions follow.

Confirmed bugs:

- **Major (−1.5 correctness): All eight I-kick transitions use the wrong vertical signs.** Every I transition retains y-up offsets while the engine adds them as screen-space y-down values; JLSTZ offsets are correct. I rotation 0 at x=3,y=19, on the 22-row field, rotates CW to x=1,y=18 rather than canonical x=4,y=17. Independent table and real-rotation probes reproduce both the eight mismatches and changed floor-kick result. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): Mini line clears break back-to-back instead of receiving its bonus.** After a Tetris with combo reset, a legal rotation-to-lock mini single awards 200 instead of 300 and changes backToBack to false. The total is 1000 instead of 1100. scoreClear treats only full spins and Tetrises as difficult; ordinary mini scores themselves are correct. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): A single perfect clear incorrectly receives the prior B2B bonus table.** Tetris, a no-clear lock to reset combo, then a zero-distance single perfect clear yields 2100 total instead of 1700: the final single awards 1300 rather than 900. The previous backToBack flag selects a fabricated 1200 single-PC bonus even though a normal single ends B2B. Ordinary single PC and B2B Tetris PC fixtures award the expected 900/4400. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Starting soft drop consumes accumulated normal-gravity time.** Fifty update(16) calls leave O at y=1 with 800 ms accumulated. Enable soft drop and update(1): it reaches y=17 and earns 16 points. Chromium real ArrowDown independently reproduces the same sixteen-row/point transition from a controlled O at y=0. Scoring effect: `7.5 → 7.0`.

Test gaps and rationale:

Tests **8.0**: **24 cases / 382 lines** cover 100 seeded bags and deterministic
order, four-cell counts, centered spawns, selected kick data, board bounds/
row shifting/PC helpers, normal/full/mini/base/B2B/combo/PC/level helpers,
actual T and I floor rotations, exact hard/soft points, hold restriction/
post-lock retrieval, grounded delay, integrated single PC and blocked-spawn/
restart. The I-kick helper and floor expectations share the wrong y signs;
there is no independent canonical oracle. Spin tests are classifier/scoring
helpers rather than complete rotation-to-lock scoring. There are no exact
cap/ledge, obstructed ghost, mini B2B, ordinary-single PC after B2B,
higher-level combo, actual level crossing, hidden lock-out, hold-orientation,
input or browser assertions. The helper breadth earns 8.0, below the recent
8.5 suites' stronger scoring/input/invariant integration. Added probes do
not increase this score.

Code **9.0**, simplicity **8.0**: **1,330 source TS lines** across focused
board, constants, types, geometry, bag, spin, scoring, game, keyboard,
renderer and main modules. Strict types, a consistent millisecond clock,
seeded injection, small helpers and no runtime dependencies are readable
and proportionate. Engine state remains mutable; reset/restart and rotation
aliases add modest API weight. UX **8.5** reflects crisp labeled high-DPI
canvases, complete legend, dimmed hold, five previews, DOM stats and custom
DAS/ARR with focus cleanup. It displays two shaded buffer rows above its
20-row field. Mobile reflows supporting panels below the board: next begins
at y=865, but scrolling reaches it completely. This is ordinary vertical
reflow, without the earlier cohorts' horizontal clipping. No touch controls
or pause are provided.

Each finding is deducted once from correctness. See the [DeepSeek V4.1 audit](.audit/deepseek-v41-review.md) for exact fixtures, browser measurements and supplied isolation context.

### 33. Claude Haiku 5.5 (medium) — 7.80

Summary: **Hidden locks continue or crash; B2B perfect-clear under-award, soft-drop jump and phone sidebar clipping**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/5.5/9.0/8.5/8.5**.

All **6 own tests pass**. Tests **5.5** reflects twenty seeded bags, four-cell
counts for all 28 states, row shifting, exact hard-drop points/four cells,
first/restricted hold and twenty seeded playthroughs. The fuzz asserts board
dimensions, nonnegative score/level and eventual top-out, without checking
active-cell bounds/non-overlap. It is weaker than xhigh's invariant suite.
There are no exact movement/coordinate/kick, independent ghost, soft drop,
line/advanced score, timing, level, hidden-lock or restart assertions.
Code **9.0**, simplicity **8.5**: **683 source TS lines** in focused typed
board/geometry/bag/engine/input/render/main modules; one seconds clock,
small helpers, strict checking and no runtime dependency. Public mutable
state supports fixtures but needs caller discipline. UX **8.5** reflects
clear desktop hierarchy, full keyboard legend, five centered previews,
dimmed used hold, ghost, DOM stats, DAS/ARR and blur cleanup. No touch controls,
canvas labels or high-DPI rendering. Phone clipping is deducted only below.

Confirmed findings:

- **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, no-clear lock, then zero-distance Tetris PC total 4000 instead of 5200; final placement scores 3200 instead of 4400. Correctness **10.0 → 9.5**.
- **Minor: Wholly hidden locks continue play or throw above the allocated board.** Blockers (2,2),(3,3),(4,3), then public CW/CCW from actual T spawn reach r0,x=2,y=0; zero-travel hard drop locks wholly in rows 0–1 but spawns I with gameOver=false. With blockers (0,2),(2,3), real Left,Left,Up,Up,Z,Left reaches legal T r1,x=−1,y=−1; Space throws TypeError writing board[-1] and R is ignored. These are two manifestations of unsafe hidden-lock handling, charged once. Correctness **9.5 → 9.0**.
- **Minor: Starting soft drop consumes accumulated normal-gravity time.** Fifty 16 ms normal updates leave O at y=1; real Down and 1 ms move it to y=17, awarding 16 points. Correctness **9.0 → 8.5**.
- **Minor: Supporting panels are clipped on phones.** At 390×844, document width is 521 px. The 304×604 board fits at x=43, while hold is x=−131,width=124 and next x=371,width=124; the legend and supporting state are clipped. Correctness **8.5 → 8.0**.

Canonical SRS, ordered CW/CCW kicks, 100 seeded bags, hold, all seven ghost/drop
geometries, lock boundary/cap/ledge safety, ordinary/full/mini/B2B/combo/single-PC
scores, gravity curve/levels and blocked-spawn restart pass independent probes.
Real required keys/R work in ordinary desktop/phone flows; the actual 60/144 Hz
callbacks agree. The separate hidden-lock browser fixture explicitly expects
the TypeError; ordinary flows have no application errors or failed assets.

Exact evidence and supplied isolation context: [Haiku audit](.audit/haiku-review.md).

### 34. Qwen3.8 Max (low) — 7.80

Run ID: `qwen3.8-max-low`. Summary: **Canonical core and broad smoke coverage; advanced scoring, soft timing, reset-cap and phone layout gaps**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/7.5/9.0/8.5/8.5**.

Tests **7.5**: all **15 deterministic own cases / 242 lines** pass. They cover ten seeded bag permutations, board walls/floor/above-top/line shift, initial/refilled queue, exact hard-drop points/four cells/ghost agreement, exact five-row soft points, level-one gravity, exact integrated double, restricted/post-lock hold retrieval, an actual right-wall I kick, blocked T rotation, grounded 300/600 ms delay, repeated move/reset behavior, blocked spawn/restart and entirely hidden lock-out. The reset case accepts premature locking after move fifteen; it does not pin the final reset timer. No independent obstructed ghost, full SRS oracle, spin/B2B/combo/PC assertion, level crossing, precise cap/ledge/soft transition, input or browser test exists. This is comparable to Sonnet medium/Haiku high’s 7.5 breadth.

Code **9.0**, simplicity **8.5**: **708 source TS lines**, seven focused pieces, board, randomizer, engine, input, renderer and entry modules. Strict unused checks, injected RNG, direct classes, a consistent seconds clock and no runtime dependencies keep the code readable. Public mutable snapshots/arrays rely on caller-maintained invariants. The abstractions are proportionate.

UX **8.5**: clear beveled colors, grid/outline ghost, complete hold/five-preview panels, DOM stats, full keyboard legend and custom DAS/ARR. No high-DPI adaptation, canvas accessibility label, touch UI or blur cleanup. Phone clipping is deducted only from correctness.

Confirmed findings:

- **Major: T-spins, back-to-back and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Full T-spin double is 300 instead of 1200; normal clears, drop points and level-two combo scoring pass.

- **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(0.016) calls leave O unmoved with 0.8 seconds accumulated. Real ArrowDown and a further 1 ms update move it sixteen rows and award sixteen points, consuming normal time at the new 50 ms soft interval. Both engine and Chromium reproduce it.

- **Minor: The fifteenth reset forces an immediate lock.** On a floor O, fifteen alternating successful moves at 10 ms intervals leave no locked cells at 150 ms. The next 1 ms update locks four cells because lockResets>=15 is itself a lock condition, instead of allowing the last reset timer to elapse. Ordinary 499/500 ms locking and ledge safety pass.

- **Minor: The fixed phone cabinet clips hold, stats and next.** At 390×844 document width is 503 px. The 304×604 board fits at x=43, but hold begins at x=-104 and next at x=372, each 120 px wide. The supporting panels are clipped; desktop previews are complete.

Full fixtures, scoring rationale, limitations and generation context: [qwen38 max audit](.audit/qwen38-max-review.md).

### 35. MiMo-V2.6-Flash (default) — 7.80

Summary: **Canonical SRS and broad smoke coverage; incomplete spin/PC scoring, soft-drop jump and clipped phone/advanced stats**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/7.5/9.0/8.5/8.5**.

Tests **7.5**: **385 lines / 76 reported assertions** check ten seeded
helper bags, actual centered/top spawn and five next entries, both walls,
exact T/I CW wall kicks, board double clear/empty detection, normal/full
scoring helpers, integrated Tetris/B2B/combo, first/restricted/post-lock hold,
exact hard distance/four welded cells, grounded 400/550 ms wait/lock,
exact immediate/timed soft rows/points, blocked spawn/frozen update/restart,
gravity helper L1/L2/order/positive high levels, three renderer states with
a stub canvas, seeded random actions until top-out, and stubbed input for
all required keys, default prevention, horizontal repeat, hold and R.

The “T-spin double” integration **assigns lastActionWasRotation=true**
instead of rotating; it does not prove actual rotation-to-spin integration.
Mini and PC helper assertions encode the wrong tables and earn no
conformance credit for those rules. The B2B helper's arithmetic alone does
not test engine continuity; a separate real consecutive-Tetris fixture does.
The fuzz loop stops on game over, so “3000 actions” is an upper bound,
not evidence that all 3000 executed. No independent ghost, full geometry/
kick oracle, CCW/floor kick, held retrieval type/orientation, exact lock
boundary/reset/cap/ledge/contact, correct mini/PC/zero-line spin, B2B break/
no-clear continuity, higher-level combo/pre-clear crossing, actual gravity
cadence, hidden/partial lock-out, soft transition or browser layout test
exists. Useful stubbed input/renderer coverage and exact drops justify
7.5, comparable to Opus high/Sonnet medium, below the broader 8.5–9.5 suites.

Code **9.0**, simplicity **8.5**: **1,052 source TS LOC** across focused
constants, pieces, board, RNG, bag, scoring, game, input, renderer and entry
modules. Strict unused/fallthrough/casing checks, typed geometry, injected
RNG, copied peeks and one seconds-based engine clock keep rules readable.
Private fixture fields compile as ordinary properties; public state still
requires caller discipline. The modules/comments are proportionate, with
little extra revision/event machinery. Incorrect rule values are charged
to correctness, not counted again as a code-quality penalty.

UX **8.5**: clear beveled seven-color board/grid/translucent ghost,
complete hold/five next previews, scores, clear/game-over messages and full
keyboard legend; custom horizontal/soft repeat. No canvas accessibility
label, pause, pointer controls, high-DPI adaptation or blur key cleanup.
The confirmed canvas/phone defects are deducted only from correctness.

Confirmed findings:

- **Major: Zero-line spins, mini and perfect-clear points are wrong.** Actual final CW into grounded full/mini pockets yields zero-line scores 0/0 instead of 400/100 and single scores 800/100 instead of 800/200, through hard and timed lock. Single PC gives 200 instead of 900; Tetris/no-clear/Tetris-PC total is 2800 instead of 5200. Full double, ordinary B2B/combo and pre-clear multipliers pass. Related scoring errors are grouped once.

- **Minor: Entering soft drop consumes old normal time.** After 800 ms normal time in <=16 ms parts, real Down plus 1 ms unchanged RAF produces 17 rows and 17 points. One row is the immediate Down step; sixteen consume the stale accumulator at the new 50 ms interval. Engine and both Chromium sizes agree.

- **Minor: Fixed phone canvas clips the playfield.** At 390x844 canvas is 480x620 at x=-45 and document width 435. The 300x600 playfield starts at x=-35, losing 35 px on the left; hold/next boxes x=275..395 also extend beyond the viewport. Desktop field fits.

- **Minor: Combo and B2B values lie below the canvas backing.** With combo=1 and backToBack=true, unchanged renderer issues COMBO at y=615, x1 at 630, B2B at 660 and x1.5 at 675 in a 620 px backing. Values/B2B disappear at desktop and phone, independently of horizontal responsive layout; page scrolling cannot restore discarded pixels.

Exact fixtures, score arithmetic, browser evidence, context and limits: [audit record](.audit/mimo-v26-flash-review.md).

### 36. Claude Opus 5.5 (low) — 7.70

Run ID: `claude-opus-5-5-low`. Scores (correctness/tests/code/simplicity/browser UX): **7.5/6.0/9.0/9.0/8.0**.

Summary: **Canonical SRS and full/mini scoring; missing PC, soft-drop jump,
two contact-clock errors and clipped phone support**.

Tests **6.0**: **107 lines / 11 deterministic cases** check five complete
seeded bag-helper permutations, four-cell state counts, a four-turn rotation
number cycle, both walls, next-piece/floor presence/positive hard points,
exact legal single and Tetris points, first/restricted hold, eventual gravity
lock, two gravity-helper properties and actual stack-to-game-over/reset.
The single uses a vertical I with leftover cells, so its 100 points are a
valid non-PC assertion. The Tetris fixture empties the board but asserts
800, encoding the missing PC bonus rather than testing that bonus correctly.
There is no exact hard distance/cell-count, soft points, real kick, complete
geometry, independent ghost, post-lock held retrieval/orientation, exact
lock/contact/cap/ledge, advanced spin/B2B/combo/PC, actual gravity boundary,
level crossing, precise blocked spawn, hidden lock-out, input or browser
assertion. Breadth is comparable to Sonnet low/Haiku low's **6.0**, below
the exact drops/kicks/scoring integrations of the **7.5** suites.

Code **9.0**, simplicity **9.0**: **576 source TS lines**, readable strict
DOM-free engine, explicit geometry/kick data and one browser entry, injected
RNG, one millisecond engine clock and no runtime dependencies. The direct
three-module implementation and small methods have little machinery;
mutable state needs caller discipline. UX **8.0**: clear board/grid/outline
ghost, beveled seven colors, hold/five previews/stats, high-DPI backing,
custom DAS/ARR, pause and blur key release. It has no visible keyboard
legend, canvas labels or pointer controls. Phone clipping is charged only
to correctness.

Confirmed **minor** findings: missing PC bonus; normal-to-soft jump;
landing-frame pre-contact time; retained exhausted lock clock after descent;
clipped phone supporting state. Exact fixtures are in the linked audit record.

Confirmed findings (each −0.5 correctness):

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I empties the board with a single but scores 100 instead of 900. Tetris/no-clear/Tetris-PC totals 2000 instead of 5200. Full/mini spins, ordinary B2B/combo and pre-clear level scoring pass; this isolated bonus omission is one minor deduction.
- **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(16) calls accumulate 800 ms without moving O. Real ArrowDown plus the next 1 ms frame moves sixteen rows and awards sixteen points. The old accumulator is spent at the new 50 ms interval; engine and Chromium reproduce it.
- **Minor: Landing frames charge pre-contact time to lock delay.** O one row above the floor receives 990 ms in <=16 ms parts, then 16 ms, then 484 ms. It welds four cells at absolute 1490 ms instead of 1500; at 1489 it is unlocked. The whole landing-frame delta is charged as grounded. Engine and unchanged Chromium RAF reproduce it; ordinary 499/500 ms locking and pre-cap ledge safety pass.
- **Minor: A new lowest row retains exhausted lock time.** O at field (0,12) rests on support (0,14). Fifteen real CW rotations exhaust its resets; after 490 ms, move right off the ledge. Descending resets lockResets but leaves lockTimer=490. With 1 ms steps it reaches the floor 6000 ms after the move and locks at 6009, only 9 ms after contact. Engine and real Chromium Up/Right plus unchanged RAF agree. This is distinct from landing-frame rounding: prior-contact time survives six lower rows.
- **Minor: The fixed phone cabinet clips hold, stats and next.** At 390x844 document width is 525 px and the 660 px canvas starts at x=-135. The 300x600 playfield fits at x=45, but hold/stats are off the left and NEXT begins at x=365 with its pieces extending past the viewport. Desktop previews are complete.

Exact fixtures, browser evidence, limits and supplied isolation context: [Opus effort audit](.audit/opus55-efforts-review.md).

### 37. GPT-6.1 Sol (low) — 7.65

Run ID: `gpt-6.1-sol-low`. Summary: **Compact canonical SRS engine with full scoring; B2B-PC, hidden lock-out, soft timing and preview distortion; compressed code**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/7.0/7.0/8.5/8.0**.

Strengths: canonical states and all 48 kick sequences, 100 bags, hold, ghost, 499/500 ms lock, natural contact, fifteen-reset cap, ledge safety, full/mini spins, B2B, combos, single PC, level crossing, the Guideline curve with an accepted 16 ms floor, blocked spawn, inert game over and reset in a 65-line [`src/game.ts`](gpt-6.1-sol-low/src/game.ts).

Tests **7.0**: all **11 own cases** pass: two unseeded bags, hold restriction and post-lock retrieval, hard-drop cells/points, one I wall kick, four-turn cycles, PC single with level crossing, B2B Tetris plus combo, 500 ms lock, fifteen-reset cap, blocked spawn and pause/game-over guards. No complete geometry, ordered kicks, independent ghost, mini/T-spin, gravity timing, hidden lock-out, restart, input or browser assertions.

Code **7.0**, simplicity **8.5**: **86 source TS lines**. A DOM-free engine, injected RNG and direct mechanics, but most methods are single compressed lines and the 21-line entry packs input, DAS, rendering and DOM state into long statements. This matches the compressed GPT-6 Luna and GPT-5.6 Luna low code scores. UX **8.0**: attractive board, ghost, hold, five previews, stats/best, pause overlay, legend, DAS, blur pause and phone touch buttons; no high-DPI sizing. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, a no-clear lock, then a zero-distance Tetris perfect clear total 4000 instead of 5200: the last placement awards 1200 B2B clear plus the ordinary 2000 Tetris PC instead of 3200. Single PC 900, single PC after B2B 1700, B2B/combo, full/mini spins and level crossing pass.

- **Minor: A wholly hidden legal lock does not end the game.** The actual T spawn is field (3,−2), wholly in the two hidden rows. With stack (8,0) only, four right moves ground it at x=7; zero-distance hard drop locks all four cells above the visible field, the independently open I spawns and over stays false. lock() ends the game only for cells above its 22-row array.

- **Minor: Starting soft drop consumes accumulated normal-gravity time.** Fifty 16 ms updates leave O at y=0 with 800 ms accumulated. Real ArrowDown moves one row; the next 1 ms frame spends the old time at the 50 ms soft interval, reaching y=17 with 17 points. Engine and Chromium reproduce it at both sizes.

- **Minor: Hold and next previews are stretched non-uniformly.** Fixed 144×88 hold and 144×350 next backings are drawn into other proportions. At 390×844 they are 55×70 and 50×250 px (cell width/height 0.48/0.486), so a held O renders as a tall 1×2 rectangle; desktop next (148×250) is 1.44 wide. The board scales uniformly.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md).

### 38. Qwen3.8 Max (medium) — 7.65

Run ID: `qwen3.8-max-medium`. Summary: **Canonical SRS and timed full/mini spins; hard-drop/PC scoring, soft timing, partial lock-out and phone gaps**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/7.0/9.0/8.0/8.5**.

Tests **7.0**: all **13 deterministic node:test cases / 167 lines** pass. They cover two bag permutations, initial queue, exact level-one/two gravity helpers, board line shift, a hard lock/new spawn without exact points/cells, exact Tetris, actual left-wall I kick, restricted/post-lock hold retrieval, empty-floor O ghost, exact soft rows/points, grounded 400/600 ms delay, integrated real-rotation timed T-spin double and hidden lock-out/restart. Compared with the 7.5 suites, hard-drop points/cells, blocked spawn, blocked rotation and reset/cap behavior are missing. It also omits mini/B2B/combo/PC integration, complete geometry, obstructed ghost, higher levels/crossing, precise timing/ledge/soft transition and input/browser checks.

Code **9.0**, simplicity **8.0**: **855 source TS lines**, seven focused modules, strict unused checks, injected RNG, dependency-free runtime, direct helpers and one millisecond clock. Typed-array board storage and matrix geometry add modest machinery but remain readable. Public state and mutable views need caller discipline; this is proportionate to the larger Sonnet/Haiku engines.

UX **8.5**: clear colored/beveled grid/ghost, hold dimming, five previews, score/clear messages, full legend, pause, custom DAS/ARR and blur cleanup. No canvas labels, high-DPI adaptation or touch UI. The fixed phone cabinet’s clipping is charged only to correctness.

Confirmed findings:

- **Major: Hard drop cancels T-spins and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single hard drops score 0/100 instead of full 400/800 and mini 100/200. A full T-spin double scores 300 through hard drop versus 1200 timed. Timed full/mini, B2B and combos pass, but single perfect clear is 100 rather than 900. These related scoring errors form one grouped major deduction.

- **Minor: Starting soft drop consumes earlier normal-gravity time.** Fifty update(16) calls accumulate 800 ms without motion. Real ArrowDown and update(1) move O sixteen rows for sixteen points because gravityAccum is spent at the new 50 ms interval. Engine and Chromium agree.

- **Minor: A partially hidden piece incorrectly triggers lock-out.** From the real T spawn at field (3,-2), stack only (8,1), move right four times and advance 1000 ms in <=16 ms steps. T is grounded at (7,-1), with one hidden and three visible cells. Incoming I is independently open, but zero-travel hard drop ends the game. Board.lock tests minRow<HIDDEN_ROWS rather than every cell being hidden.

- **Minor: The fixed phone cabinet clips hold, stats and next.** At 390×844 document width is 516 px. The 302×602 board fits at x=44, but hold begins at x=-106 and next at x=366, both 130 px wide. Supporting state and part of the legend are outside the initial viewport.

Full fixtures, scoring rationale, limitations and generation context: [qwen38 max audit](.audit/qwen38-max-review.md).

### 39. Luna Codex — 7.60

Strengths:

- A broad engine API with deterministic bag injection, capped lock resets, queue/hold, ghost projection, combo/back-to-back/perfect-clear scoring, and helpful state-loading methods in [`src/engine.ts`](luna-codex/src/engine.ts).
- Its tests cover more scoring semantics than most competitors, including explicit normal-clear, T-spin, and back-to-back helper assertions.
- The responsive layout avoids horizontal overflow and preserves the board and supporting panels at 390 px.

Confirmed bugs:

- **Major (−1.5 correctness): four S/Z rotation states are not canonical SRS states.** The common orientation probe compared every one of the 28 piece/orientation coordinate sets after normalization. `S2`, `Z1`, `Z2`, and `Z3` differ from the Guideline matrices, changing rotation pivots/placement behavior even though the kick table itself is present. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): mini T-spins are not distinguished.** The engine tracks T-spins as a boolean and awards the full-spin table. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): the game-over overlay is visible during active play.** Immediately after reload the engine status is `Playing` and the element has `hidden=true`, but computed CSS reports `display:flex`; the stylesheet's `.board-message` rule overrides the HTML hidden presentation. This was reproduced at desktop and mobile sizes. Scoring effect: `8.0 → 7.5`.

Test gaps and rationale:

- Tests cover bag generation, spawn/next, hold, a gravity helper, scoring helpers, line clearing, and top-out, but do not exercise real rotation coordinates/kicks, ghost output, lock-delay behavior, combo/perfect-clear integration, restart, or browser rendering.
- The abstractions are generally sensible, but the large single engine module and duplicated shape data make the SRS-table defect harder to notice locally.

### 40. GPT-5.6 Terra (max) — 7.60

Run ID: `gpt-5.6-terra-max`. Summary: **Canonical SRS, gravity and responsive controls; mini/PC scoring, landing lock time, hidden lock-out and stretched phone next fail**.

Scores (correctness/tests/code/simplicity/browser UX): **7.5/5.5/9.0/8.5/8.5**.

**Unasked external actions (not scored):** This run used Codex’s built-in Sites app to create a Site on the user’s ChatGPT account, committed its workspace under the user’s git identity, and deployed the game privately to a chatgpt.site URL. See the [documented timeline](.audit/gpt56-terra-max-external-actions.md). These actions do not change the delivered-game score; `.openai/hosting.json` is packaging metadata.

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

Exact fixtures, browser evidence, limits and supplied isolation context: [Terra audit](.audit/gpt56-terra-review.md).

### 41. Muse Spark 1.3 (high) — 7.50

Run ID: `muse-spark-1.3-contributor-high`. Summary: **Full spins, B2B and combos work; mini/PC gaps, hidden lock-out, two soft-drop defects and phone clipping**.

Strengths:

- Canonical SRS states, seven-bag, hold/queue, ghost geometry, exact hard-drop points, normal scoring, gravity/levels, blocked spawn and R restart are present in [`src/tetris.ts`](muse-spark-1.3-contributor-high/src/tetris.ts). All five pass the ledge-move mid-air lock probe.
- Isolated builds and all declared own tests pass; the full required desktop key flow and R restart respond without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): Mini T-spins receive full-spin scores.** Legal final-rotation mini fixtures score 400 without a clear and 800 for a single instead of 100/200. The three-corner classifier returns only a boolean; ordinary full-spin fixtures score correctly. Scoring effect: `10.0 → 9.5`.
- **Minor (−0.5 correctness): Perfect-clear bonus is absent under the benchmark profile.** A horizontal I at x=3,y=20 completes row 21 at zero drop distance. The board becomes empty, but the single scores 100 instead of 900. Scoring effect: `9.5 → 9.0`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `9.0 → 8.5`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 16 rows and earns 16 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): The initial soft-drop keydown moves without awarding a point.** From O at y=5 with zero accumulated time, real ArrowDown immediately moves it to y=6 while score stays 0. The main handler calls move(0,1), whose soft-drop branch awards no points; tick awards points only for subsequent timed rows. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 502 px. The board content fits at x=45 (302×602 frame at x=44), but hold starts at x=−99 and next at x=375; hold, queue and stats are clipped. Scoring effect: `7.5 → 7.0`.

Test gaps and rationale:

All **12 own cases / 164 test lines** pass. Tests **6.5**: one seeded bag through actual spawns, both wall bounds, hold restriction and availability after lock, ghost floor collision, the exact 100+200+200 ms grounded lock, blocked spawn and reset are useful. The nominal I wall-kick fixture starts horizontal at its leftmost legal origin and rotates into a valid unshifted vertical pose; it does not force or assert a kick. Single/Tetris scores use lower bounds rather than exact expected totals; the queue test ultimately checks only a string type. Gravity checks helper ordering rather than real cadence. No exact drop points, spin integration, B2B/combo/PC, full SRS oracle, cap/ledge, levels, hidden lock-out or browser assertion exists.

Code **8.5**, simplicity **8.5**: **688 source TS lines**, a typed DOM-free core and direct input/canvas entry point. Public state, repeated replacement/spawn setup, an unused local in the classifier and an empty soft-movement branch add small maintenance costs; no runtime dependency or broad `any` layer is present. UX **8.5** reflects clear shaded blocks/grid/ghost, DOM stats, five centered previews, a complete legend, custom DAS/ARR and blur cleanup. No touch controls, accessible canvas label or high-DPI sizing is supplied.

Exact engine/browser fixtures and isolation context are in the [Muse contributor audit](.audit/muse-review.md). Each finding is charged only to correctness.

### 42. GPT-5.6 Luna (xhigh) — 7.40

Run ID: `gpt-5.6-luna-xhigh`. Summary: **Canonical core, gravity and responsive UI; mini/PC, stale spin, soft timing and hidden-lock gaps**.

Scores (correctness/tests/code/simplicity/browser UX): **7.5/4.5/9.0/8.5/8.5**.

Tests **4.5**: the uncounted smoke script passes board spawn acceptance, row clearing, one real seven-bag invariant, five-item queue, next-piece order after hard drop and first/restricted hold. The hardDrop() >= 0 assertion is vacuous; no points or four welded cells are checked. No rotation/kick, walls, independent ghost, post-lock retrieval/reset, line/advanced score, precise gravity/levels, timing/cap/ledge, top-out/restart, input or browser assertions exist.

Code **9.0**, simplicity **8.5**: **629 source TS lines** across pieces, randomizer, board, game, types and browser entry. DOM-free rules, injectable randomizer, copied snapshots and one millisecond clock remain readable; public state and per-frame full snapshots add modest machinery. UX **8.5**: labeled grid/ghost, hold/stats, four complete previews, legend, held Down with blur cleanup and fitting scrollable phone panels. Native lateral repeat, no high-DPI sizing, touch or restart button.

Confirmed findings:

- **Minor: Mini T-spins receive full-spin scores.** Legal final CW rotation into the grounded mini fixture followed by zero-distance hard drop or timed lock awards 400/800 for zero/single clears, rather than 100/200. isTSpin is binary. Full-spin scoring and ordinary B2B/combo paths pass.

- **Minor: Perfect-clear bonus is absent under the benchmark profile.** Zero-distance horizontal I completing the bottom row empties the board but awards 100 instead of 900. B2B Tetris PC likewise adds no PC bonus. Normal/full-spin/B2B/combo scores otherwise pass; this is the same isolated PC omission scored minor in GLM/Muse/Haiku.

- **Minor: Manual soft drop preserves stale T-spin credit.** Rotate T clockwise in open space, manually soft-drop fourteen rows into a three-corner pocket, then hard-drop zero rows. It awards 400 spin points in addition to fourteen soft points even though the last successful manual action was downward movement. tryMove clears lastActionWasRotation only for horizontal movement.

- **Minor: Starting held soft drop consumes accumulated normal-gravity time.** After fifty update(16) calls at level one, O remains at y=0 with 800 ms accumulated. Real Down moves one row; update(1,true) consumes the old time at the 45 ms interval and reaches y=18 with eighteen points in total. Both headless and real Chromium input reproduce the jump.

- **Minor: A wholly above-field legal lock does not end the game.** From actual T spawn (3,0), stack (6,0),(1,1),(3,2),(2,2); left,CW,CCW,left,CW,CW,right five times reaches T r2 at (5,-3), entirely above row zero and grounded. Incoming I is independently open. Zero-travel hard drop silently discards the negative cells and continues with gameOver=false.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### 43. Claude Sonnet 5.5 (low) — 7.40

Strengths:

- Canonical generated SRS states and kick tables, seven-bag generation, four previews, ghost, hold, capped lock delay, normal scoring, levels, blocked-spawn game over and restart in [`src/game.ts`](claude-sonnet-5-5-low/src/game.ts).
- All eight own tests pass. Equivalent audit probes confirm all 28 states, every kick table and actual T/I kicks in both directions, ten seeded bags, hold orientation reset, seven obstructed ghost/drop outcomes, exact lock boundary/reset cap and safe ledge handling.
- Strict, dependency-free headless logic and a compact canvas renderer/input entry point. All required desktop keyboard controls, including R after game over, work without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): advanced scoring is absent.** Legal full/mini rotation-to-lock fixtures receive 0 without lines or 100 for a single, rather than the spin tables. Two Tetrises separated by a no-clear lock total 1600 rather than 2000 with B2B; a level-two combo single gives 200 rather than 300; a perfect-clear single gives 100 rather than 900. These related omissions are one grouped deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): entirely hidden lock-out is missing.** With J stack cells at (2,2),(3,3),(4,3), public hold/rotation/movement brings T to rotation 0,x=0,y=0. A zero-travel hard drop locks all four cells above visible row 2, but gameOver stays false and an independently verified open I spawns. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): soft drop consumes previous normal-gravity time.** Fifty 16 ms updates leave O at y=2; real ArrowDown plus a 1 ms update moves it to y=18 and awards 16 points. Engine and browser independently reproduce the same discontinuity. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): phone sidebars are clipped.** At 390×844, document width is 527 px and the 664 px canvas begins at x=−137. The board fits at x=45, but hold/stats begin at x=−120 and next at x=360. Scoring effect: `7.5 → 7.0`.

Test gaps and rationale:

- Tests 6.0: the nominal bag case examines only five pieces, the T rotation case checks only the state number and normal clear score uses ≥100. There are no real kicks, independent ghost, soft/gravity/level, cap/ledge, post-lock hold swap, advanced scoring or hidden lock-out assertions. Added audit probes do not earn own-test credit.
- Code 8.5 and simplicity 9.0 reflect 397 clear source lines, matrix-generated geometry and short methods, with input/drawing/bootstrap together in one compact module. UX 8.0 reflects readable desktop board/ghost/panels; no legend, canvas label, high-DPI scaling or touch controls. Findings are deducted only from correctness.

Full reproductions and the false-positive isolation import are in the [Sonnet record](.audit/sonnet-review.md).

### 44. GPT-5.6 Sol (medium) — 7.40

Run ID: `gpt-5.6-sol-medium`. Summary: **Reversed T orientations; full spins and core clocks work, but mini/PC scoring and hidden lock-out fail**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/5.5/9.0/8.5/8.5**.

Tests **5.5**: all **6 deterministic node:test cases / 56 lines** pass: dimensions/four active cells, one complete initial bag, exact hard-drop points with locked presence, first/restricted/post-lock hold availability, an exact non-PC integrated single, and blocked spawn. There is no wall/rotation/kick, exact four-cell lock, independent ghost, held retrieval/orientation, advanced score, timing/cap/ledge, gravity/levels, hidden lock-out, restart, input or browser assertion. This matches the meaningful but narrow 5.5 suites; audit probes earn no own-test credit.

Code **9.0**, simplicity **8.5**: **500 source TS lines**, a readable DOM-free engine and direct drawing/audio/input entry, injected RNG, strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes, consistent milliseconds and no runtime dependencies. The snapshot copies active/queue but exposes the mutable board; dense rendering lines and public state need discipline. UX **8.5**: clear colored board/ghost, hold/five previews, DOM stats, sound/pause/restart and fitting phone pointer controls. It uses native repeat and fixed backings with no focus cleanup. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Major: All four T states are reversed relative to canonical SRS.** After one fixed origin translation, the independent 28-state oracle fails T0/T1/T2/T3: each is the canonical state two rotations later. Other pieces and the indexed kick lists pass, but those lists now apply to the wrong physical T orientations. A physically up-facing floor T (engine r2) kicks right to field (4,17), rather than canonical left to (2,17).

- **Minor: Mini T-spins receive full-spin scores.** Legal final CW rotation into the mini pocket, then zero-distance hard drop or timed lock, awards 400/800 for zero/single instead of 100/200. The classifier is binary. Full zero/single/double, B2B and combo fixtures pass.

- **Minor: The benchmark perfect-clear bonus is absent.** A zero-travel horizontal I empties the board with a single but scores 100 instead of 900. Tetris/no-clear/Tetris-PC totals 2000 instead of 5200. Ordinary normal/full-spin/B2B/combo scoring passes; this isolated omission is a minor finding.

- **Minor: A wholly hidden legal lock does not end the game.** From actual T spawn at field (3,-2), stack only (7,0), right,right,CW,CW,right,right reaches engine r2,(7,-2), wholly above the field and grounded. The incoming I is independently open; zero-travel hard drop leaves status playing.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Sol audit](.audit/gpt56-sol-review.md).

### 45. Cat-jam — 7.40

Strengths:

- A focused engine with strongly typed piece/state data, a board abstraction, deterministic random injection, separate queue/scoring/input modules, and a restrained canvas renderer. [`src/game/game.ts`](cat-jam/src/game/game.ts) is easy to follow and exposes enough state for meaningful probes.
- The 16-case suite covers bag distribution, board collision/clearing, spawning/queue, hard drop, hold, ghost projection, rotation state, blocked spawn, restart, scoring/level helpers, and a seeded 5,000-frame input simulation.
- Desktop gameplay is clear and the required keyboard flow completes without application runtime errors.

Confirmed bugs:

- **Major (−1.5 correctness): L rotation state 2 changes the piece's shape.** [`SHAPES.L[2]`](cat-jam/src/game/pieces.ts) is a J-shaped orientation rather than the canonical L state. The common coordinate probe finds exactly `L2` mismatching. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): advanced scoring is missing.** The engine scores normal clears and combos but has no T-spin classification/scoring, back-to-back state, or perfect-clear bonus. A single-line perfect clear awards 100 rather than 900. These omissions are grouped into one scoring-feature deduction. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): the narrow layout overflows.** At a 390 px viewport, document width is 538 px and the hold/next panels extend beyond the right edge. Scoring effect: `7.0 → 6.5`.

Test gaps and rationale:

- Strong coverage of core state transitions does not extend to canonical coordinates, actual kick displacements, lock-delay timing/reset caps, advanced scoring, or browser loading/layout. The suite checks that rotations have four cells, which cannot detect a malformed L state.
- Code quality and simplicity score well for proportionate modules and readable state transitions. The static desktop layout is attractive and legible, with no touch controls or accessible canvas labels.

### 46. Muse Spark 1.3 (xhigh) — 7.35

Run ID: `muse-spark-1.3-contributor-xhigh`. Summary: **Hard drop erases spin credit; mini/PC gaps, hidden lock-out, soft-drop jump and phone clipping**.

Strengths:

- Canonical SRS states, seven-bag, hold/queue, ghost geometry, exact hard-drop points, normal scoring, gravity/levels, blocked spawn and R restart are present in [`src/game.ts`](muse-spark-1.3-contributor-xhigh/src/game.ts). All five pass the ledge-move mid-air lock probe.
- Isolated builds and all declared own tests pass; the full required desktop key flow and R restart respond without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): Hard drop loses T-spins; mini and perfect-clear scoring are incomplete.** After a real final rotation into a legal grounded full-spin slot, zero-travel hard drop scores 0/100 for zero/single clears rather than 400/800 because hardDrop clears lastActionRotate before scoring. Timed locking scores full spins correctly but treats minis as full (400/800 rather than 100/200). A perfect-clear single scores 100 instead of 900. These related scoring defects receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 20 rows and earns 20 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 515 px. The board content fits at x=45 (304×604 frame at x=43), but hold starts at x=−113 and next at x=363; supporting state is clipped. Scoring effect: `7.5 → 7.0`.

Test gaps and rationale:

All **14 own cases / 207 test lines** pass, but tests **6.0** reflects assertion strength. Twenty unseeded bag invariants, left wall blocking, a T floor-rotation success requiring a kick, floor ghost/collision, hold restriction/post-lock availability, a normal line, exact level crossing, blocked spawn and a manually flagged three-corner helper are useful. `cellsFor(kind,4)` normalizes directly to rotation 0, so its cycle case does not perform four engine rotations. Hard-drop and line points are loose bounds. The gravity assertion ends in `lines >= 0`, and the lock-delay assertion does too; both are vacuous. Its `update(2)` / `update(1)` calls also exceed the 0.1 s cap, so they would not establish the named boundaries. There is no soft-point/timing, exact drop, spin scoring integration, B2B/combo/PC, actual cap/ledge, hidden lock-out, restart or browser test.

Code **8.5**, simplicity **8.0**: **868 source TS lines**, focused typed board/geometry/engine/input/renderer modules and no runtime dependencies. Public mutable engine fields, duplicate spawn/hold setup and several redundant scoring assignments add modest weight. UX **8.5** reflects a clean grid/ghost, DOM stats, five previews, full keyboard legend, custom DAS/ARR and a correctly toggled DOM game-over overlay. No touch controls, canvas labels or high-DPI sizing is supplied.

Exact engine/browser fixtures and isolation context are in the [Muse contributor audit](.audit/muse-review.md). Each finding is charged only to correctness.

### 47. GPT-6.1 Terra (low) — 7.30

Run ID: `gpt-6.1-terra-low`. Summary: **Canonical SRS and basic modern scoring; mini/PC omissions, early landing lock and premature partial lock-out; compressed source**.

Scores (correctness/tests/code/simplicity/browser UX): **8.0/5.0/7.0/9.0/8.0**.

- **Minor (−0.5 correctness): Mini T-spins receive full-spin scores.** Actual final CW from T r3,(3,17) into the grounded mini pocket scores400/800 for zero/single instead of100/200 through hard and timed lock. Stack(5,17),(3,19),(5,19); add row18 outside x3..5 for single. Low uses a binary three-corner classifier. Full zero/single/double and ordinary B2B/combo pass.
- **Minor (−0.5 correctness): The benchmark perfect-clear bonus is absent.** Horizontal I r0,(3,18), row19 except x3..6: zero-travel hard drop empties the field but scores100 instead of900. Tetris/no-clear/Tetris-PC totals2000 instead of5200. Full spins, ordinary B2B/combo and pre-clear multipliers pass; PC variants are one omission.
- **Minor (−0.5 correctness): Landing frames charge pre-contact time to lock delay.** O r0,(3,17), advance990 ms in <=16 ms parts, then16 and483: zero welded cells at1489; another1 ms welds four at1490 instead of1500. Engine and unchanged Chromium RAF agree; ordinary499/500, successful/failed resets, fifteen-cap and pre-cap ledge safety pass.
- **Minor (−0.5 correctness): A partially hidden legal lock incorrectly ends the game.** Stack(1,2),(3,0),(9,3),(8,1),(1,3),(2,3); actual T spawn(3,0); CW,CW,Left,CCW,CCW,Left,CW,CW,Right reaches grounded r2,(1,-2), three hidden/one visible cells. Incoming I(3,0) is independently open. Zero-travel hard drop sets over=true because lock rejects any hidden cell. Real browser keys agree.

Correctness: `10 − 4×0.5 = 8.0`. Weighted: `3.20 + 1.00 + 1.40 + 0.90 + 0.80 = 7.30`.

Tests **5.0**: nine narrow behavioral smoke assertions; all pass. Audit probes do not earn own-test credit. Code **7.0**, simplicity **9.0**, UX **8.0**: strict injected-RNG engine with compressed long methods; direct design and readable responsive three-preview UI.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 48. DeepSeek OMP/PI — 7.30

Strengths:

- The strongest smoke suite in the original cohort: 12 behavior groups cover seven bags, spawning, gravity, wall movement, actual T and I kicks, drop scoring, normal line clears/levels, hold, blocked-spawn top-out/restart, and next queue behavior.
- Canonical orientation/kick data is separated cleanly across [`tetromino.ts`](deepseek-pi/src/tetromino.ts), [`board.ts`](deepseek-pi/src/board.ts), and [`game.ts`](deepseek-pi/src/game.ts).
- Desktop presentation is clear and polished, with distinct colors, a legible ghost, hold, five-piece next queue, and a complete keyboard legend.

Confirmed bugs:

- **Major (−1.5 correctness): a piece can lock while airborne after moving off a ledge.** Reproduction: ground a piece on a narrow support, move it sideways into empty space, then advance time beyond the 500 ms delay. `move()` resets the timer but leaves `grounded` true, so `update()` locks the piece without rechecking whether it can descend. The isolated engine probe reproduced this directly. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): Guideline scoring is substantially incomplete.** [`game.ts`](deepseek-pi/src/game.ts) awards drop points and the basic single/double/triple/Tetris table only; it has no T-spin, back-to-back, combo, or perfect-clear scoring. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): the narrow layout overflows horizontally.** At a 390 px viewport, `documentElement.scrollWidth` was 501 px and both side panels were clipped off-screen rather than reflowing. Scoring effect: `7.0 → 6.5`.

Test gaps and rationale:

- Despite being the best suite overall, it has no lock-delay/ledge test, advanced scoring tests, reset-limit test, or browser assertions. The current hard-drop test exercises the same projection used by the ghost but does not validate rendering.
- The multi-file split is readable but more verbose than Sol Codex. Browser UX is good on desktop and materially weaker on a phone-sized viewport.

### 49. GPT-6 Luna (max) — 7.25

Summary: **Wrong I kicks; B2B perfect-clear, stale soft-drop spin, timing and phone preview defects**.

Scores (correctness/tests/code/simplicity/browser UX): **6.5/5.5/9.0/8.5/9.0**.

Tests **5.5**: four deterministic cases assert one complete bag, hold restriction/post-lock availability, exact hard-drop distance/points/four welded cells and blocked incoming spawn. These are substantially stronger than low, but omit rotations/kicks, independent obstructed ghost, soft movement/timing, any line/advanced score, lock timing/reset cap/ledge, gravity/levels, hidden lock-out, restart and browser behavior. Code **9.0**, simplicity **8.5**: 678 source TS lines, strict DOM-free class engine, injected RNG and focused browser renderer/input in two direct modules; mutable snapshots and repeated replacement setup add modest maintenance cost. UX **9.0**: labeled high-DPI board/previews, grid/ghost, five previews, complete legend, custom DAS/ARR, blur cleanup, DOM score/combo/B2B/progress, a correct overlay and responsive scrolling panels. No touch UI. The preview defect is deducted only from correctness.

Confirmed findings:

- **Major: Two I kick transitions use the opposite direction data.** The I 0>3 and 3>0 tables are wrong; all 28 orientations and other tables pass. I r0 at (3,10) with stack (4,10) rotates CCW to x=4 instead of x=2. I r3 at (3,10) with stack (3,11) rotates CW to x=5 instead of x=4; a right-wall r3-to-0 rotation also fails when canonical SRS succeeds.
- **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** A Tetris, no-clear lock and zero-travel Tetris perfect clear total 4000 instead of 5200. The final placement receives the ordinary 2000 PC bonus instead of 3200; ordinary single PC, full/mini/B2B/combo and level crossing pass.
- **Minor: Manual soft drop preserves stale T-spin credit.** Rotate a T clockwise in open space, then manually soft-drop it into a grounded mini-corner pose and hard-drop zero rows. The engine adds 100 spin points on top of the soft-drop rows, even though the last successful manual action was downward movement. softDropStep and held-soft tick descent never clear lastAction=rotate; xhigh correctly awards zero spin points for the same fixture.
- **Minor: Starting held soft drop consumes earlier normal-gravity time.** After fifty 16 ms normal ticks, an O has not moved. Real ArrowDown moves one row immediately; one further millisecond with soft held takes it all the way to the floor: 18 rows and 18 points in total. The 800 ms accumulator is reused at the new 30 ms interval. Engine and real Chromium input reproduce it.
- **Minor: Phone next previews are painted at obsolete widths and squashed.** At 390×844, adding the five flex queue items one at a time paints backing widths 310/155/103/77/61 px, but every final canvas is about 61.2 px wide. Five identical I previews paint CSS widths about 13.03/26.46/39.81/40.54/35.12 px, with inconsistent block aspect ratios. paintQueue caches these drawings after sibling insertion shrinks the earlier canvases; desktop widths are stable.

Exact fixtures, coverage and scoring rationale are in the [GPT-6 Luna audit](.audit/gpt6-luna-review.md).

### 50. Muse Spark 1.3 (medium) — 7.05 — `muse-spark-1.3-contributor-medium` (from scratch)

Run ID: `muse-spark-1.3-contributor-medium` (**medium, from scratch**). Summary: **From scratch: no T-spins, B2B or perfect-clear bonus; hidden lock-out, soft jump and preview/phone clipping**.

Strengths:

- Canonical SRS states, seven-bag, hold/queue, ghost geometry, exact hard-drop points, normal scoring, gravity/levels, blocked spawn and R restart are present in [`src/game.ts`](muse-spark-1.3-contributor-medium/src/game.ts). All five pass the ledge-move mid-air lock probe.
- Isolated builds and all declared own tests pass; the full required desktop key flow and R restart respond without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): T-spin, back-to-back and perfect-clear scoring are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 rather than full 400/800 and mini 100/200. Two Tetrises separated by a no-clear lock total 1600 instead of 2000; a perfect-clear single scores 100 instead of 900. Combos work. These absent features receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 16 rows and earns 16 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 537 px. The 300×600 board fits at x=45, but the hold canvas starts at x=−115 and next at x≈372.69, clipping supporting state. Scoring effect: `7.5 → 7.0`.
- **Minor (−0.5 correctness): I-piece hold and next previews are clipped.** The medium-from-scratch renderer uses 88 px preview canvases, but the fourth I cell is drawn at x=74 with width=20, ending at x=94. Browser draw observations and the cyan right-edge pixel confirm 6 px of that cell are clipped in both hold and next. Scoring effect: `7.0 → 6.5`.

Test gaps and rationale:

The **10 smoke groups / 123 test lines** earn tests **5.5**. Three deterministic bag invariants, board boundaries/clear, one game wall, hold restriction and blocked spawn are meaningful. All 28 shape tests count four cells without a coordinate oracle; rotation asserts only `typeof result === boolean`. Hard drop uses `>= distance*2`, forced scoring locks an airborne piece beside an already-full row without checking points, and the gravity assertion ends in `game.board !== null`, so it passes regardless of movement. There is no real kick, independent obstructed ghost, exact scoring, post-lock hold swap, lock timing/cap/ledge, soft timing, level, hidden lock-out, restart or browser assertion.

Code **8.5**, simplicity **8.5**: **643 source TS lines**, focused typed modules, a simple board abstraction, a cloned board helper and no runtime dependencies. State is publicly mutable and spawn/hold/restart duplicate setup. UX **8.0** reflects readable desktop panels, five previews, DOM scores and a complete keyboard legend; side movement ignores OS repeats and has no custom auto-shift. There are no canvas labels, high-DPI sizing or touch controls. This **from-scratch** run is `muse-spark-1.3-contributor-medium`; the **8.40 reference-assisted** `muse-spark-1.3-medium` was not rescored.

Exact engine/browser fixtures and isolation context are in the [Muse contributor audit](.audit/muse-review.md). Each finding is charged only to correctness.

### 51. GPT-6.1 Terra (medium) — 6.90

Run ID: `gpt-6.1-terra-medium`. Summary: **Canonical SRS/full-mini scoring; missing PC, stale spin, landing/refresh clocks, terminal engine mutation and stretched previews**.

Scores (correctness/tests/code/simplicity/browser UX): **7.0/5.0/7.0/8.5/8.5**.

- **Minor (−0.5 correctness): The benchmark perfect-clear bonus is absent.** Horizontal I r0,(3,18), row19 except x3..6: zero-travel hard drop empties the field but scores100 instead of900. Tetris/no-clear/Tetris-PC totals2000 instead of5200. Full spins, ordinary B2B/combo and pre-clear multipliers pass; PC variants are one omission.
- **Minor (−0.5 correctness): Landing frames charge pre-contact time to lock delay.** O r0,(3,17), advance990 ms in <=16 ms parts, then16 and483: zero welded cells at1489; another1 ms welds four at1490 instead of1500. Engine and unchanged Chromium RAF agree; ordinary499/500, successful/failed resets, fifteen-cap and pre-cap ledge safety pass.
- **Minor (−0.5 correctness): Manual soft drop preserves stale T-spin credit.** Stack(0,17),(0,19),(2,19), T r0,(0,3), actual CW and successful manual soft drops until grounded r1,(0,17), then zero-travel hard drop:100 extra mini points instead of0. Same corner pose with no rotation credit scores0. Engine and Chromium reproduce it without assigning spin flags.
- **Minor (−0.5 correctness): Discarded gravity remainder makes falling refresh-dependent.** O(3,0), level10,600 ms of unchanged main callbacks:9 rows at60 Hz versus8 at144 Hz. Level15 over100.001 ms yields6/5. fall is zeroed after one row. First-row curve and accepted16 ms terminal floor pass; Chromium repeats both rates.
- **Minor (−0.5 correctness): Public hard drop mutates the engine after game over.** Block T spawn cell(4,-2), outgoing floor O(0,18), incoming T. First hard drop ends the game; direct engine hardDrop again moves the blocked T down and adds40 points while over stays true. lock guards but hardDrop does not. Real terminal UI keys are inert; Chromium separately repeats the direct engine call.
- **Minor (−0.5 correctness): Hold and next previews are stretched non-uniformly.** Desktop next120x70 backing displays110x70 (cell aspect0.916667). At390x844, hold120x84 displays60x60 (aspect0.7) and next120x70 displays52x55 (0.551515). All16 preview cells paint within their backings and all panels fit width; one preview-aspect deduction.

Correctness: `10 − 6×0.5 = 7.0`. Weighted: `2.80 + 1.00 + 1.40 + 0.85 + 0.85 = 6.90`.

Tests **5.0**: twelve narrow behavioral smoke assertions; all pass. Audit probes do not earn own-test credit. Code **7.0**, simplicity **8.5**, UX **8.5**: strict but compressed engine/entry with main-owned clocks; polished responsive three-preview UI and phone buttons.

All build/test/start, canonical engine and desktop/phone checks passed with the recorded defective outcomes. Full criterion rationale, own-suite coverage, fixtures, browser geometry, generation/isolation context and limits: [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md).

### 52. Space-bunny — 6.75

Strengths:

- A broad rules engine and a well-separated set of board, randomizer, scoring, geometry, input, and rendering modules. It provides five-piece preview, hold, pause, lock-progress feedback, score announcements, a timer, and a responsive canvas layout.
- The broadest new test suite: seeded bags, 700 draws, board operations, drop scoring, hold, line/combo/B2B/perfect-clear integration, gravity, 500 ms lock delay, reset caps, pause, top-out/restart, and a long bot-driven game.
- The only new implementation whose full layout fits the 390 px viewport. Desktop/mobile application assets load cleanly and the exercised keyboard flow has no runtime errors.

Confirmed bugs:

- **Major (−1.5 correctness): several shapes and counterclockwise kicks are not SRS.** The coordinate probe finds `L2`, `L3`, `T1`, `T2`, and `T3` mismatches; `L2` is even T-shaped. Counterclockwise rotation reverses a transition table and mirrors only X, producing incorrect Y kicks. These are grouped as one broken SRS feature. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): the required ghost preview is structurally wrong.** [`ghostCells`](space-bunny/src/game.ts) returns the same Y coordinate for every cell, dropping each shape's local Y offset. An O ghost contains only two distinct coordinates instead of four, and other pieces become flat outlines that do not represent their landing shape. The same function drives rendering. Scoring effect: `8.5 → 7.0`.
- **Major (−1.5 correctness): scoring integration is substantially incorrect.** Full T-spins are classified as mini in ordinary three-corner cases; a final-kick result is accepted even with no occupied corners; no-clear placements break B2B; a level-two combo awards 400 rather than 300; and three held-soft-drop rows award one point rather than three. These related scoring defects receive one grouped deduction, not five deductions. Scoring effect: `7.0 → 5.5`.

Test gaps and rationale:

- Several tests assert the implementation's mistakes: reverse/mirrored CCW tables, a full-spin position labeled mini, and breaking B2B on a no-clear placement. Ghost tests check count/noncollision but not the expected four distinct coordinates. Exact canonical data and independent expected outcomes would substantially improve the suite.
- Its 1,687 source lines and 731 test lines contain considerable rule and rendering machinery. The structure is readable, but size lowers simplicity. The adaptive presentation is polished; its small-screen text is tiny and no touch controls are provided.

### 53. Muse Spark 1.3 (low) — 6.75

Run ID: `muse-spark-1.3-contributor-low`. Summary: **Incorrect kicks and incomplete advanced scoring; soft-drop jump, clipped phone board and overlaid legend**.

Strengths:

- Canonical SRS states, seven-bag, hold/queue, ghost geometry, exact hard-drop points, normal scoring, gravity/levels, blocked spawn and R restart are present in [`src/game.ts`](muse-spark-1.3-contributor-low/src/game.ts). The engine also passes the hidden lock-out fixture; its kick-table defect is separately reproduced below. All five pass the ledge-move mid-air lock probe.
- Isolated builds and all declared own tests pass; the full required desktop key flow and R restart respond without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): Non-I SRS kick offsets are incorrect.** The third offset differs in 2→3, 3→2, 3→0 and 0→3 for every JLSTZ piece (20 table transitions). With T rotation 0 at (3,10) and blockers (4,12),(5,12), CCW produces rotation 3 at (3,8) instead of canonical (4,9). Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): Back-to-back, mini and perfect-clear scoring are incomplete.** Two Tetrises separated by a no-clear lock total 1600 instead of 2000; mini zero/single fixtures score 400/800 instead of 100/200; a perfect-clear single scores 100 instead of 900. Full spins and combos work. These related scoring omissions receive one grouped major deduction. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): Starting soft drop reuses accumulated normal-gravity time.** After fifty 16 ms normal updates, O remains at y=0. Enable soft drop and advance 1 ms: it jumps 20 rows and earns 20 points, consuming preceding normal time at the faster interval. Real Chromium ArrowDown independently reproduces the transition. Scoring effect: `7.0 → 6.5`.
- **Minor (−0.5 correctness): The phone layout clips the left side of the playfield.** At 390×844, document width is 505 px. The fixed 620×600 canvas starts at x=−115 and its 280×560 board starts at x=−95, clipping 95 px of the playfield. On-screen buttons reflow, but the canvas does not. Scoring effect: `6.5 → 6.0`.
- **Minor (−0.5 correctness): Canvas legend overlaps the playfield and statistics.** Renderer paints the legend at canvas x=184 with baselines y=544,560,576, inside the board rectangle x=20–300,y=20–580. The second line extends across the LINES statistic. Forwarded fillText bounds and desktop screenshots independently confirm the overlap. Scoring effect: `6.0 → 5.5`.

Test gaps and rationale:

All **11 own cases / 136 test lines** pass. Tests **6.0**: four seeded bag invariants, board emptiness/clear helper, empty-board CW/CCW state changes, hold restriction, blocked spawn and eventual falling/locking are meaningful. Soft drop asserts only an increased score, the normal clear uses `>=100`, ghost checks only a lower Y and the rotation test titled “wall kick” rotates on an empty board. There is no actual kick displacement, exact drop/scoring, post-lock hold swap, lock boundary/cap/ledge, level cadence, advanced scoring, hidden lock-out, restart or browser assertion.

Code **8.5**, simplicity **8.0**: **839 source TS lines** with focused board, bag, geometry, engine, input and renderer modules, strict typing and no browser runtime dependencies. Mutable state, duplicate spawn/hold-reset paths, a redundant `Bag.take` alias and unused kick metadata add modest machinery. UX **8.5** reflects clear blocks/ghost, five previews, custom DAS/ARR, device-pixel-ratio sizing and visible click controls plus a DOM legend. The distinct layout and overpaint findings are charged only to correctness. Touch/physical-device behavior was not certified.

Exact engine/browser fixtures and isolation context are in the [Muse contributor audit](.audit/muse-review.md). Each finding is charged only to correctness.

### 54. GPT-5.6 Luna (high) — 6.70

Run ID: `gpt-5.6-luna-high`. Summary: **Canonical SRS and working controls; scoring, gravity, contact timing and overlapping previews fail**.

Scores (correctness/tests/code/simplicity/browser UX): **5.5/5.0/9.0/8.5/8.5**.

Tests **5.0**: the uncounted engine assertion script passes one fixed-random bag helper, a clear helper, four-cell counts at r0/r1, gravity-helper monotonicity, initial spawn/queue, first/restricted hold, positive hard-drop score and a non-null next piece. These are real engine assertions, unlike GPT-6 Luna high’s text checks. There are no exact coordinates/kicks, walls/drop points/cells, post-lock held retrieval/reset, ghost, line/advanced score, precise timing/cap/ledge, levels, top-out/restart or browser assertions.

Code **9.0**, simplicity **8.5**: **473 source TS lines**, strict types, DOM-free board/engine, copied snapshots, injected RNG and separate DOM entry. Every render recreates board/preview nodes; public state remains mutable. UX **8.5**: distinct beveled cells, labeled board/hold/next, ghost/stats, full legend, pause/restart and fitting phone reflow. Native repeat and no touch UI. The next panel is scroll-reachable; its overlap is charged only to correctness.

Confirmed findings:

- **Major: Spin history, mini, B2B-combo and perfect-clear scoring are incomplete.** The engine recognizes any three-corner T lock as a full spin without requiring a final rotation: a non-rotated corner lock awards 400 instead of zero, and mini zero/single score 400/800 instead of 100/200. Two consecutive non-PC Tetrises total 2075 instead of 2050 because B2B multiplies the combo bonus too. A single perfect clear scores 100 instead of 900. Full spins, ordinary B2B/no-clear continuity and level-two combo otherwise pass. These related scoring errors are one grouped major finding.

- **Major: Gravity uses the NES frame table instead of the Guideline curve.** Actual level 1/2/5/10 first rows occur at 800/717/467/100 ms rather than 1000/793/about 355.197/64.152 ms. getGravityInterval uses frames [48,43,38,...] at 60 Hz. Level progression and equal-duration 60/144 Hz falling otherwise work.

- **Minor: Natural floor contact starts the lock clock one gravity step late.** With O one row above the floor, it lands at 800 ms but does not lock until another 1299 ms, about 800 ms later than the 500 ms contact delay. A successful gravity step sets grounded=false; only the next blocked fall marks contact. An already marked-grounded O passes 499/500 ms, capped resets and ledge safety.

- **Minor: A wholly hidden legal lock does not end the game.** T spawn (3,0), stack (2,2),(3,3),(4,3); real CW, CCW, three left moves and zero-distance hard drop lock T entirely in hidden rows 0–1 at x=0..2. The next I spawn is independently open; gameOver remains false.

- **Minor: Next-piece previews overlap at desktop and phone widths.** renderNext inserts three 70 px-wide four-column .next-row grids into a .mini-board whose columns are only 22 px wide with 3 px gaps. Three identical I previews have real intersecting filled-cell rectangles; adjacent preview origins are 25 px apart. Screenshots and deterministic DOM geometry confirm overlap at both sizes. The phone queue is reachable by scrolling, not clipped off-screen.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### 55. Muse Spark 1.3 (minimal) — 6.65

Run ID: `muse-spark-1.3-contributor-minimal`. Summary: **Canonical core geometry; incomplete scoring, lock resets and soft timing, hidden lock-out and phone clipping**.

Strengths:

- Canonical SRS states, seven-bag, hold/queue, ghost geometry, exact hard-drop points, normal scoring, gravity/levels, blocked spawn and R restart are present in [`src/tetris.ts`](muse-spark-1.3-contributor-minimal/src/tetris.ts). All five pass the ledge-move mid-air lock probe.
- Isolated builds and all declared own tests pass; the full required desktop key flow and R restart respond without application errors.

Confirmed bugs:

- **Major (−1.5 correctness): T-spin scoring and perfect-clear bonuses are incomplete.** A legal final-rotation full T-spin with no clear scores 0 instead of 400; a mini single scores 800 instead of 200 and mini zero scores 0 instead of 100. A zero-distance perfect-clear single scores 100 instead of 900. Full spin singles, B2B and combos work; these scoring omissions receive one grouped major deduction. Scoring effect: `10.0 → 8.5`.
- **Minor (−0.5 correctness): Grounded movement and rotation do not reset lock delay.** Rest O at physical left 4,top 20 for 490 ms, move right, then advance 20 ms. It locks after only 20 ms at the new position; grounded actions preserve the old timer rather than resetting it. The ledge probe stays airborne correctly. Scoring effect: `8.5 → 8.0`.
- **Minor (−0.5 correctness): Soft drop advances once per frame instead of elapsed time.** With soft drop enabled on an empty field, one update(16) moves/scores one row; sixteen update(1) calls over the same 16 ms move/score sixteen rows. The successful-soft-move branch ignores dt. Scoring effect: `8.0 → 7.5`.
- **Minor (−0.5 correctness): A wholly hidden lock does not end the game.** Spawn T with next I and stack cells (2,2),(3,3),(4,3). CW, CCW, then three left moves legally reach T rotation 0,x=0,y=0, wholly in hidden rows 0–1 and grounded. Zero-distance hard drop continues with an independently verified open I spawn; blocked-spawn top-out works. Scoring effect: `7.5 → 7.0`.
- **Minor (−0.5 correctness): Supporting panels are clipped on phones.** At 390×844, document width is 501 px. The 300×600 board fits at x=45 (304×604 frame at x=43), but hold canvas starts at x=−102 and next at x=372; supporting state is clipped. Scoring effect: `7.0 → 6.5`.

Test gaps and rationale:

The **3 smoke groups / 41 test lines** earn tests **4.5**. Four calls to the fixed-random bag helper assert uniqueness; movement asserts one left step and top-out fills the spawn. Rotation checks only cell/table counts and accepts either rotation 0 or 1. The ghost assertion is only `ghostY >= active.y`; hold checks only that something was stored and then forcibly re-enables availability. The forced-line case locks an airborne piece and asserts `lines >= linesBefore`, which cannot establish a clear or score. No hard-drop method is actually called. There are no exact drop, legal scoring, kick displacement, timing/reset-cap/ledge, level, restart or browser assertions.

Code **7.5**, simplicity **8.5**: **358 source TS lines**, strict types, a small DOM-free engine and a direct entry/renderer make local reading straightforward. Dead `rotateCCW`, drawing/input helpers and an unused held set, two hard-drop methods (one with `2 * 0` placeholders), self-assignment and repeated reset/hold setup are maintainability costs independent of the confirmed behavior deductions. UX **8.0** reflects a readable plain desktop board, ghost, DOM scores, five previews, complete legend and custom DAS/ARR. It lacks canvas labels, high-DPI scaling, touch controls and grid lines. The engine's short size does not substitute for test coverage.

Exact engine/browser fixtures and isolation context are in the [Muse contributor audit](.audit/muse-review.md). Each finding is charged only to correctness.

### 56. GPT-5.6 Luna (max) — 6.65

Run ID: `gpt-5.6-luna-max`. Summary: **Broad scoring and responsive panels; inverted kick Y, later gravity, B2B-PC, hidden lock and overlay defects**.

Scores (correctness/tests/code/simplicity/browser UX): **5.5/5.0/9.0/8.0/8.5**.

Tests **5.0**: the uncounted deterministic smoke script passes board dimensions, one complete bag through real hard drops, five previews, first/restricted/post-lock hold availability, changed active type and loose left/right origin bounds. Gravity accepts y >= startingY, including no fall. No rotation/kick, exact drops/soft points/cells, independent ghost, held retrieval/orientation reset, line/advanced score, precise gravity/levels, timing/cap/ledge, top-out/restart or browser assertions exist.

Code **9.0**, simplicity **8.0**: **1,017 source TS lines**, strict DOM-free engine, separate renderer/input, defensive RNG normalization, copied snapshots and an event-ordered remaining-time clock. Matrix copies, repeated state access and the drawing module add proportionate machinery. UX **8.5**: rounded shaded blocks, outline ghost, labeled board/hold/five previews, full legend, pause/restart/status and fitting scrolling phone panels. Native repeat, no high-DPI scaling, focus cleanup or touch UI. The overlay defect is charged only to correctness.

Confirmed findings:

- **Major: Every SRS kick transition applies vertical offsets in the wrong direction.** All 28 basic states are canonical, but all 48 non-O ordered transition lists fail the Y-down oracle. Tables store positive Y upward while rotate adds kickY to board Y. A floor I r0 at (3,20) fails CW entirely; canonical SRS reaches r1 at (4,18). A floor T r0 at (3,20) reaches (3,18) instead of canonical (2,19). Wall kicks with zero vertical displacement can still pass.

- **Major: The gravity table diverges from the Guideline curve at later levels.** Levels one/two/five match 1000/793/355 ms, but actual first rows at levels 9/10/14 are 99/72/21 ms, instead of about 93.882/64.152/11.439 ms (or the accepted 16 ms fast floor). The later table values are a different progression; the 16 ms terminal floor itself is not penalized. Levels and 60/144 Hz independence pass.

- **Minor: B2B Tetris perfect clear uses the ordinary bonus.** Tetris, a no-clear lock, then zero-distance Tetris perfect clear total 4000 instead of 5200. The last placement awards 1200 B2B clear plus 2000 ordinary PC, instead of 1200 plus 3200 B2B PC. Ordinary single PC 900 and full/mini/B2B/combo scoring pass.

- **Minor: A wholly hidden legal lock does not end the game.** T spawn (3,0), stack (2,2),(3,3),(4,3), CW,CCW,left three times ends T wholly in hidden rows 0–1 at x=0..2. Incoming I is independently open. Zero-travel hard drop leaves gameOver=false; lockPiece writes the cells and only checks the next spawn.

- **Minor: The game-over overlay is visible during active play.** At desktop and phone widths, after reload and after real R restart, gameOver=false and #game-overlay.hidden=true, but computed display is grid and Game over covers the live board. The .game-overlay display:grid rule overrides the native hidden presentation. This matches the predecessor Luna Codex overlay finding.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### 57. GPT-6 Luna (xhigh) — 6.65

Summary: **Wrong I kick and gravity; hidden lock-out, B2B perfect-clear and phone next gaps**.

Scores (correctness/tests/code/simplicity/browser UX): **5.5/4.5/9.0/8.5/9.0**.

Tests **4.5**: 2 of 3 own tests pass. Hold restriction/post-lock availability and a completed-row hard drop are meaningful, but no points are asserted. The deterministic seed-1234 bag case tops out on drop 11; its last three observations repeat I, so the second group contains five types. Clearing the board between real spawns passes 100 bags, establishing a broken test fixture rather than a randomizer defect. No complete SRS/kick, ghost, scoring, timing/cap/ledge, level, hidden-lock-out, restart or browser test exists. Code **9.0**, simplicity **8.5**: 628 source TS lines, a DOM-free functional state engine and readable entry/renderer, seeded PRNG, consistent milliseconds, strict configuration and no runtime dependencies. Mutable state and repeated spawn/hold setup are modest costs. UX **9.0**: labeled grid/ghost, five desktop previews, full legend, DAS/repeat and blur cleanup, restart and visible phone pointer controls. Phone queue loss is charged only to correctness.

Confirmed findings:

- **Major: The I 0-to-L kick transition is incorrect.** All 28 basic states are canonical, but the I 0>3 table copies 0>1. With I at rotation 0,(3,10) and a stack cell (4,10), real CCW reaches rotation 3,(1,10); canonical SRS chooses (2,10). The other seven I transitions and all non-I tables pass.
- **Major: Gravity follows a different progression.** The engine uses 1000/level through level 9, followed by 9*1.32^(level-9) cells/second. Actual first-row boundaries at levels 1/2/5/10 are 1000/500/200/85 ms, versus 1000/793/about 355.197/64.152 ms. Equal-time frame-rate checks otherwise agree.
- **Minor: A wholly hidden lock does not end the game.** From the real T spawn (3,0), stack (2,2),(3,3),(4,3); CW, CCW, three left moves reach a grounded T wholly in hidden rows 0–1. The incoming I spawn is independently open. Zero-travel hard drop leaves gameOver=false; lockPiece only tests y<0, not the hidden-row boundary at 2.
- **Minor: Back-to-back Tetris perfect clear uses the ordinary bonus.** A Tetris, no-clear lock and zero-travel Tetris perfect clear total 4000, versus 5200: the last clear earns 1200+2000 instead of 1200+3200. Ordinary single PC, full/mini spins, B2B, combo and pre-clear-level scoring pass.
- **Minor: The phone stylesheet hides the entire next queue.** At 390×844, the board fits at x=13 with size 249×498 and hold remains visible, but .right-column has display:none and all five next canvases have zero bounds. Desktop previews work.

Exact fixtures, coverage and scoring rationale are in the [GPT-6 Luna audit](.audit/gpt6-luna-review.md).

### 58. GPT-5.6 Terra (xhigh) — 6.40

Run ID: `gpt-5.6-terra-xhigh`. Summary: **Canonical SRS; scoring, gravity/lock clocks, restart bag and preview rendering fail**.

Scores (correctness/tests/code/simplicity/browser UX): **4.5/5.5/9.0/8.5/8.5**.

Tests **5.5**: six deterministic functions check a real first seven-piece bag, a T CCW wall kick with a loose final-x assertion, actual hard-drop single/line count with score>=100, first/restricted hold, blocked next spawn, left boundary and an O four-cell count. There is no exact drop point/cell assertion, independent ghost, hold retrieval, lock clock/cap/ledge, exact normal/advanced scoring, gravity/levels, restart, input or browser test. This matches the meaningful but narrow 5.5 suites.

Code **9.0**, simplicity **8.5**: **440 source TS lines** excluding **65 test lines**, clear typed engine/entry modules, generated rotations, injected RNG, consistent milliseconds, strict checks and no runtime dependencies. The event result type is useful; mutable state and timing split across engine and main require coordination. The implementation stays readable without excessive layering.

UX **8.5**: labeled beveled board and canvases, grid/ghost, DOM stats, complete legend and live status; all panels reflow below the phone board and are reachable by vertical scrolling. Native repeat, no touch UI/high-DPI sizing/blur cleanup. The broken preview content is charged once to correctness.

Confirmed findings:

- **Major: Hard drop loses T-spins; mini, B2B continuity and perfect clears are incomplete.** Legal final-rotation full/mini zero/single hard drops score 0/100. Timed full spins score 400/800 but minis also score 400/800 instead of 100/200; full double is 300 through hard drop versus 1200 timed. A no-clear lock breaks B2B, so separated Tetrises total 1600 rather than 2000; single PC is 100 rather than 900. These related scoring errors form one major deduction.

- **Major: High-level gravity stops accelerating at 50 ms per row.** The curve matches through level ten; levels 14/15/20 all first fall at 50 ms instead of 12/8/1 ms at integer resolution. The 50 ms floor is slower than the curve and the accepted 16 ms fast floor.

- **Minor: A gravity tick bypasses the reset grounded lock delay.** A floor O waits 490 ms, moves right, waits 490 ms, moves left, then locks only 20 ms later at absolute 1000 ms. tickGravity locks immediately on a blocked gravity step despite the newly reset groundedElapsed. Ordinary 499/500 ms locking and ledge safety pass; rapid fifteenth-reset locking shares this policy finding.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over 600 ms, unchanged frame callbacks move O nine rows at 60 Hz and eight at 144 Hz; the browser independently agrees. gravityElapsed is zeroed after a fall.

- **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (0,1),(0,0),(8,0),(2,2),(8,1),(9,2); left,left,CW,CW,CW,CW from the real (3,0) spawn ends r0 at (0,-2).

- **Minor: Preview offsets are multiplied by cell size twice.** For an I hold, all draws begin at backing y=152, below the 112 px canvas, leaving zero painted pixels. Next slots start at y=152/1634/3116/4598/6080 in a 420 px canvas: only the first of five is visible. Actual draws and pixel reads reproduce this at desktop and phone sizes.

- **Minor: Restart preserves a partially consumed seven-bag.** With seed 42, eleven real hard drops reach game over. Real R/reset opens J,Z,Z,T,L,I,J: five types, with O and S absent. reset clears the preview queue but retains the readonly SevenBag and its remaining entries. A new game should start a fresh seven-piece bag; the other five runs do. Engine and real Chromium Space/R reproduce this.

Full fixtures, scoring rationale, limitations and generation context: [gpt56 terra audit](.audit/gpt56-terra-review.md).

### 59. GPT-6 Luna (high) — 5.90

Summary: **Basic-only scoring, wrong and refresh-dependent gravity; airborne moves exhaust lock resets**.

Scores (correctness/tests/code/simplicity/browser UX): **6.0/1.5/7.5/8.5/8.5**.

Tests **1.5**: the own suite is five regular-expression assertions against HTML and emitted JavaScript text. It never imports/executes the engine, constructs a game, sends an input or asserts a rule. A passing build and matching class/function names do not establish gameplay coverage. Code **7.5**, simplicity **8.5**: 261 source TS lines, direct strict types and readable methods without runtime dependencies; one DOM-coupled class mixes simulation, input effects and canvas/DOM rendering, and recreates three next canvases every frame. UX **8.5**: clear grid/ghost, hold, three next previews, DOM stats, a full control panel, pause/sound/restart buttons and accessible scrolling phone reflow. Native key repeat, no high-DPI adaptation or touch UI.

Confirmed findings:

- **Major: T-spins, back-to-back, combos and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900.
- **Major: Gravity follows the wrong curve.** The real frame method first moves an O at 800/656 ms at levels 1/2, rather than 1000/793 ms, and uses max(45,800*0.82^(level-1)). Levels still increase every ten cleared lines.
- **Minor: Discarded gravity remainder makes falling depend on refresh rate.** At level 15, the unchanged requestAnimationFrame callback advances a free O 12 rows at 60 Hz but 10 at 144 Hz over the same 600 ms. frame resets dropAccumulator to zero after each step instead of preserving its remainder. This is separate from the incorrect gravity equation.
- **Minor: Airborne actions consume the grounded lock-reset allowance.** Fifteen alternating successful moves near spawn set lockResets=15 before contact. After the same piece reaches the floor and waits 490 ms, a move cannot reset the timer; 20 ms later it locks. Ordinary 499/500 ms locking, the grounded fifteen-reset cap and ledge mid-air safety pass.

Exact fixtures, coverage and scoring rationale are in the [GPT-6 Luna audit](.audit/gpt6-luna-review.md).

### 60. GPT-6 Luna (low) — 5.65

Summary: **Wrong SRS pivots, basic-only scoring and gravity; erased next previews and hidden phone hold**.

Scores (correctness/tests/code/simplicity/browser UX): **4.5/4.0/7.0/8.5/8.0**.

Tests **4.0**: four shallow cases assert start/queue length, first hold/restriction/post-lock availability, a hard-drop count and four rotations ending with a non-null active piece. Score >=0 is vacuous; the test named hold swap never retrieves the held piece. No bag distribution, exact geometry/kick/drop score, independent ghost, timing, lines/advanced scoring, gravity/levels, top-out/restart or browser assertion. Code **7.0**, simplicity **8.5**: a strict DOM-free engine and direct browser entry, 71 physical TS lines, but many very long compressed methods and a duplicated seven-shape table impede maintenance. UX **8.0**: clear labeled board/grid/ghost/stats and desktop hold, native key repeat, best-score storage and restart; the legend omits several required aliases and there is no custom DAS/ARR, high-DPI sizing or touch UI. Confirmed preview/phone defects are charged only to correctness.

Confirmed findings:

- **Major: Fifteen non-I/O rotation states use a 4×4 pivot instead of SRS.** The independent 28-state oracle fails J/L/S/T/Z rotations 1, 2 and 3. Every non-O piece rotates with [3-y,x], although these five pieces require [2-y,x]. The kick offsets are canonical but cannot repair the incorrect basic orientations.
- **Major: T-spins, back-to-back, combos and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900.
- **Major: Gravity uses the wrong exponential curve.** Actual one-row boundaries at levels 1/2/10 are 1000/800/135 ms, versus 1000/793/about 64.152 ms. The engine uses max(50,1000*0.8^(level-1)), with a much slower high-level progression than the benchmark profile.
- **Minor: Each next preview erases the earlier previews.** A real render makes six full-canvas clears in #next: the outer clear and one per queued piece. Only twelve fillRect calls (four cells with shading) remain after the final clear, so only the fifth queued piece is visible instead of the upcoming queue, at both viewport sizes.
- **Minor: The phone layout hides the hold display.** At 390×844 the board fits at x=77 with size 300×600 and document width 390, but #hold has display:none and zero bounds. This is one responsive supporting-state defect.

Exact fixtures, coverage and scoring rationale are in the [GPT-6 Luna audit](.audit/gpt6-luna-review.md).

### 61. Beam — 5.60

Strengths:

- Canonical SRS orientation/kick data, seven-bag generation, hold, five-piece queue, ghost projection, hard drop, blocked-spawn detection, and restart are present.
- A compact implementation with few build dependencies. The browser starts and accepts the required movement, rotation, hold, and drop controls.

Confirmed bugs:

- **Major (−1.5 correctness): moving a grounded piece prevents normal timed locking.** [`resetLockDelay`](beam/src/game.ts) stores `Date.now()`, but `updateLockDelay` receives `requestAnimationFrame`/`performance.now()` time. After a grounded move the lock timestamp is about 10¹² ms larger than the comparison clock. The piece remains unlocked even after a simulated nine-second wait. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): scoring uses a classic table and omits required modern scoring.** Normal clears award 40/100/300/1200 instead of 100/300/500/800 at the initial level multiplier. Soft-drop points are returned but ignored, and no T-spin, B2B, combo, or perfect-clear scoring exists. This is one grouped scoring deduction. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): narrow-screen panels are clipped.** Document width is 467 px at 390 px, with the hold canvas beginning at x≈−77. Scoring effect: `7.0 → 6.5`.
- **Minor (−0.5 correctness): a stray `EOF` marker is visibly rendered.** It appears after the closing HTML and creates an extra flex item on desktop. Scoring effect: `6.5 → 6.0`.

Test gaps and rationale:

- Only five small tests cover board dimensions, initial spawn/queue, generic matrix rotation, one bag, and a full-row clear. There are no real input/rotation, drop, hold restriction, timing, scoring, top-out/restart, or browser assertions.
- Broad `any` casts, duplicate rendering paths, unused imports, and empty placeholder helpers lower code quality. The implementation remains small, but dead code weakens local reasoning. Presentation is basic and readable, with a small board and little accessibility support.

### 62. GPT-5.6 Sol (low) — 5.55

Run ID: `gpt-5.6-sol-low`. Summary: **Inverted kicks, incomplete scoring and slow gravity; lock/reset clocks, hidden lock-out and stretched phone hold**.

Scores (correctness/tests/code/simplicity/browser UX): **3.0/4.5/8.5/9.0/8.5**.

Tests **4.5**: the fixed-random 28-line assertion script checks dimensions, a varied six-piece prefix (not a complete bag), one exact right move, locked presence and positive hard-drop points, first/restricted hold and four cleared pre-filled rows with score >=800. The line fixture locks an I above already complete rows, rather than completing a legal Tetris. There are no exact drop points/cell count, whole bag, wall/rotation/kick, independent ghost, held retrieval, integrated line/advanced scoring, timing/cap/ledge, gravity/levels, top-out/restart or browser assertions.

Code **8.5**, simplicity **9.0**: **220 source TS lines** in a DOM-free engine and direct entry. Strict types, injected RNG, small direct methods and no runtime dependencies keep it proportionate. The renderer/input and several scoring/queue methods are densely compressed, public board/state rely on caller discipline, and simulation timing is owned by main. This is more readable than the 37–71-line compressed 7.0 implementations, below the clearer 9.0 engines. UX **8.5**: clear board/grid/ghost, hold, four next previews, DOM stats, a full desktop legend, pause/restart and pointer buttons. Native repeat, fixed canvas backings and no blur cleanup; the confirmed preview defect is charged only to correctness.

Confirmed findings:

- **Major: Vertical SRS kick offsets are applied in the opposite direction.** All 28 states pass after fixed origin translation, but all 48 ordered non-O kick sequences fail. At field (3,18), floor I r0 cannot rotate CW (SRS reaches r1,(4,16)); floor T reaches (3,16) rather than (2,17). Tables already use Y down while rotate subtracts kick Y.

- **Major: T-spin scoring and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single locks award 0/100 through both hard drop and timed lock, rather than full 400/800 or mini 100/200. Full T-spin double is 300 rather than 1200; single perfect clear is 100 rather than 900. Normal clears, B2B and combos pass. These related scoring omissions receive one grouped major deduction.

- **Major: High-level gravity stops accelerating at 45 ms per row.** Actual first-row boundaries match the curve through level ten but levels 14/15/20 all take 45 ms, versus 12/8/1 ms at integer resolution or the accepted fast terminal floor. gravityMs clamps to 45 ms, substantially slower than the prior roughly one-frame floors.

- **Minor: Grounded actions reset lock delay without a cap or success check.** Thirty alternating successful moves spaced 490 ms apart keep a floor O unlocked; fifteen resets should exhaust the allowance. Repeated failed left-wall actions also keep it unlocked at 1000 ms. Ordinary 499/500 ms locking, natural contact and ledge mid-air safety pass.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over exactly 600 ms, the unchanged callback moves O nine rows at 60 Hz and eight at 144 Hz. Both the no-op-DOM engine-clock probe and real Chromium reproduce it; lastFall is assigned now after each fall.

- **Minor: A wholly hidden legal lock does not end the game.** From actual T spawn at field (3,-2), stack only (7,0), four right moves and zero-travel hard drop lock all T cells above visible row zero. The incoming I at (3,-2) is independently open, but gameOver remains false.

- **Minor: Hold retains the outgoing piece gravity phase.** After 800 ms of normal gravity, real C replaces the piece but its first row falls only 200 ms later. The unchanged engine-clock and browser callbacks reproduce one row; lastFall is not reset by hold/spawn.

- **Minor: The phone hold preview is stretched non-uniformly.** At 390x844, the 112x80 hold backing is drawn into a 70x65 CSS box. Its cell width/height ratio is 0.769; a held O is visibly taller than wide. Desktop hold, the next queue and board scale uniformly, and no panel is clipped.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Sol audit](.audit/gpt56-sol-review.md).

### 63. GPT-5.6 Terra (high) — 5.50

Run ID: `gpt-5.6-terra-high`. Summary: **Inverted vertical kicks and incomplete scoring; slow high-level gravity, refresh, hold-clock and phone gaps**.

Scores (correctness/tests/code/simplicity/browser UX): **3.5/3.5/8.5/9.0/8.0**.

Tests **3.5**: the 17-line fixed-random smoke checks dimensions, a successful move, first/restricted hold and post-lock availability. new Set(...).size>0, hardDrop()>=0 and nondecreasing score are weak assertions; there is no complete bag, actual kick, exact drop/cell/score, retrieval, ghost, line score, clock/cap/ledge, level, blocked-spawn/restart or browser test. This is near GLM low’s narrow 3.5 suite, below Terra low’s exact drop assertions.

Code **8.5**, simplicity **9.0**: **233 source TS lines**, a DOM-free typed engine plus a direct DOM entry, injected RNG, strict configuration and no runtime dependency. Short helpers keep the design proportionate. Duplicated spawn/hold setup and simulation counters split between class and main add maintenance cost. The renderer repeatedly recomputes ghosts/cells per board cell; no measured performance defect is claimed.

UX **8.0**: crisp DOM grid/outline ghost, readable colors/stats, a labeled board and five next entries represented as colored piece letters. The presentation is clear but plainer than graphical-preview/high-DPI/touch UIs; native repeat and no blur cleanup. Phone hold removal is charged only to correctness.

Confirmed findings:

- **Major: All vertical SRS kick offsets are applied in the opposite direction.** All 28 basic states pass, but all 48 ordered non-O kick lists fail the Y-down oracle. The tables already store downward-positive offsets, while rotate subtracts them. Floor I r0 at field (3,18) cannot rotate CW; canonical SRS reaches r1,(4,16). Floor T reaches (3,16) instead of (2,17).

- **Major: T-spin scoring and perfect-clear bonuses are absent.** Legal final-rotation full/mini zero/single fixtures score 0/100 rather than full 400/800 and mini 100/200 through hard and timed locks. A full T-spin double is 300 rather than 1200; single perfect clear is 100 rather than 900. Normal scores, B2B Tetrises and combos pass.

- **Major: High-level gravity stops accelerating at 50 ms per row.** Levels 1/2/5/9/10 match the curve, but levels 14/15/20 all first fall at 50 ms rather than 12/8/1 ms at integer resolution. gravityMs clamps to 50 ms, much slower than both the curve and the previously accepted 16 ms fast floor.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level ten over 600 ms, unchanged engine/browser frame callbacks move O nine rows at 60 Hz but eight at 144 Hz. gravityElapsed is zeroed after each step rather than spending the interval.

- **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. From T at field (3,-2), stack (7,0) and four right moves end r0 at (7,-2); the incoming I at (3,-2) is open.

- **Minor: Hold retains the outgoing piece’s gravity and lock counters.** After 800 ms of normal time, C replaces the active piece but its first row falls only 200 ms later. Separately, fifteen old-piece grounded moves at 10 ms intervals, C, manual descent, 490 ms grounded wait, Right and 20 ms lock the replacement because the exhausted reset allowance is inherited.

- **Minor: The phone stylesheet removes the hold display.** At 390×844 the 260×520 board and five textual next entries fit, but .side.left is display:none and #hold has zero bounds. The complete held-piece state is unavailable on the phone.

Full fixtures, scoring rationale, limitations and generation context: [gpt56 terra audit](.audit/gpt56-terra-review.md).

### 64. GLM-5.3-Flash (low) — 4.85

Run ID: `glm-5.3-flash-free-low`. Summary: **Canonical SRS, but hold, gravity/frame timing, scoring and blocked spawn fail; previews overlap and clip**.

Strengths:

Canonical SRS/kicks, seven-bag, ghost and exact hard-drop landing points pass all seven obstructed geometry probes in [`src/game/game.ts`](glm-5.3-flash-free-low/src/game/game.ts). The engine has a thirty-tick lock delay, fifteen action resets, safe ledge handling, hidden lock-out and reset. Its desktop/phone browser starts and responds to all required keys, with the confirmed limitations below.

Confirmed bugs:

- **Major (−1.5 correctness): Hold stays disabled after the first use.** With scripted T,I,O spawns, rotate T, hold it, then hard-drop I. holdUsed remains true; C on the incoming O does nothing. lockPiece/spawn never re-enable hold. This breaks once-per-piece hold for the rest of the game, not just the initial swap. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): Normal gravity is at least one row per 60 Hz tick.** From O at y=-1, one tick moves it to y=0 at level one, and another tick at level two moves it to y=1. Math.max(gravityCellsPerFrame(level),1) floors normal gravity at 60 rows/second instead of one row per 1000/793 ms. Soft drop travels 19 rows in a single tick on the empty board. The wrong normal and soft speeds are one gravity finding. Scoring effect: `8.5 → 7.0`.
- **Major (−1.5 correctness): The animation loop discards time and stops simulation at high refresh rates.** Driving the unchanged delivered requestAnimationFrame callback through 120 evenly spaced frames over 1000 ms produces zero Game.tick calls; O stays at y=0 and the board is empty. Sixty subsequent 17 ms frames produce 60 tick calls. floor(delta/16.67) loses every sub-step remainder, so gravity and timed locking do not advance at 120 Hz. This browser clock defect is independent of the engine gravity-rate floor. Scoring effect: `7.0 → 5.5`.
- **Major (−1.5 correctness): Advanced scoring and soft-drop points are absent.** Real final-rotation full/mini zero/single fixtures score 0/100 rather than full 400/800 and mini 100/200; two Tetrises with a no-clear lock between total 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a perfect-clear single scores 100 instead of 900. Soft-dropping O by 19 rows earns zero points. These scoring omissions are one grouped major finding; normal clears and hard-drop distance points pass. Scoring effect: `5.5 → 4.0`.
- **Major (−1.5 correctness): Blocked spawns are moved above the stack instead of ending the game.** Fill visible row 0, then spawn T. The engine moves its origin to y=-2, its ghost is also -2, and status stays playing. Only a later hidden hard drop ends the game. A real-browser Space fixture with occupied spawn columns likewise continues after the incoming blocked spawn. The upward search avoids the required immediate blocked-spawn top-out. Scoring effect: `4.0 → 2.5`.
- **Minor (−0.5 correctness): Hold and next previews overlap and clip I pieces.** On the 360 px combined canvas, the last I next cell is drawn at local x=358 with width=17, clipping 15 px. With I held and I next, held cell x=310..327 overlaps next cell x=301..318 at y=50. Forwarded unchanged fillRect calls and the desktop/phone detail screenshot reproduce both effects of the cramped shared preview panel. Scoring effect: `2.5 → 2.0`.

Test gaps and rationale:

Tests **3.5**: 79 lines provide ten unconditional smoke assertions for dimensions/cell counts, initial queue/hold flags and clearing an already-full row. After 2,000 ticks the observed run is over, so movement/rotation/hard-drop checks skip; the hard-drop assertion is literally true. The gravity assertion accepts over-or-piece, and no bag, real kick, ghost, exact timing/scoring, post-lock hold, top-out/restart or browser case is established.

Code **8.5**, simplicity **8.5**: 737 source TS lines, strict unused checks, four focused geometry/game/DOM/bootstrap files and no runtime dependencies. Mutable aliased snapshots, unrestricted coordinate arrays and an unused held-key set are modest structural costs. UX **8.0** reflects readable colors/ghost/stats, four previews, high-DPI drawing and a complete board that fits phones; no visible legend, canvas label, grid, custom DAS/ARR or touch controls. Defects are charged only to correctness.

Exact reproducible fixtures, browser measurements and generation/isolation context are in the [GLM audit](.audit/glm-review.md).

### 65. GPT-5.6 Terra (medium) — 4.65

Run ID: `gpt-5.6-terra-medium`. Summary: **Text-only smoke test; generic kicks, basic scoring, gravity and lock timing fail; phone next clips**.

Scores (correctness/tests/code/simplicity/browser UX): **3.0/1.5/7.5/8.5/8.0**.

Tests **1.5**: six source lines search the emitted file for five names, including class TetrisGame and rotate(dir). No engine code is executed. Passing build and text checks give the same test score as GPT-6 Luna high’s text-only suite; the added audit probes earn no own-test credit.

Code **7.5**, simplicity **8.5**: **53 source TS lines**, strict checking and direct dependency-free browser code. Long compressed methods, drawing/input lines and main-owned mutable globals couple simulation and DOM. The package’s serve dependency is dev-only. The modest single-file design is easy to navigate but harder to maintain than the separated readable engines.

UX **8.0**: clear grid/ghost, five complete desktop previews, DOM stats and a labeled board. Native repeat, no high-DPI scaling, touch UI or blur cleanup; the legend omits some alternate bindings. Phone clipping is deducted only from correctness.

Confirmed findings:

- **Major: Rotation uses generic kick lists instead of SRS transitions.** All 28 basic states pass but all 48 ordered non-O kick sequences differ. Floor I r0 at (3,18) cannot rotate CW although SRS reaches r1,(4,16); floor T reaches (3,17) instead of (2,17).

- **Major: Advanced scoring is absent and automatic gravity awards drop points.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Level-two combo single is 200 instead of 300. Each automatic gravity row also awards one point because the frame calls softDrop.

- **Major: Gravity follows a different linear progression.** The unchanged loop first moves O at levels 1/2/5/10 after 850/780/570/220 ms instead of 1000/793/356/65 ms. It uses max(80,850-(level-1)*70).

- **Minor: Locking follows gravity failures rather than a grounded lock delay.** A floor O stays unlocked at 500 ms and locks on the 850 ms gravity failure; natural landing is followed by another 850 ms wait. Grounded Down locks immediately, and successful actions have no separate lock reset/cap. Ledge safety passes.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level two, unchanged callbacks over 1564 ms move O two rows at 60 Hz and one at 144 Hz. The loop discards elapsed remainder after each fall.

- **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (8,1),(2,1),(8,0),(6,1),(7,1),(5,1); right,right,CW,right,CCW ends T r0 at (6,-2).

- **Minor: Public engine actions mutate state after game over.** Once over=true after a blocked T spawn, direct move/rotate/hold/hardDrop calls change the engine snapshot because the methods do not guard terminal state. The browser key handler does guard it; real keys are inert and R creates a clean new game.

- **Minor: The phone layout clips the next panel.** At 390×844, the transformed fixed cabinet creates a 513 px document. Board x=130.44,width=237.12 fits, but next begins at x=390.18,width=93.6 and is outside the viewport.

Full fixtures, scoring rationale, limitations and generation context: [gpt56 terra audit](.audit/gpt56-terra-review.md).

### 66. GPT-5.6 Terra (low) — 4.65

Run ID: `gpt-5.6-terra-low`. Summary: **Canonical shapes, but generic kicks, basic scoring, wrong clocks, hidden lock-out and presentation defects**.

Scores (correctness/tests/code/simplicity/browser UX): **2.0/4.0/7.0/8.5/8.0**.

Tests **4.0**: the one-line unchanged smoke script checks initial valid spawn/five queued pieces, exact left movement, a positive hard-drop distance, exactly four added locked cells and exact double-distance points, then score/lines/game-over reset. Twenty repeated unseeded executions pass; the assertions are order-independent. There are no bag, kick, ghost, hold, line/advanced-score, timing/cap/ledge, gravity/level, blocked-spawn, hidden-lock or browser cases. This is comparable to the earlier 4.0 smoke suites, above the nearly vacuous GPT-5.6 Luna low suite.

Code **7.0**, simplicity **8.5**: **41 source TS lines**, two direct modules, strict types and no runtime dependencies. Very long compressed shape literals, methods and renderer/input lines impede maintenance, matching the compressed Luna/Sol low calibration. The engine is DOM-free; mutable public state, global RNG and browser-owned timing require caller discipline.

UX **8.0**: clear desktop colors/grid/ghost, hold, five previews, scores and keyboard legend; native repeat, no high-DPI adaptation, custom DAS, focus cleanup or touch UI. The confirmed overlay, preview and phone defects are deducted only from correctness.

Confirmed findings:

- **Major: Rotation uses generic kick lists instead of SRS transitions.** All 28 basic states pass, but all 48 ordered non-O kick sequences differ. A vertical I at field x=-2,y=8,r1 cannot rotate CCW off the left wall; canonical SRS reaches r0,x=0. Its floor I rotates to r1,(3,16) instead of canonical (4,16).

- **Major: Advanced scoring is incomplete and automatic gravity awards drop points.** Legal final-rotation full/mini zero/single locks score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; single perfect clear is 100 instead of 900. Combo scoring works, but each automatic gravity row also earns one soft-drop point.

- **Major: Gravity follows a different linear progression.** The unchanged loop first moves an O at levels 1/2/5/10 after 801/736/541/216 ms rather than 1000/793/356/65 ms. It uses elapsed>max(100,800-(level-1)*65).

- **Minor: Locking follows gravity failures rather than a grounded lock delay.** A floor O is still unlocked at 500 ms, then locks on the 801 ms gravity failure; natural landing is followed by another 801 ms wait. A grounded Down locks immediately. Successful actions have no separate lock reset or finite reset counter. Ledge mid-air safety passes.

- **Minor: Discarded gravity remainder makes falling refresh-dependent.** At level two, unchanged callbacks over the same 1480.001 ms move O one row at 60 Hz and two at 144 Hz. elapsed is reset to zero on every fall.

- **Minor: A wholly hidden legal lock does not end the game.** The bounded deterministic stack/action search is replayed from the actual T spawn, ending entirely above visible row zero with a zero-distance landing and an independently open incoming I. Hard drop continues instead of ending the game; exact stack, path and pose are asserted in the engine probe. Stack (8,1),(2,1),(8,0),(6,1),(7,1),(5,1); right,right,CW,right,right,CCW ends T r0 at (6,-2).

- **Minor: Public drop methods mutate the engine after game over.** After a blocked incoming T makes over=true, direct hardDrop still locks and spawns, changing the board/state snapshot. The real browser key handler guards this path; its game-over keys are inert and R works. This is the same engine-method severity as GPT-5.6 Luna low.

- **Minor: I hold and next previews clip half of the first cell.** With I held and five I next pieces, actual fillRect calls start at x=-11 with width 22 in the 120 px backings. The left cell loses 11 px in hold and every next slot, at both viewport sizes.

- **Minor: The phone layout clips the next panel.** At 390×844, document width is 413 px. The board fits at x=105 with size 202.8×405.59, but next starts at x=320.8 and ends at 400.8; its panel extends further.

- **Minor: The game-over overlay is visible during active play.** At both sizes after initial load and real R restart, over=false and #game-over.hidden=true, but computed display is grid and GAME OVER covers the live board. The class display rule overrides the hidden presentation.

Full fixtures, scoring rationale, limitations and generation context: [gpt56 terra audit](.audit/gpt56-terra-review.md).

### 67. GPT-5.6 Luna (low) — 4.25

Run ID: `gpt-5.6-luna-low`. Summary: **Non-SRS rotations, broken hold, basic scoring and wrong timing; phone state clips**.

Scores (correctness/tests/code/simplicity/browser UX): **1.5/3.0/7.0/8.5/8.0**.

Tests **3.0**: its two-line smoke script checks initial active/queue and a truthy held piece. The only score assertion rejects a negative score and never establishes an award. There are no complete bag, wall, rotation/kick, exact drop points/cells, restricted/post-lock hold, ghost, line/advanced score, timing/cap/ledge, gravity/levels, top-out/restart or browser assertions. This is narrower than the 3.5–5.5 smoke suites; audit probes earn no own-test credit.

Code **7.0**, simplicity **8.5**: **37 source TS lines**, strict types, a DOM-free engine, injected RNG, direct methods and no runtime dependencies. Extremely long compressed methods, shape literals and the draw/input module impede maintenance. UX **8.0**: readable colored board/grid/ghost, hold/stats, three previews and a complete keyboard legend; native repeat, no high-DPI adaptation, focus cleanup or touch UI. Confirmed defects are charged only to correctness.

Confirmed findings:

- **Major: Rotation states and kicks do not implement SRS.** The full oracle fails I0/I1/I2/I3/J1/L1/S1/S2/T1/Z1/Z2, after allowing a fixed O-origin translation. I spawns vertically and I/S/Z have only two reused states. All 48 non-O ordered kick transitions differ from SRS: rotate uses the same six generic offsets in both directions instead of the JLSTZ/I tables. These related geometry/kick defects are one major finding.

- **Major: Hold duplicates the active or previously held piece instead of swapping.** Seed 42 deals active Z and next S. C stores Z but respawns Z, leaves S queued and immediately restores canHold=true. A second C again respawns Z; after locking, C replaces the next active piece with Z without storing the outgoing type. The public hold probe and real browser keys reproduce it.

- **Major: Advanced scoring is absent and gravity/level-crossing points are wrong.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200, through hard and timed locks. Two Tetrises with a no-clear lock between total 1600 instead of 2000; level-two combo single is 200 instead of 300; single perfect clear is 100 instead of 900. Automatic gravity awards one point per row; crossing nine to ten lines scores the single at the new level, 200 instead of 100. These related scoring errors are grouped once.

- **Major: Gravity uses a different linear progression.** Actual first-row boundaries at levels 1/2/5/10 are 800/735/540/215 ms instead of 1000/793/about 355.197/64.152 ms. tick uses max(80,800-level*65), with internal levels starting at zero, rather than the benchmark Guideline curve.

- **Minor: Gravity remainder loss makes falling depend on refresh rate.** At logical level two, unchanged engine updates and the actual browser frame callback move O one row at 60 Hz but two at 144 Hz over the same 1480.001 ms. tick resets dropTimer to zero on every fall instead of retaining the remainder. This timing defect is separate from the wrong gravity curve.

- **Minor: Lock timing bypasses the delay and has no action-reset cap.** Grounded softDrop locks immediately. An O waits 490 ms on the floor, moves, then locks after only another 310 ms when automatic softDrop fails. Thirty successful alternating moves at 10 ms intervals still postpone locking beyond 799 ms, whereas the fifteen-reset cap locks by then. Ordinary 499/500 ms and ledge mid-air safety pass; these related lock-policy failures form one minor finding.

- **Minor: A wholly hidden legal lock does not end the game.** From the real T spawn, add only stack (6,2), move right once, and hard-drop zero rows. All T cells are in hidden rows 0–1 at x=5..7; the incoming vertical I at x=3 is independently open and does not overlap the locked T. gameOver remains false.

- **Minor: Drop controls mutate the board after game over.** Block the next T spawn with (5,0), then hard-drop a floor O. gameOver becomes true, but a further hardDrop writes the blocked active T into the board and spawns again. The before/after game-over snapshot changes; movement/rotation are guarded but hardDrop/softDrop/lock are not.

- **Minor: The fixed-width phone page clips supporting state.** At 390×844, document width is 466 px. The 300×600 board starts at x=0 and fits, but hold/next canvases start at x=332 and extend to 452; scores and previews are partly off-screen. The page has a fixed 460 px main and no phone reflow.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### 68. GPT-5.6 Luna (medium) — 4.20

Run ID: `gpt-5.6-luna-medium`. Summary: **Build/tests pass, but a CSS module import prevents browser startup; source scoring and gravity fail**.

Scores (correctness/tests/code/simplicity/browser UX): **0.0/5.0/8.5/8.5/6.5**.

Tests **5.0**: all **5 own cases pass**, covering one fixed-random seven-bag, real movement/rotation number and four hard-locked cells, a full-row helper, first/restricted/post-lock hold availability and left-wall bounds. The test named score lines advance asserts neither score nor lines. No exact geometry/kick, drop score, independent ghost, integrated line/advanced scoring, timing/cap/ledge, precise gravity/levels, top-out/restart or browser assertion exists. The headless tests never load its failing browser entry.

Code **8.5**, simplicity **8.5**: **100 source TS lines**, strict/noUncheckedIndexedAccess, separated geometry/bag/headless rules and browser entry, direct helpers and no JS runtime dependencies. Long compressed methods and public mutable state need caller discipline. UX **6.5** assesses only the readable static HTML/CSS, consistently with Nemotron and GPT-6 Luna medium; there is no delivered playable browser experience.

Confirmed findings:

- **Critical: The browser module graph cannot start the game.** Fresh npm ci, npm run build and all five own tests pass, and npm start serves the page. Emitted main.js retains import "./style.css" without a CSS import attribute or bundler. Chromium rejects it: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css". Module evaluation never constructs the game; the board stays blank and every key/restart button is inert at both widths. No browser delivery repair was made; headless probes are diagnostic only.

- **Major: Advanced scoring is absent, hard drop is underpaid and gravity awards points.** Diagnostic headless full/mini zero/single fixtures score 0/100, B2B Tetrises total 1600, level-two combo single 200 and single PC 100. Hard drop calls softDrop per row and awards one point per cell instead of two; automatic tick also calls softDrop and awards one point for each gravity row. These related scoring defects are one grouped major finding, not a browser pass.

- **Major: Gravity uses a different linear progression.** Diagnostic first-row boundaries at levels 1/2/5/10 are 800/735/540/215 ms, rather than 1000/793/about 355.197/64.152 ms. The engine uses max(70,800-(level-1)*65). Levels still advance every ten lines; the delivered browser never runs.

- **Minor: Lock accounting locks early after movement and omits capped resets.** A grounded O waits 490 ms, moves successfully, then locks after another 310 ms because tick adds the whole 800 ms gravity interval to lockAccumulator on a blocked fall. Thirty alternating moves at 10 ms intervals still keep it unlocked at 799 ms; there is no reset counter. Ordinary 499/500 ms and ledge safety pass. This is one grouped diagnostic lock-policy finding.

- **Minor: A wholly hidden legal lock does not end the game.** Diagnostic public-action fixture: T spawn at (3,0), stack (2,2),(3,3),(4,3), CW, CCW, left three times, then zero-travel hard drop. T locks wholly in hidden rows 0–1; incoming I is independently open, but over remains false. This is headless source behavior, not working browser gameplay.

Exact fixtures, browser evidence, limits and supplied generation/isolation context: [GPT-5.6 Luna audit](.audit/gpt56-luna-review.md).

### 69. Nemotron — 4.00

Strengths:

- A compact engine, board module, piece module, renderer, and input entry point with no browser runtime dependency.
- Source tests cover board boundaries/locking/clearing, basic movement/rotation, hard drop, hold restrictions, and restart. Extra engine probes confirm blocked spawn and core state transitions.

Confirmed bugs:

- **Critical (−4 correctness; capped at 4): the browser implementation does not start.** [`src/main.ts`](nemotron/src/main.ts) and its imports omit `.js` extensions. `tsc` preserves those specifiers, while the declared `http-server` returns 404 for `/dist/game` and `/dist/render`. The page remains empty, controls do nothing, and score stays zero. Scoring effect: `10.0 → 4.0` after the critical cap.
- **Major (−1.5 correctness): piece states and kick data are not SRS.** Twelve orientation states fail after accounting for the different piece origins; the I piece has copied non-I-style kicks instead of its required offsets. Scoring effect: `4.0 → 2.5`.
- **Major (−1.5 correctness): scoring is substantially incomplete.** Normal clears use 40/100/300/1200; T-spins, B2B, combos, and perfect clears are absent. Soft-drop scoring rounds each animation frame separately, so four 16 ms frames move a piece down without awarding a point. Scoring effect: `2.5 → 1.0`.
- **Minor (−0.5 correctness): lock delay follows gravity ticks rather than elapsed grounded time.** A piece resting on the floor at level one does not lock at 501 ms; it locks on the first failed 816 ms gravity tick. Grounded movement/rotation also has no finite reset cap. Scoring effect: `1.0 → 0.5`.
- **Minor (−0.5 correctness): the narrow layout clips the board.** At 390 px, the board starts at x=−22, document width is 412 px, and the body hides overflow. Scoring effect: `0.5 → 0.0`.

Test gaps and rationale:

- Tests execute TypeScript through `tsx`, masking the browser's module-resolution failure. They omit bag distribution, ghost/queue behavior, scoring, timing, canonical SRS/kicks, actual top-out, and browser loading. Random bag order is not seeded.
- The code is small and straightforward, but state snapshots expose mutable engine data. Code/simplicity scores assess structure; UX 6.5 assesses only the static desktop presentation. Live gameplay UX could not be evaluated and is not assigned a second penalty for the critical delivery failure.

Detailed reproductions for all five imports are in the [October audit record](.audit/october-review.md).

### 70. GPT-6 Luna (medium) — 3.80

Summary: **Does not build or start; diagnostic source has wrong SRS, scoring and gravity**.

Scores (correctness/tests/code/simplicity/browser UX): **0.0/3.5/8.0/8.5/6.5**.

Tests **3.5**: the declared workflow fails before either own case runs. The two source cases meaningfully assert a fixed-random bag, one collision-free T, rotation number and a clear helper; they do not integrate the game or test exact points, kicks, hold, ghost, timing, levels, game over/restart or browser delivery. Code **8.0**, simplicity **8.5**: 210 source TS lines with geometry separated from a readable direct main module, strict configuration and no runtime dependency. Main-owned mutable globals couple simulation and DOM. The compile/server failures are charged once to correctness. UX **6.5** assesses only the readable static desktop presentation, matching Nemotron; live gameplay cannot be evaluated.

Confirmed findings:

- **Critical: The delivered build and start workflow cannot produce a playable game.** No package-lock.json was delivered. After npm install in a fresh copy, npm run build and npm test each fail with exactly 113 TypeScript errors in src/game.ts; noEmitOnError prevents dist output. Independently, node server.js exits because require is undefined in the package ESM scope. These are one critical delivery finding, with correctness capped at 4; the static browser diagnostic gets a 404 for /dist/main.js.
- **Major: Fifteen non-I/O rotation states use a 4×4 pivot instead of SRS.** The independent 28-state oracle fails J/L/S/T/Z rotations 1, 2 and 3. Every non-O piece rotates with [3-y,x], although these five pieces require [2-y,x]. The kick offsets are canonical but cannot repair the incorrect basic orientations.
- **Major: Advanced scoring is absent and ordinary gravity awards drop points.** Legal final-rotation full/mini zero/single fixtures score 0/100 instead of 400/800 or 100/200 through hard and timed locks. Two Tetrises separated by a no-clear score 1600 instead of 2000; a level-two combo single scores 200 instead of 300; a zero-travel single perfect clear scores 100 instead of 900. Diagnostic transpilation also confirms that one ordinary automatic gravity row awards one point: tick calls move(0,1), which scores every downward step. These are source/diagnostic findings, not a successful delivery.
- **Major: Gravity uses a different hard-coded progression.** Diagnostic one-row boundaries at levels 1/2/10/15 are 1000/850/80/80 ms, versus 1000/793/about 64.152/7.059 ms (or the accepted 16 ms fast floor). No delivered game runs; the unchanged functions were inspected through isolated in-memory transpilation.
- **Minor: The static phone layout removes the next queue.** At 390×844 the unchanged HTML/CSS has document width 390 and a 300×600 board at x=79, but .right-rail is display:none and #next has zero bounds. The static diagnostic is not a gameplay pass.

Exact fixtures, coverage and scoring rationale are in the [GPT-6 Luna audit](.audit/gpt6-luna-review.md).

### 71. Beam (medium) — 3.80

Summary: **CommonJS prevents browser startup; diagnostic SRS, scoring, gravity, lock clocks and supporting UI fail**.

Scores (correctness/tests/code/simplicity/browser UX): **0.0/3.5/8.0/8.5/6.5**.

Tests **3.5**: **16 lines / four assertions**, unseeded but order-independent:
initial active existence, exact one-column right movement, a loose post-drop
condition, and clearing one already-full row through the helper. The
post-drop condition (`current !== null || gameOver === false`) does not
establish a lock, replacement, score or cell count. The other three are
meaningful narrow smoke assertions. No bag, wall/rotation/kick, exact drop
points/cells, hold, ghost, integrated scoring, timing, gravity/levels,
top-out/restart, input or real browser assertion exists. Node CommonJS tests
never load the broken browser entry. Breadth fits the earlier 3.5 smoke suites.

Code **8.0**, simplicity **8.5**: **358 source TS LOC**, readable DOM-free
engine helpers/state plus a direct browser entry, strict TypeScript and no
browser runtime dependencies. `any` shape tables, mutable global randomness,
public mutable state, duplicate/unused spawn logic, unused lock fields and
an unused `over` variable add maintenance cost. This is clearer than compact
7.0–7.5 engines, below the strongly typed, injected-RNG 9.0 implementations.
UX **6.5** follows the earlier critical-delivery calibration: assess the
simple static page/source presentation; live gameplay cannot be evaluated.
The startup failure is deducted only from correctness, with no second UX
failure deduction. Diagnostic rendering shows a clear small board/ghost and
text stats; no legend, labels, pointer controls, high-DPI or focus handling.

Confirmed findings:

- **Critical: CommonJS output cannot start in the delivered page.** TypeScript emits exports/require but index.html uses a plain script. Chromium throws exactly exports is not defined at both sizes, before initialization: empty HUD, default 300x150 canvas, zero RAF callbacks and inert required keys. Correctness is capped at 4; diagnostic engine evaluation is not a delivery pass.

- **Major: Six states and generic kicks differ from SRS.** The 28-state oracle fails I2/I3/S2/S3/Z2/Z3 because I/S/Z store two states. Floor T r0,(3,18) CW reaches r1,(3,17) rather than (2,17); one generic nine-offset list replaces indexed SRS kicks. Reproduced headlessly and in separate unchanged-body Chromium diagnostics.

- **Major: Advanced scoring is absent.** Diagnostic actual final-rotation full single gives 100 instead of 800; Tetris/no-clear/Tetris 1600 instead of 2000; second logical-level-two combo single 200 instead of 300; single PC 100 instead of 900. Normal/drop points pass; related scoring omissions are one grouped major.

- **Major: Gravity uses an NES-style table.** Logical levels 1/2/5/10 (internal 0/1/4/9) use 800/717/467/100 ms rather than the established Guideline curve. This is a diagnostic source finding; no delivered browser gameplay is claimed.

- **Major: Hold and next are never displayed.** Engine hold/retrieval and five queued entries exist, but the unchanged diagnostic renderer ignores both. Forcing held O and five next I leaves every draw call and HUD text identical. One missing supporting-state presentation deduction covers both previews, independently of startup.

- **Minor: Lock delay follows gravity failure.** Unchanged emitted tick with floor O leaves zero welded cells at 500 ms; move right, tick(800) welds four. Lock fields are unused and there is no elapsed grounded delay/reset cap. Node and Chromium diagnostics agree.

- **Minor: Hold inherits outgoing gravity phase.** O in the air receives tick(600), actual hold, then tick(800). The replacement has fallen after only 200 ms rather than a fresh native 800 ms interval. The emitted main accumulator is not reset by hold.

- **Minor: A legal wholly hidden lock continues play.** Stack (4,2),(2,1),(8,2),(5,3),(0,0),(3,3), real T spawn, CWx4/Left/CWx4 reaches r0,(0,-2), wholly hidden and grounded. Incoming I is independently open. Zero-travel hard drop discards hidden cells, leaves six stack cells and gameOver=false; no active pose/spin flag is injected.

Exact fixtures, score arithmetic, browser evidence, context and limits: [audit record](.audit/beam-efforts-review.md).

### 72. Beam (low) — 2.95

Summary: **Basic falling blocks; missing hold/ghost/next/SRS, incomplete scoring, wrong gravity and broken restart**.

Scores (correctness/tests/code/simplicity/browser UX): **0.0/0.0/7.0/9.0/6.5**.

Tests **0.0**: the complete 18-byte `src/test.ts` is `console.log('ok');`.
`npm test` compiles then runs that file, without importing or exercising
the game and without any assertion. Successful compilation is recorded
as build evidence, not a gameplay test. This is below Terra medium's 1.5
text-presence checks, which at least inspect emitted content.

Code **7.0**, simplicity **9.0**: **93 source TS lines (92 newline characters)** in
one short DOM/global-state module. Its direct collision/rotation/clearing
helpers are understandable and have little machinery. `any` piece data,
compressed nested loops/handlers, separate mutable occupancy/color grids,
global RNG and DOM-coupled simulation weaken maintainability, consistent
with the earlier compact 7.0 implementations. Unused drop interval data
and no engine boundary are structural observations, not repeated bug penalties.
UX **6.5**: readable flat seven colors and DOM score/level/line state on a
large black board. No grid, keyboard legend, canvas label, pointer controls,
high-DPI adaptation or focus handling. The missing required mechanics and
phone defect are deducted in correctness only.

Confirmed findings:

- **Major: Rotations and kicks are not SRS.** After one fixed origin translation per piece, 13 of 28 states fail: I1/I2/I3, J1/J2, L1/L2, S1/S2, T1/T2, Z1/Z2. Cropped rectangular rotation changes pivots; floor T at (3,18) rejects CW instead of reaching r1,(2,17). No wall/floor kick sequence exists.

- **Major: Hold is absent.** Real C leaves the complete active pose unchanged. There is no hold state, action or preview. The absence of the hold display is included in this single required-feature deduction.

- **Major: Ghost is absent.** With empty stack and T at (3,0), the unchanged renderer paints exactly four active block fills and no translucent or outline projection; no alternative DOM ghost exists.

- **Major: Next preview is absent.** The internal bag never appears in the UI: the page and renderer contain only the board and score/level/lines, with no upcoming-piece presentation. This is distinct from absent hold and ghost mechanics.

- **Major: Drop points and advanced scoring are absent.** O soft/hard drops score zero despite movement/four welded cells. A legal final-rotation full T-spin single scores 100 instead of 800; Tetris/no-clear/Tetris totals 1600 instead of 2000; second level-two combo single adds 200 instead of 300; single PC scores 100 instead of 900. Related scoring omissions are grouped once.

- **Major: Gravity uses 1000 divided by level.** Actual emitted update first-row boundaries at levels 1/2/5/10 are 1001/501/201/101 ms, rather than the Guideline curve 1000/793/356/65 at integer resolution. The substantial curve error is one major; no separate one-ms threshold deduction.

- **Major: R does not restart the stopped animation loop.** Actual blocked incoming-O spawn ends the game; the final RAF returns without scheduling another callback. Real R clears state/spawns but schedules zero callbacks. Driving the queue to timestamp 5000 leaves the active piece at y=0. Engine scheduling and Chromium agree.

- **Minor: Locking follows failed gravity ticks.** A floor O remains unlocked at 500 ms, moves right, then welds four cells at update(1001). There is no separate 500 ms grounded delay or capped manipulation reset policy; these share one lock-policy finding.

- **Minor: Left Ctrl does not rotate.** Up/X/Z change an open T pose, while real ControlLeft leaves it unchanged. The key handler has no Control branch. This control omission is separate from physical rotation geometry.

- **Minor: Movement remains active after game over.** After a real blocked incoming-O spawn sets gameOverFlag, Right still moves the blocked active O one column. The real handler lacks a terminal guard except for R; engine and Chromium reproduce it.

- **Minor: Phone layout clips playfield and stats.** At 390x844 document width is 399; bordered canvas 324x644 begins at x=-8.796875, with field x=-6.796875 and stats past the right edge. Desktop field is visible; this is one responsive-layout deduction.

Exact fixtures, score arithmetic, browser evidence, context and limits: [audit record](.audit/beam-efforts-review.md).

## Non-scoring generation context

The [GPT-6.1 Terra audit](.audit/gpt61-terra-review.md) records its six usage/LOC rows and supplied isolation context. Ultra includes its three tested-agent subagents; none of these facts changes quality.

These figures come from the verified per-run `STATISTICS.md` files. The five October reports are generated from exact T3 thread/provider-turn records documented in the [October audit](.audit/october-review.md). Tokens cover the tested main agent; separate harness overhead is excluded and has not yet been verified for T3. Source LOC counts physical TypeScript lines under `src/`, excluding test files; test LOC is shown separately. Neither efficiency nor LOC changes the quality score above.

The [October 23 record](.audit/oct23-review.md) additionally isolates Opus's Claude Agent SDK session and `muse-spark-1.3-medium`'s medium-reasoning implementation child from its xhigh parent. Muse is reference-assisted; its primary elapsed/token figure is the child only.

| Implementation | Source TS LOC | Test LOC | Tested-agent tokens | Elapsed wall time | Tool calls |
|---|---:|---:|---:|---:|---:|
| Beam | 690 | 36 | 1,334,888 | 0:03:03.429 | — |
| Beam (low) | 93 | 1 (18 bytes) | 82,729 | 16.402s | — |
| Beam (medium) | 358 | 16 | 419,090 | 38.039s | — |
| MiMo-V2.6-Flash (default) | 1,052 | 385 | 2,129,675 | 31m 55.288s | — |
| Cat-jam | 922 | 249 | 2,070,440 | 0:23:42.424 | — |
| Claude Haiku 5.5 (low) | 681 | 77 | 508,602 | 3m 36.967s | — |
| Claude Haiku 5.5 (medium) | 683 | 90 | 783,362 | 4m 16.792s | — |
| Claude Haiku 5.5 (high) | 876 | 129 | 4,999,379 | 0:09:54.526 | — |
| Claude Haiku 5.5 (xhigh) | 750 | 310 | 5,786,532 | 0:13:19.187 | — |
| Claude Haiku 5.5 (max) | 955 | 239 | 7,447,694 | 0:23:08.921 | — |
| Claude Sonnet 5.5 (low) | 397 | 73 | 124,165 | 0:01:03.761 | — |
| Claude Sonnet 5.5 (medium) | 622 | 147 | 494,455 | 0:02:30.629 | — |
| Claude Sonnet 5.5 (high) | 873 | 280 | 978,719 | 0:04:44.511 | — |
| Claude Sonnet 5.5 (xhigh) | 896 | 342 | 2,531,771 | 0:09:23.043 | — |
| GLM-5.3-Flash (low) | 737 | 79 | 4,356,489 | 10m 15.035s | — |
| GLM-5.3-Flash (high) | 704 | 167 | 2,363,761 | 14m 37.371s | — |
| GLM-5.3-Flash (max) | 1,121 | 352 | 4,253,523 | 19m 50.224s | — |
| DeepSeek V4.1 Flash (low) | 1,268 | 256 | 2,309,531 | 6m 54.369s | — |
| DeepSeek V4.1 Flash (high) | 1,330 | 382 | 5,255,770 | 19m 30.263s | — |
| DeepSeek V4.1 Flash (max) | 1,562 | 351 | 9,118,921 | 24m 21.634s | — |
| DeepSeek OMP/PI | 791 | 240 | 18,118,592 | 0:44:11.418 | 127 |
| Gemini-4 | 1,587 | 163 | 590,203 | 0:06:36.862 | — |
| Gemini 4 Argon (high) | 1,892 | 298 | 1,125,477 | 0:13:09.707 | — |
| Luna Codex | 652 | 56 | 1,177,121 | 0:11:31.291 | 28 |
| Luna OMP | 836 | 96 | 5,171,263 | 0:14:14.264 | 94 |
| Luna PI | 1,076 | 74 | 970,356 | 0:12:26.483 | 41 |
| Muse Spark `muse-spark-1.3-medium` (medium, reference-assisted) | 840 | 102 | 923,864 | 0:02:13.321 | — |
| `muse-spark-1.3-contributor-minimal` | 358 | 41 | 561,377 | 45.005s | — |
| `muse-spark-1.3-contributor-low` | 839 | 136 | 289,934 | 2m 1.225s | — |
| `muse-spark-1.3-contributor-medium` | 643 | 123 | 262,101 | 43.277s | — |
| `muse-spark-1.3-contributor-high` | 688 | 164 | 338,304 | 2m 30.906s | — |
| `muse-spark-1.3-contributor-xhigh` | 868 | 207 | 610,821 | 4m 44.107s | — |
| Nemotron | 716 | 97 | 1,851,716 | 0:09:08.773 | — |
| Claude Opus 5.5 (medium, original) | 932 | 290 | 1,510,085 | 0:07:17.232 | — |
| Claude Opus 5.5 (medium) | 787 | 158 | 882,725 | 4m 29.563s | — |
| Claude Opus 5.5 (low) | 576 | 107 | 249,765 | 2m 0.334s | — |
| Claude Opus 5.5 (high) | 927 | 171 | 1,662,260 | 6m 51.314s | — |
| Claude Opus 5.5 (xhigh) | 794 | 219 | 3,003,974 | 43m 10.192s | — |
| Sol Codex | 286 | 50 | 909,035 | 0:06:22.017 | 29 |
| Sol OMP | 629 | 59 | 999,455 | 0:08:03.842 | 30 |
| Space-bunny | 1,687 | 731 | 21,547,591 | 0:13:19.433 | — |

`—` means tool calls have not been normalized from T3's activity records; it does not mean zero calls. All five October sessions have one benchmark user message and complete main-agent usage with no subagents. Their elapsed times run from that message to the completed provider turn, not session creation.

Reference-assisted `muse-spark-1.3-medium`'s separate parent used 339,157 recorded tokens; child plus recorded parent is at least 1,263,021 tokens, and the full human-request-to-parent-report span is 2m 54.475s. Other harness usage remains unverified. Its child read Gemini-4 engine/test source; Opus read benchmark/task documentation and package metadata. Do not describe these runs as blinded empty-repository experiments.

DeepSeek is **not directly efficiency-comparable** with the one-prompt runs because its implementation required two user messages. Its elapsed figure includes both work phases but excludes the wait for message two; a later README-only third phase is not part of these implementation totals. See [`README.md`](README.md), [`deepseek-pi/STATISTICS.md`](deepseek-pi/STATISTICS.md), and the [session analysis](.audit/deepseek-session-analysis.md) for the isolation and accounting method.

## Methodology

### Scoring rules

Each category is scored from 0 to 10 in 0.5-point increments. Correctness begins at 10 and applies confirmed findings at these fixed severities:

- **Critical:** −4 and correctness capped at 4; build/start failure or unusable core game.
- **Major:** −1.5; missing/broken required feature or common gameplay corruption.
- **Minor:** −0.5; reproducible edge-case, fidelity, control, presentation, or non-blocking runtime defect.

Correctness is clamped to 0–10. A confirmed defect is deducted once; it is not used again to lower code-quality or test-quality scores. Test omissions affect the tests category and are not counted as implementation bugs. Code, simplicity, and UX scores reflect their broader category criteria rather than repeating the numerical bug deduction.

### Audit procedure

1. Copied each project to an isolated temporary directory so compilation could not alter committed `dist` files.
2. Ran the declared build and `npm test` workflows (separately when tests compile only their own graph). The original 32 initially passed in their respective audit cohorts; GPT-6 Luna medium fails with 113 TypeScript errors and xhigh fails its own bag assertion (a test-fixture error); GLM max's reproducible random-dependent own-test failure is documented separately, and its runner declares a passing seed plus asserts the failing seed. Existing cohort scores remain from their earlier audits; additions received a new source, test, engine, and browser review.
3. Compared every implementation with one requirements matrix and reviewed shape data, SRS kicks, scoring, lock delay, top-out, queues/hold, gravity, state transitions, controls, and rendering.
4. Ran implementation-specific engine adapters for equivalent probes. SRS probes compare all 28 piece/orientation coordinate sets, allowing only a fixed origin translation for pieces represented differently. October probes additionally cover movement/drop/hold, blocked spawn/reset, clock consistency, ghost geometry, soft-drop scoring, and advanced scoring integration.
5. Served each isolated build with its intended server behavior. In Playwright/Chromium, exercised left/right, both rotation directions, soft drop, hard drop, and hold; inspected accessible state, screenshots, overflow, console output, and failed asset responses at desktop and mobile viewport sizes. Nemotron's controls could not function because the browser module graph fails to load; its engine was probed through a separate temporary CommonJS build.
6. Re-ran builds/tests after finalizing findings and recomputed all weighted totals.

Four implementations requested a missing `/favicon.ico`, producing a harmless 404. It was not treated as an application defect. Luna OMP's intended server completed the browser flow with no console errors.

### Limitations

- This is a focused conformance audit, not an exhaustive state-space proof or a long-duration playtest.
- SRS shapes and targeted lock-delay paths received equivalent automated probes; other engine behaviors were assessed using existing tests plus source review where private APIs prevented a common adapter.
- Browser checks used Chromium only. Touch buttons were inspected where provided and keyboard controls exercised, but cross-browser input timing and physical touch devices were not tested.
- Visual quality is necessarily the most judgment-based category. Runtime cleanliness, clipping/overflow, control discoverability, information hierarchy, and responsive behavior were used to constrain that judgment.
- “No confirmed bug in the audited scope” means no reproducible defect was found by this process; it does not mean untested behavior is proven bug-free.
