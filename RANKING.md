# Tetris Implementation Quality Ranking

This ranking evaluates the five committed implementations against [`TETRIS.md`](TETRIS.md). Quality is scored independently of generation time and token use; efficiency data appears only as non-scoring context.

The audit was performed on 2026-08-10. Every project built and passed its declared test command in an isolated temporary copy. The browser checks used each project's intended server and Chromium at 1280×800 and 390×844. Reproducible probes and recorded browser measurements are in [`.audit`](.audit/README.md).

## Ranking

| Rank | Implementation | Correctness (40%) | Tests (20%) | Code (20%) | Simplicity (10%) | Browser UX (10%) | Weighted score | Confirmed bugs |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | Luna OMP | 10.0 | 6.5 | 8.5 | 7.0 | 9.0 | **8.60** | 0 |
| 2 | Sol OMP | 9.5 | 5.5 | 8.5 | 8.0 | 9.0 | **8.30** | 1 minor |
| 3 | Sol Codex | 8.0 | 6.5 | 9.0 | 9.5 | 9.5 | **8.20** | 1 major, 1 minor |
| 4 | Luna Codex | 7.5 | 7.0 | 8.0 | 7.5 | 8.5 | **7.60** | 1 major, 2 minor |
| 5 | DeepSeek OMP/PI | 6.5 | 8.5 | 8.0 | 7.0 | 7.0 | **7.30** | 2 major, 1 minor |

The ordering is deterministic. There are no equal weighted scores; if there were, the tie-break order would be correctness, tests, then code quality.

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

| Requirement from `TETRIS.md` | DeepSeek OMP/PI | Luna Codex | Luna OMP | Sol Codex | Sol OMP |
|---|:---:|:---:|:---:|:---:|:---:|
| Runs in a browser; TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dependency-free at runtime | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven standard shapes and distinct colors | ✅ | ✅ | ✅ | ✅ | ✅ |
| Left/right movement | ✅ | ✅ | ✅ | ✅ | ✅ |
| CW rotation with Up/X | ✅ | ✅ | ✅ | ✅ | ✅ |
| CCW rotation with Z/Left Ctrl | ✅ | ✅ | ✅ | ✅ | ✅ |
| Soft and hard drop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hold with C | ✅ | ✅ | ✅ | ✅ | ✅ |
| Restart with R after game over | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seven-bag randomizer | ✅ | ✅ | ✅ | ✅ | ✅ |
| SRS orientations and wall kicks | ✅ | ◐ | ✅ | ✅ | ✅ |
| Ghost piece | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hold and next queue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lock delay | ◐ | ✅ | ✅ | ◐ | ✅ |
| Guideline scoring | ◐ | ◐ | ✅ | ◐ | ◐ |
| Guideline-style gravity and levels | ✅ | ✅ | ✅ | ✅ | ✅ |
| Top-out on blocked spawn | ✅ | ✅ | ✅ | ✅ | ✅ |

“Guideline scoring” was interpreted to include drop points, normal clears, T-spins including mini classification, back-to-back, combos, and perfect clears. A binary full-T-spin implementation is useful but not the complete scoring model requested by the task.

## Test-coverage comparison

This compares tested behavior and assertion quality, not merely test-file size or printed test count. `Strong` means the suite makes deterministic, behavior-specific assertions; `Some` means coverage is indirect or incomplete; `—` means no meaningful existing test was found.

| Behavior | DeepSeek OMP/PI | Luna Codex | Luna OMP | Sol Codex | Sol OMP |
|---|---|---|---|---|---|
| Seven-bag distribution | Strong: seven bags / 49 draws | Strong | Strong | Strong | Strong |
| Movement and drops | Strong | Some | Strong | Strong | Strong |
| Real SRS kick outcomes | Strong: T and I wall kicks | — | Some: rotation state/cell count | Strong: wall kick | Some: rotation state |
| Ghost piece | Some: hard drop shares ghost projection | — | — | — | — |
| Hold and next queue | Strong | Strong | Some | Some: hold only | Some: hold only |
| Lock delay and reset limit | — | — | — | — | — |
| Scoring | Some: drops and normal clears | Strong helpers: normal/T-spin/B2B | Some: line clear | Some: line clear | — |
| Gravity/level progression | Strong | Some | Strong, including pause | — | Some: pause |
| Top-out and restart | Strong | Strong | — | Strong | — |
| Browser controls/layout/runtime | — | — | — | — | — |

