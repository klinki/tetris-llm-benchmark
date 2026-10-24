# Tetris Implementation Quality Ranking

This ranking evaluates 26 implementations against [`TETRIS.md`](TETRIS.md). Quality is scored independently of generation time and token use; efficiency data appears only as non-scoring context.

The original audit was performed on 2026-08-10, Luna PI was added on 2026-08-29, and five T3 Code/OpenCode implementations were added on 2026-10-20. Every project passed its declared build/test workflow in an isolated temporary copy. Nemotron nevertheless fails to start in the browser because its emitted imports do not resolve. Browser checks used each project's intended server behavior and Chromium at 1280×800 and 390×844. Reproducible probes and evidence are in [`.audit`](.audit/README.md).

Opus 5.5 and Muse Spark 1.3 (medium, reference-assisted; `muse-spark-1.3-medium`) were added on 2026-10-23 with the same scoring profile. Muse's implementation agent read Gemini-4's engine, shape data, tests, and build files before writing its version; its quality can be scored, but its efficiency is not an independent from-scratch comparison. See the [October 23 audit](.audit/oct23-review.md).

Claude Haiku 5.5 (high, xhigh and max) were audited on 2026-10-24 with the same
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

## Ranking

Scores and confirmed bugs are recorded in [`ranking.json`](ranking.json); this table and the README leaderboard are generated from it by `python3 scripts/benchmark.py render`.

<!-- ranking-table:start -->
| Rank | Implementation | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted score | Confirmed bugs |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Opus 5.5 | 9.5 | 9.0 | 9.0 | 8.0 | 8.5 | **9.05** | 1 minor |
| 2 | Claude Sonnet 5.5 (xhigh) | 9.5 | 8.5 | 9.0 | 8.0 | 9.0 | **9.00** | 1 minor |
| 3 | Claude Haiku 5.5 (xhigh) | 9.0 | 8.5 | 9.0 | 8.5 | 8.5 | **8.80** | 2 minor |
| 4 | Claude Sonnet 5.5 (high) | 9.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.65** | 2 minor |
| 5 | Luna OMP | 10.0 | 6.5 | 8.5 | 7.0 | 9.0 | **8.60** | 0 |
| 6 | Claude Haiku 5.5 (high) | 9.0 | 7.5 | 9.0 | 8.0 | 8.5 | **8.55** | 2 minor |
| 7 | Gemini-4 | 9.0 | 8.0 | 8.5 | 7.0 | 9.0 | **8.50** | 2 minor |
| 8 | Luna PI | 9.5 | 6.5 | 9.0 | 7.0 | 8.5 | **8.45** | 1 minor |
| 9 | Gemini 4 Argon (high) | 9.0 | 8.0 | 8.5 | 7.0 | 8.5 | **8.45** | 2 minor |
| 10 | Muse Spark 1.3 (medium) | 9.0 | 7.5 | 8.0 | 8.0 | 9.0 | **8.40** | 2 minor |
| 11 | Claude Sonnet 5.5 (medium) | 8.5 | 7.5 | 9.0 | 8.5 | 8.0 | **8.35** | 3 minor |
| 12 | Sol OMP | 9.5 | 5.5 | 8.5 | 8.0 | 9.0 | **8.30** | 1 minor |
| 13 | Claude Haiku 5.5 (max) | 8.0 | 8.0 | 9.0 | 8.0 | 8.5 | **8.25** | 4 minor |
| 14 | Sol Codex | 8.0 | 6.5 | 9.0 | 9.5 | 9.5 | **8.20** | 1 major, 1 minor |
| 15 | Luna Codex | 7.5 | 7.0 | 8.0 | 7.5 | 8.5 | **7.60** | 1 major, 2 minor |
| 16 | Muse Spark 1.3 (high) | 7.0 | 6.5 | 8.5 | 8.5 | 8.5 | **7.50** | 6 minor |
| 17 | Claude Sonnet 5.5 (low) | 7.0 | 6.0 | 8.5 | 9.0 | 8.0 | **7.40** | 1 major, 3 minor |
| 18 | Cat-jam | 6.5 | 7.5 | 8.5 | 8.0 | 8.0 | **7.40** | 2 major, 1 minor |
| 19 | Muse Spark 1.3 (xhigh) | 7.0 | 6.0 | 8.5 | 8.0 | 8.5 | **7.35** | 1 major, 3 minor |
| 20 | DeepSeek OMP/PI | 6.5 | 8.5 | 8.0 | 7.0 | 7.0 | **7.30** | 2 major, 1 minor |
| 21 | Muse Spark 1.3 (medium) | 6.5 | 5.5 | 8.5 | 8.5 | 8.0 | **7.05** | 1 major, 4 minor |
| 22 | Space-bunny | 5.5 | 7.5 | 8.0 | 6.5 | 8.0 | **6.75** | 3 major |
| 23 | Muse Spark 1.3 (low) | 5.5 | 6.0 | 8.5 | 8.0 | 8.5 | **6.75** | 2 major, 3 minor |
| 24 | Muse Spark 1.3 (minimal) | 6.5 | 4.5 | 7.5 | 8.5 | 8.0 | **6.65** | 1 major, 4 minor |
| 25 | Beam | 6.0 | 4.5 | 5.0 | 6.5 | 6.5 | **5.60** | 2 major, 2 minor |
| 26 | Nemotron | 0.0 | 6.0 | 6.5 | 8.5 | 6.5 | **4.00** | 1 critical, 2 major, 2 minor |
<!-- ranking-table:end -->