All five suites are deterministic enough for repeatable smoke testing and are connected to `npm test`. None would catch every confirmed defect: no suite probes moving off a supporting ledge, canonical coordinates for all 28 SRS states, mini T-spin scoring, responsive overflow, or hidden-overlay rendering.

## Per-implementation audit

### 1. Luna OMP — 8.60

Strengths:

- The most complete rules implementation in the audited set: canonical SRS data, kick tables, a capped lock-delay reset policy, hidden-row-aware top-out, full/mini T-spin scoring, back-to-back, combos, perfect clears, hold, and a five-piece preview.
- State is encapsulated behind a clear engine API in [`src/game.ts`](luna-omp/src/game.ts), with deterministic random injection and useful read-only state snapshots.
- Desktop and narrow layouts are polished and readable. The 390 px layout has no horizontal overflow, keeps the board prominent, and the intended server loads all assets without console errors.

Confirmed bugs:

- **No confirmed bug in the audited scope.** This does not mean the implementation is exhaustively proven correct.

Test gaps and rationale:

- Existing tests cover the bag, movement, hard drop, hold, rotation, gravity/pause, dimensions, and a line clear, but do not assert concrete kick offsets, lock-delay timing/reset limits, ghost projection, top-out/restart, advanced scoring, or browser behavior.
- The engine is the largest of the five and contains proportionate but substantial rule machinery, which lowers simplicity relative to the compact Sol implementations.

### 2. Sol OMP — 8.30

Strengths:

- A well-structured engine with canonical SRS, a 15-reset lock-delay cap, reliable ledge handling, full queue/hold state, T-spin detection, back-to-back, combos, and perfect-clear bonuses in [`src/game.ts`](sol-omp/src/game.ts).
- Clear state types and restrained abstractions make the implementation easier to follow than its feature count suggests.
- Strong visual presentation on desktop and mobile, with responsive touch controls, no horizontal overflow, clear status information, and no application runtime errors during the exercised flow.

Confirmed bugs:

- **Minor (−0.5 correctness): mini T-spins are not distinguished.** Reproduction: construct a valid mini T-spin position, make rotation the final action, and lock it. [`isTSpin`](sol-omp/src/game.ts) returns only a boolean and [`applyScoring`](sol-omp/src/game.ts) uses the full T-spin table, so a mini receives full-T-spin treatment. Scoring effect: correctness `10.0 → 9.5`.

Test gaps and rationale:

- The compact tests cover bag uniqueness, wall blocking, hard drop, hold, rotation state, and pause, but omit line scoring, actual kick displacement, gravity cadence, ghost/next projection, lock delay, top-out, restart, and the browser.
- The sparse suite is the main reason it ranks below Luna OMP despite excellent implementation quality.

### 3. Sol Codex — 8.20

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

### 4. Luna Codex — 7.60

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

### 5. DeepSeek OMP/PI — 7.30

Strengths:

- The strongest existing smoke suite: 12 behavior groups cover seven bags, spawning, gravity, wall movement, actual T and I kicks, drop scoring, normal line clears/levels, hold, blocked-spawn top-out/restart, and next queue behavior.
- Canonical orientation/kick data is separated cleanly across [`tetromino.ts`](deepseek-pi/src/tetromino.ts), [`board.ts`](deepseek-pi/src/board.ts), and [`game.ts`](deepseek-pi/src/game.ts).
- Desktop presentation is clear and polished, with distinct colors, a legible ghost, hold, five-piece next queue, and a complete keyboard legend.

Confirmed bugs:

- **Major (−1.5 correctness): a piece can lock while airborne after moving off a ledge.** Reproduction: ground a piece on a narrow support, move it sideways into empty space, then advance time beyond the 500 ms delay. `move()` resets the timer but leaves `grounded` true, so `update()` locks the piece without rechecking whether it can descend. The isolated engine probe reproduced this directly. Scoring effect: `10.0 → 8.5`.
- **Major (−1.5 correctness): Guideline scoring is substantially incomplete.** [`game.ts`](deepseek-pi/src/game.ts) awards drop points and the basic single/double/triple/Tetris table only; it has no T-spin, back-to-back, combo, or perfect-clear scoring. Scoring effect: `8.5 → 7.0`.
- **Minor (−0.5 correctness): the narrow layout overflows horizontally.** At a 390 px viewport, `documentElement.scrollWidth` was 501 px and both side panels were clipped off-screen rather than reflowing. Scoring effect: `7.0 → 6.5`.

Test gaps and rationale:

- Despite being the best suite overall, it has no lock-delay/ledge test, advanced scoring tests, reset-limit test, or browser assertions. The current hard-drop test exercises the same projection used by the ghost but does not validate rendering.
- The multi-file split is readable but more verbose than Sol Codex. Browser UX is good on desktop and materially weaker on a phone-sized viewport.

## Non-scoring generation context

These figures come from the verified per-run `STATISTICS.md` files and use tested-agent tokens only, excluding harness overhead. Source LOC counts TypeScript lines under `src/`; test LOC is shown separately. Neither efficiency nor LOC changes the quality score above.

| Implementation | Source TS LOC | Test LOC | Tested-agent tokens | Elapsed wall time | Tool calls |
|---|---:|---:|---:|---:|---:|
| DeepSeek OMP/PI | 791 | 240 | 19,162,498 | 1:30:39.662 | 130 |
| Luna Codex | 652 | 56 | 1,177,121 | 0:11:31.291 | 28 |
| Luna OMP | 836 | 96 | 5,171,263 | 0:14:14.264 | 94 |
| Sol Codex | 286 | 50 | 909,035 | 0:06:22.017 | 29 |
| Sol OMP | 629 | 59 | 999,455 | 0:08:03.842 | 30 |

DeepSeek is **not directly efficiency-comparable** with the other four runs because its tested session contained three user messages. See [`README.md`](README.md) and each implementation's `STATISTICS.md` for the isolation and accounting method.

## Methodology

### Scoring rules

Each category is scored from 0 to 10 in 0.5-point increments. Correctness begins at 10 and applies confirmed findings at these fixed severities:

- **Critical:** −4 and correctness capped at 4; build/start failure or unusable core game.
- **Major:** −1.5; missing/broken required feature or common gameplay corruption.
- **Minor:** −0.5; reproducible edge-case, fidelity, control, presentation, or non-blocking runtime defect.

Correctness is clamped to 0–10. A confirmed defect is deducted once; it is not used again to lower code-quality or test-quality scores. Test omissions affect the tests category and are not counted as implementation bugs. Code, simplicity, and UX scores reflect their broader category criteria rather than repeating the numerical bug deduction.

### Audit procedure

1. Copied each project to an isolated temporary directory so compilation could not alter committed `dist` files.
2. Ran the declared `npm test` workflow, which includes each build. All five passed.
3. Compared every implementation with one requirements matrix and reviewed shape data, SRS kicks, scoring, lock delay, top-out, queues/hold, gravity, state transitions, controls, and rendering.
4. Ran implementation-specific engine adapters for equivalent probes. The common SRS probe normalized and compared all 28 piece/orientation coordinate sets. Targeted ledge probes exercised the two different lock-delay designs.
5. Served each isolated build with its intended server. In Playwright/Chromium, exercised left/right, both rotation directions, soft drop, hard drop, and hold; inspected accessible state, screenshots, overflow, and console output at desktop and mobile viewport sizes.
6. Re-ran builds/tests after finalizing findings and recomputed all weighted totals.

Four implementations requested a missing `/favicon.ico`, producing a harmless 404. It was not treated as an application defect. Luna OMP's intended server completed the browser flow with no console errors.

### Limitations

- This is a focused conformance audit, not an exhaustive state-space proof or a long-duration playtest.
- SRS shapes and targeted lock-delay paths received equivalent automated probes; other engine behaviors were assessed using existing tests plus source review where private APIs prevented a common adapter.
- Browser checks used Chromium only. Touch buttons were inspected and keyboard controls exercised, but cross-browser input timing and physical touch devices were not tested.
- Visual quality is necessarily the most judgment-based category. Runtime cleanliness, clipping/overflow, control discoverability, information hierarchy, and responsive behavior were used to constrain that judgment.
- “No confirmed bug in the audited scope” means no reproducible defect was found by this process; it does not mean untested behavior is proven bug-free.