The generated “Muse Spark 1.3 (medium)” row at **8.40** is reference-assisted
[`muse-spark-1.3-medium`](muse-spark-1.3-medium); the row at **7.05** is the
independent from-scratch [`muse-spark-1.3-contributor-medium`](muse-spark-1.3-contributor-medium).
These are separate runs with unchanged registry labels.

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

| Requirement | Opus 5.5 | Muse Spark 1.3 (medium, reference-assisted; `muse-spark-1.3-medium`) |
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

| Requirement | Haiku 5.5 (high) | Haiku 5.5 (xhigh) | Haiku 5.5 (max) |
|---|:---:|:---:|:---:|
| Browser starts; TypeScript; no browser runtime dependencies | ✅ | ✅ | ✅ |
| Seven shapes and distinct colors | ✅ | ✅ | ✅ |
| Left/right; Up/X CW; Z/Left Ctrl CCW | ✅ | ✅ | ✅ |
| Soft and hard drop | ◐ | ◐ | ◐ |
| C hold and R restart after game over | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ |
| Canonical SRS states and wall kicks | ✅ | ✅ | ✅ |
| Ghost; hold; five-piece next queue | ✅ | ✅ | ✅ |
| Lock delay and capped resets | ✅ | ✅ | ✅ |
| Benchmark scoring profile | ◐ | ◐ | ◐ |
| Normal gravity, levels and blocked-spawn top-out | ✅ | ✅ | ✅ |
| Entirely hidden lock-out | ✅ | ✅ | ◐ |
| Narrow layout preserves a visible playfield | ◐ | ◐ | ✅ |
| Narrow layout preserves supporting state | ◐ | ◐ | ◐ |

All three have independently reproduced soft-drop timer transitions: entering
soft drop consumes accumulated normal-gravity time at the faster rate and
awards points for the resulting jump. Normal clears, full/mini spins, B2B and
combos passed the targeted probes. High and xhigh also award the benchmark
perfect-clear bonus; max omits it. Max's blocked-spawn game over works, but a
whole T locking in hidden rows after legal rotations does not end the game.

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

| Behavior | Opus 5.5: 19 cases | Muse Spark `muse-spark-1.3-medium` (reference-assisted): 7 groups |
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

| Behavior | Haiku 5.5 (high): 10 cases | Haiku 5.5 (xhigh): 23 cases | Haiku 5.5 (max): 19 cases |
|---|---|---|---|
| Bags and spawning | Strong: three seeded bags; spawning/queue indirect | Strong: twenty seeded bags, colors, exact I/O/T spawns; queue indirect | Strong: three fixed-random bags; spawning/queue indirect |
| Movement and drops | Strong: both walls, exact hard-drop points and locked cells; no soft-drop assertion | Strong: wall/stack blocking, exact soft/hard-drop points and locked cells | Strong: exact soft/hard-drop points, floor cells; walls exercised through kick test |
| SRS | Strong: concrete I wall kick; no canonical coordinate oracle or CCW case | Strong: concrete I kick, exact T CW cells, four-turn cycle for all shapes; no complete oracle/CCW fixture | Strong: concrete I wall kick, all T states and partial I oracle; no complete oracle/CCW fixture |
| Ghost | Some: hard-drop distance shares ghost path | Strong: exact empty-floor and obstructed landing rows | Some: exact floor landing row; no independent obstructed geometry |
| Hold | Strong: first hold, once-per-lock restriction and post-lock swap | Strong: first hold, restriction and post-lock swap; orientation reset unasserted | Strong: first hold, restriction and post-lock swap; orientation reset unasserted |
| Lock delay | Some: grounded delay and eventual lock; no exact boundary/reset cap | Strong: exact 499/500 ms boundary and 15-reset cap; no ledge case | Some: move resets delay and eventual lock; no exact boundary/reset cap/ledge case |
| Scoring | Some: exact single/perfect clear and full/mini detection helpers | Strong: exact single, Tetris/B2B/combo, perfect clear, integrated full/mini singles; no B2B break/continuity or level-two combo assertion | Strong helpers: normal/spin tables, combo, B2B/break and level progression; integrated single only; no PC or spin-score integration |
| Gravity, top-out and restart | Some: level-one timing and blocked-spawn/restart; no level progression | Strong: level-one timing, level increase/gravity helper, hidden lock-out and blocked-spawn/restart | Some: level-one timing, level/helper progression and blocked-spawn/restart; no hidden lock-out |
| State robustness | — | Strong: seeded 20,000-action play with board/active-cell invariants | — |
| Browser loading/layout/input | — | — | — |

These are each implementation's own tests. Audit probes do not raise these
scores. Xhigh earns 8.5 for broad integration and deterministic state-invariant
coverage; it remains below Opus's 9.0 because B2B break, exact level-crossing
score and hold orientation reset lack direct assertions. Max earns 8.0 for
broad deterministic helper coverage but fewer integration and timing checks;
high's narrower ten-case suite remains 7.5. No suite tests the soft-drop timer
transition, full 28-state SRS oracle, ledge move or browser layout.

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

## Per-implementation audit

### 1. Opus 5.5 — 9.05

Strengths:

- The most complete new implementation: canonical SRS geometry generated from spawn shapes, correct kick tables, a 40-row internal field, five-piece queue, hold, ghost, extended-placement lock delay, full/mini T-spin scoring, B2B, combos, perfect clears, gravity, block/lock out, and restart in [`src/game.ts`](opus-5.5/src/game.ts).
- A particularly strong deterministic suite with exact scoring and timing assertions, actual kick results, full and mini spin integration, lock-reset limits, restart, and pause. Additional audit probes confirm all 28 SRS states, ledge handling, B2B continuity, level-two combo scoring, and a perfect clear.
- Focused rules, geometry, input, bag, renderer, and entry-point modules. One animation clock drives timing; input handles repeat and focus loss. Desktop rendering is crisp and readable, and the required keyboard flow loads and runs without application errors.

Confirmed bugs:

- **Minor (−0.5 correctness): fixed-width layout does not fit a phone-sized viewport.** At 390×844, document width is 760 px; the 300 px board begins at x=230, so much of the board and next panel lie beyond the viewport. Scoring effect: `10.0 → 9.5`.

Test gaps and rationale:

- Existing tests omit browser layout, high-DPI rendering, explicit ghost-cell coordinates, the complete SRS data oracle, and ledge handling. The engine exposes mutable state, which helps deterministic setup but relies on callers respecting invariants.
- At 932 source lines plus 290 test lines, the modules remain proportionate and easy to follow. The desktop layout is polished but restrained and has no touch controls. The mobile finding is deducted once in correctness, not charged again as a separate numerical UX penalty.

### 2. Claude Sonnet 5.5 (xhigh) — 9.00

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

### 3. Claude Haiku 5.5 (xhigh) — 8.80

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

### 4. Claude Sonnet 5.5 (high) — 8.65

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

### 5. Luna OMP — 8.60

Strengths:

- The most complete rules implementation in the audited set: canonical SRS data, kick tables, a capped lock-delay reset policy, hidden-row-aware top-out, full/mini T-spin scoring, back-to-back, combos, perfect clears, hold, and a five-piece preview.
- State is encapsulated behind a clear engine API in [`src/game.ts`](luna-omp/src/game.ts), with deterministic random injection and useful read-only state snapshots.
- Desktop and narrow layouts are polished and readable. The 390 px layout has no horizontal overflow, keeps the board prominent, and the intended server loads all assets without console errors.

Confirmed bugs:

- **No confirmed bug in the audited scope.** This does not mean the implementation is exhaustively proven correct.

Test gaps and rationale:

- Existing tests cover the bag, movement, hard drop, hold, rotation, gravity/pause, dimensions, and a line clear, but do not assert concrete kick offsets, lock-delay timing/reset limits, ghost projection, top-out/restart, advanced scoring, or browser behavior.
- The engine is one of the larger implementations and contains proportionate but substantial rule machinery, which lowers simplicity relative to the compact Sol implementations.

### 6. Claude Haiku 5.5 (high) — 8.55

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

### 7. Gemini-4 — 8.50

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

### 8. Luna PI — 8.45

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

### 9. Gemini 4 Argon (high) — 8.45

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

### 10. Muse Spark 1.3 (medium) — 8.40 — `muse-spark-1.3-medium` (reference-assisted)

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

### 11. Claude Sonnet 5.5 (medium) — 8.35

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

### 12. Sol OMP — 8.30

Strengths:

- A well-structured engine with canonical SRS, a 15-reset lock-delay cap, reliable ledge handling, full queue/hold state, T-spin detection, back-to-back, combos, and perfect-clear bonuses in [`src/game.ts`](sol-omp/src/game.ts).
- Clear state types and restrained abstractions make the implementation easier to follow than its feature count suggests.
- Strong visual presentation on desktop and mobile, with responsive touch controls, no horizontal overflow, clear status information, and no application runtime errors during the exercised flow.

Confirmed bugs:

- **Minor (−0.5 correctness): mini T-spins are not distinguished.** Reproduction: construct a valid mini T-spin position, make rotation the final action, and lock it. [`isTSpin`](sol-omp/src/game.ts) returns only a boolean and [`applyScoring`](sol-omp/src/game.ts) uses the full T-spin table, so a mini receives full-T-spin treatment. Scoring effect: correctness `10.0 → 9.5`.

Test gaps and rationale:

- The compact tests cover bag uniqueness, wall blocking, hard drop, hold, rotation state, and pause, but omit line scoring, actual kick displacement, gravity cadence, ghost/next projection, lock delay, top-out, restart, and the browser.
- The sparse suite is the main reason it ranks below Luna OMP despite excellent implementation quality.

### 13. Claude Haiku 5.5 (max) — 8.25

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

### 14. Sol Codex — 8.20

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

### 15. Luna Codex — 7.60

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

### 16. Muse Spark 1.3 (high) — 7.50

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

### 17. Claude Sonnet 5.5 (low) — 7.40

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

### 18. Cat-jam — 7.40

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

### 19. Muse Spark 1.3 (xhigh) — 7.35

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

### 20. DeepSeek OMP/PI — 7.30

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

### 21. Muse Spark 1.3 (medium) — 7.05 — `muse-spark-1.3-contributor-medium` (from scratch)

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

### 22. Space-bunny — 6.75

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

### 23. Muse Spark 1.3 (low) — 6.75

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

### 24. Muse Spark 1.3 (minimal) — 6.65

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

### 25. Beam — 5.60

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

### 26. Nemotron — 4.00

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

## Non-scoring generation context

These figures come from the verified per-run `STATISTICS.md` files. The five October reports are generated from exact T3 thread/provider-turn records documented in the [October audit](.audit/october-review.md). Tokens cover the tested main agent; separate harness overhead is excluded and has not yet been verified for T3. Source LOC counts physical TypeScript lines under `src/`, excluding test files; test LOC is shown separately. Neither efficiency nor LOC changes the quality score above.

The [October 23 record](.audit/oct23-review.md) additionally isolates Opus's Claude Agent SDK session and `muse-spark-1.3-medium`'s medium-reasoning implementation child from its xhigh parent. Muse is reference-assisted; its primary elapsed/token figure is the child only.

| Implementation | Source TS LOC | Test LOC | Tested-agent tokens | Elapsed wall time | Tool calls |
|---|---:|---:|---:|---:|---:|
| Beam | 690 | 36 | 1,334,888 | 0:03:03.429 | — |
| Cat-jam | 922 | 249 | 2,070,440 | 0:23:42.424 | — |
| Claude Haiku 5.5 (high) | 876 | 129 | 4,999,379 | 0:09:54.526 | — |
| Claude Haiku 5.5 (xhigh) | 750 | 310 | 5,786,532 | 0:13:19.187 | — |
| Claude Haiku 5.5 (max) | 955 | 239 | 7,447,694 | 0:23:08.921 | — |
| Claude Sonnet 5.5 (low) | 397 | 73 | 124,165 | 0:01:03.761 | — |
| Claude Sonnet 5.5 (medium) | 622 | 147 | 494,455 | 0:02:30.629 | — |
| Claude Sonnet 5.5 (high) | 873 | 280 | 978,719 | 0:04:44.511 | — |
| Claude Sonnet 5.5 (xhigh) | 896 | 342 | 2,531,771 | 0:09:23.043 | — |
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
| Opus 5.5 | 932 | 290 | 1,510,085 | 0:07:17.232 | — |
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
2. Ran the declared `npm test` workflow, which includes each build. All 26 passed in their respective audit cohorts. Existing cohort scores remain from their earlier audits; additions received a new source, test, engine, and browser review.
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
