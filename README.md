# Tetris LLM Benchmark

This experimental benchmark compares model and agent-harness behavior while
implementing the Tetris game described in [TETRIS.md](TETRIS.md). The goal is
to produce a correct implementation efficiently, including token use.

## Results

Each run is one model implementing [TETRIS.md](TETRIS.md) once, in one agent
harness. Runs are ordered by quality score, with token use and time alongside.
Tokens count only the tested agent; harness-generated requests such as title
generation or approval review are reported in each run's statistics so they do
not skew the model comparison.

The table is generated from [`benchmark-runs.json`](benchmark-runs.json),
[`ranking.json`](ranking.json), and each run's `STATISTICS.md`.

<!-- benchmark-results:start -->
| # | Run | Model | Effort | Harness | Quality | Tokens | Est. cost | Time | Main finding |
|---:|---|---|---|---|---:|---:|---:|---:|---|
| 1 | [GPT-6.1 Sol (high)](gpt-6.1-sol-high/STATISTICS.md) | `gpt-6.1-sol` | `high` | T3 Code / Codex | **9.35** | 1,433,435 | $0.54 | 11m 37.239s | Every engine and browser probe passes; Opus-level suite, event-ordered clock and polished responsive UI |
| 2 | [GPT-6.1 Sol (xhigh)](gpt-6.1-sol-xhigh/STATISTICS.md) | `gpt-6.1-sol` | `xhigh` | T3 Code / Codex | **9.25** | 1,181,592 | $0.61 | 14m 15.041s | Every engine probe passes with the broadest own suite; focused header buttons swallow Space |
| 3 | [Claude Opus 5.5 (medium, original)](opus-5.5/STATISTICS.md)† | `claude-opus-5-5` | `medium` | T3 Code / Claude Agent SDK | **9.05** | 1,510,085 | $1.50 | 7m 17.232s | Strongest tests and rules coverage; board does not fit a phone screen |
| 4 | [Claude Sonnet 5.5 (xhigh)](claude-sonnet-5-5-xhigh/STATISTICS.md) | `claude-sonnet-5-5` | `xhigh` | T3 Code / Claude Agent SDK | **9.00** | 2,531,771 | $1.30 | 9m 23.043s | Broad rules, strong integration/input tests and a fitting phone layout; soft-drop jump |
| 5 | [GPT-6.1 Sol (medium)](gpt-6.1-sol-medium/STATISTICS.md) | `gpt-6.1-sol` | `medium` | T3 Code / Codex | **9.00** | 576,119 | $0.28 | 6m 4.302s | Every engine probe passes; strong deterministic suite, compact readable engine, touch UI; stretched previews |
| 6 | [GPT-6.1 Terra (max)](gpt-6.1-terra-max/STATISTICS.md) | `gpt-6.1-terra` | `max` | T3 Code / Codex | **8.85** | 1,988,500 | $0.41 | 4m 55.516s | Broad deterministic suite and event-ordered gravity; exhausted ledge retains old lock time and desktop queue is stretched |
| 7 | [Claude Haiku 5.5 (xhigh)](claude-haiku-5-5-xhigh/STATISTICS.md) | `claude-haiku-5-5` | `xhigh` | T3 Code / Claude Agent SDK | **8.80** | 5,786,532 | $0.17 | 13m 19.187s | Broad rules and strong tests; soft-drop timing jump and clipped phone playfield |
| 8 | [GPT-6.1 Terra (ultra)](gpt-6.1-terra-ultra/STATISTICS.md) | `gpt-6.1-terra` | `ultra` | T3 Code / Codex | **8.65** | 3,121,857 | $0.40 | 2m 1.850s | Canonical engine passes audited rules; narrower own suite, responsive UI and clicked Pause capturing Space |
| 9 | [Claude Sonnet 5.5 (high)](claude-sonnet-5-5-high/STATISTICS.md) | `claude-sonnet-5-5` | `high` | T3 Code / Claude Agent SDK | **8.65** | 978,719 | $0.66 | 4m 44.511s | Broad rules and timing tests; soft-drop jump and clipped phone sidebars |
| 10 | [Luna OMP](luna-omp/STATISTICS.md) | `gpt-5.6-luna` | — | OMP | **8.60** | 5,171,263 | $0.17 | 14m 14.264s | No confirmed bugs; tests skip kicks, lock delay and advanced scoring |
| 11 | [Claude Haiku 5.5 (high)](claude-haiku-5-5-high/STATISTICS.md) | `claude-haiku-5-5` | `high` | T3 Code / Claude Agent SDK | **8.55** | 4,999,379 | $0.13 | 9m 54.526s | Broad rules support; soft-drop timing jump and clipped phone playfield |
| 12 | [Gemini-4](gemini-4/STATISTICS.md) | `gemini-4-argon-contributor` | `medium` | T3 Code / OpenCode | **8.50** | 590,203 | $0.45 | 6m 36.862s | No perfect-clear bonus; side panels overflow on phones |
| 13 | [Luna PI](luna-pi/STATISTICS.md) | `gpt-5.6-luna` | — | PI | **8.45** | 970,356 | $0.08 | 12m 26.483s | Combo bonus is multiplied by the level twice |
| 14 | [Gemini 4 Argon (high)](gemini-4-argon-contributor-high/STATISTICS.md) | `gemini-4-argon-contributor` | `high` | T3 Code / OpenCode | **8.45** | 1,125,477 | $0.82 | 13m 9.707s | Broad rules support; missing perfect-clear bonus and clipped phone sidebars |
| 15 | [Muse Spark 1.3 (medium, reference-assisted)](muse-spark-1.3-medium/STATISTICS.md)† | `muse-spark-1.3-contributor` | `medium` | T3 Code / OpenCode | **8.40** | 923,864 | $1.20 | 2m 13.321s | No perfect-clear bonus; board collapses to nothing on phones |
| 16 | [Claude Opus 5.5 (medium)](claude-opus-5-5-medium/STATISTICS.md) | `claude-opus-5-5` | `medium` | T3 Code / Claude Agent SDK | **8.40** | 882,725 | $1.01 | 4m 29.563s | Canonical SRS and sound audited lock/spin rules; missing PC bonuses, a soft-drop jump and clipped phone support |
| 17 | [Claude Sonnet 5.5 (medium)](claude-sonnet-5-5-medium/STATISTICS.md) | `claude-sonnet-5-5` | `medium` | T3 Code / Claude Agent SDK | **8.35** | 494,455 | $0.38 | 2m 30.629s | Full/mini spins, B2B and combos work; no perfect-clear bonus, soft-drop jump and clipped sidebars |
| 18 | [Sol OMP](sol-omp/STATISTICS.md) | `gpt-5.6-sol` | — | OMP | **8.30** | 999,455 | $1.29 | 8m 3.842s | No mini T-spins; sparse test suite |
| 19 | [Claude Opus 5.5 (xhigh)](claude-opus-5-5-xhigh/STATISTICS.md) | `claude-opus-5-5` | `xhigh` | T3 Code / Claude Agent SDK | **8.30** | 3,003,974 | $2.86 | 43m 10.192s | Canonical core and stronger deterministic suite; missing PC, contact/reset timing and a clipped phone playfield |
| 20 | [Claude Haiku 5.5 (low)](claude-haiku-5-5-low/STATISTICS.md) | `claude-haiku-5-5` | `low` | T3 Code / Claude Agent SDK | **8.25** | 508,602 | $0.04 | 3m 36.967s | Broad core rules; B2B perfect-clear under-award and soft-drop timing jump |
| 21 | [GPT-6.1 Terra (xhigh)](gpt-6.1-terra-xhigh/STATISTICS.md) | `gpt-6.1-terra` | `xhigh` | T3 Code / Codex | **8.25** | 902,742 | $0.19 | 2m 2.686s | Readable canonical core and complete PC scoring; stale manual spin credit, soft-entry jump and premature landing clock |
| 22 | [Claude Haiku 5.5 (max)](claude-haiku-5-5-max/STATISTICS.md) | `claude-haiku-5-5` | `max` | T3 Code / Claude Agent SDK | **8.25** | 7,447,694 | $0.25 | 23m 8.921s | No perfect-clear bonus or hidden lock-out; soft-drop timing jump and phone sidebar overflow |
| 23 | [DeepSeek V4.1 Flash (max)](deepseek-v4.1-flash-max/STATISTICS.md) | `deepseek-v4.1-flash` | `max` | T3 Code / OpenCode | **8.25** | 9,118,921 | $0.14 | 24m 21.634s | Broad scoring and fitting UI; unlimited lock resets, ceiling-buffer and B2B-PC gaps, soft-drop jump |
| 24 | [GLM-5.3-Flash (max)](glm-5.3-flash-free-max/STATISTICS.md) | `glm-5.3-flash-free` | `max` | T3 Code / OpenCode | **8.20** | 4,253,523 | $0.19 | 19m 50.224s | Broad rules and responsive UI; wrong gravity curve and no perfect-clear bonus |
| 25 | [Sol Codex](sol-codex/STATISTICS.md) | `gpt-5.6-sol` | — | Codex Desktop | **8.20** | 909,035 | $1.12 | 6m 22.017s | Piece can lock in mid-air after a ledge move; no mini T-spins |
| 26 | [DeepSeek V4.1 Flash (low)](deepseek-v4.1-flash-low/STATISTICS.md) | `deepseek-v4.1-flash` | `low` | T3 Code / OpenCode | **8.15** | 2,309,531 | $0.05 | 6m 54.369s | Canonical core and responsive UI; hard-drop spin loss, incomplete scoring and soft-drop timing jump |
| 27 | [GPT-5.6 Sol (xhigh)](gpt-5.6-sol-xhigh/STATISTICS.md) | `gpt-5.6-sol` | `xhigh` | T3 Code / Codex | **8.00** | 2,931,919 | $2.20 | 7m 29.604s | Canonical core and responsive UI; mini/B2B-PC scoring, stale soft-drop spin credit and partial lock-out fail |
| 28 | [GPT-5.6 Sol (high)](gpt-5.6-sol-high/STATISTICS.md) | `gpt-5.6-sol` | `high` | T3 Code / Codex | **7.95** | 1,816,541 | $1.48 | 5m 3.056s | Canonical core and responsive high-DPI UI; hard drop loses spins, perfect clears and hidden lock-out are missing |
| 29 | [Claude Opus 5.5 (high)](claude-opus-5-5-high/STATISTICS.md) | `claude-opus-5-5` | `high` | T3 Code / Claude Agent SDK | **7.95** | 1,662,260 | $1.48 | 6m 51.314s | Canonical core with exact kicks and spin/B2B tests; missing PC, soft-drop jump, contact/reset timing and clipped phone support |
| 30 | [GPT-6.1 Terra (high)](gpt-6.1-terra-high/STATISTICS.md) | `gpt-6.1-terra` | `high` | T3 Code / Codex | **7.90** | 332,921 | $0.09 | 1m 8.663s | Canonical SRS/full-mini core; missing PC, landing-clock error and premature partial lock-out |
| 31 | [GLM-5.3-Flash (high)](glm-5.3-flash-free-high/STATISTICS.md) | `glm-5.3-flash-free` | `high` | T3 Code / OpenCode | **7.90** | 2,363,761 | $0.11 | 14m 37.371s | Working core with mini/PC scoring gaps, hidden lock-out, soft-drop jump and phone sidebar clipping |
| 32 | [DeepSeek V4.1 Flash (high)](deepseek-v4.1-flash-high/STATISTICS.md) | `deepseek-v4.1-flash` | `high` | T3 Code / OpenCode | **7.85** | 5,255,770 | $0.09 | 19m 30.263s | Broad rules and responsive reflow; inverted I kicks, B2B scoring errors and soft-drop timing jump |
| 33 | [Claude Haiku 5.5 (medium)](claude-haiku-5-5-medium/STATISTICS.md) | `claude-haiku-5-5` | `medium` | T3 Code / Claude Agent SDK | **7.80** | 783,362 | $0.05 | 4m 16.792s | Hidden locks continue or crash; B2B perfect-clear under-award, soft-drop jump and phone sidebar clipping |
| 34 | [Qwen3.8 Max (low)](qwen3.8-max-low/STATISTICS.md) | `qwen3.8-max` | `low` | T3 Code / OpenCode | **7.80** | 935,844 | $2.05 | 16m 33.165s | Canonical core and broad smoke coverage; advanced scoring, soft timing, reset-cap and phone layout gaps |
| 35 | [MiMo-V2.6-Flash (default)](mimo-v2.6-flash-default/STATISTICS.md) | `mimo-v2.6-flash` | `default` | T3 Code / OpenCode | **7.80** | 2,129,675 | $0.04 | 31m 55.288s | Canonical SRS and broad smoke coverage; incomplete spin/PC scoring, soft-drop jump and clipped phone/advanced stats |
| 36 | [Claude Opus 5.5 (low)](claude-opus-5-5-low/STATISTICS.md) | `claude-opus-5-5` | `low` | T3 Code / Claude Agent SDK | **7.70** | 249,765 | $0.48 | 2m 0.334s | Canonical SRS and full/mini scoring; missing PC, soft-drop jump, two contact-clock errors and clipped phone support |
| 37 | [GPT-6.1 Sol (low)](gpt-6.1-sol-low/STATISTICS.md) | `gpt-6.1-sol` | `low` | T3 Code / Codex | **7.65** | 380,287 | $0.18 | 3m 37.809s | Compact canonical SRS engine with full scoring; B2B-PC, hidden lock-out, soft timing and preview distortion; compressed code |
| 38 | [Qwen3.8 Max (medium)](qwen3.8-max-medium/STATISTICS.md) | `qwen3.8-max` | `medium` | T3 Code / OpenCode | **7.65** | 1,115,669 | $2.45 | 19m 19.898s | Canonical SRS and timed full/mini spins; hard-drop/PC scoring, soft timing, partial lock-out and phone gaps |
| 39 | [Luna Codex](luna-codex/STATISTICS.md) | `gpt-5.6-luna` | — | Codex Desktop | **7.60** | 1,177,121 | $0.07 | 11m 31.291s | Four S/Z rotation states are not SRS; game-over overlay shows during play |
| 40 | [GPT-5.6 Terra (max)](gpt-5.6-terra-max/STATISTICS.md) | `gpt-5.6-terra` | `max` | T3 Code / Codex | **7.60** | 3,504,778 | $1.32 | 13m 31.336s | Canonical SRS, gravity and responsive controls; mini/PC scoring, landing lock time, hidden lock-out and stretched phone next fail |
| 41 | [Muse Spark 1.3 (high)](muse-spark-1.3-contributor-high/STATISTICS.md) | `muse-spark-1.3-contributor` | `high` | T3 Code / OpenCode | **7.50** | 338,304 | $0.48 | 2m 30.906s | Full spins, B2B and combos work; mini/PC gaps, hidden lock-out, two soft-drop defects and phone clipping |
| 42 | [GPT-5.6 Luna (xhigh)](gpt-5.6-luna-xhigh/STATISTICS.md) | `gpt-5.6-luna` | `xhigh` | T3 Code / Codex | **7.40** | 1,886,450 | $0.08 | 3m 6.193s | Canonical core, gravity and responsive UI; mini/PC, stale spin, soft timing and hidden-lock gaps |
| 43 | [Claude Sonnet 5.5 (low)](claude-sonnet-5-5-low/STATISTICS.md) | `claude-sonnet-5-5` | `low` | T3 Code / Claude Agent SDK | **7.40** | 124,165 | $0.19 | 1m 3.761s | Basic scoring only; hidden lock-out missing, soft-drop jump and clipped phone sidebars |
| 44 | [GPT-5.6 Sol (medium)](gpt-5.6-sol-medium/STATISTICS.md) | `gpt-5.6-sol` | `medium` | T3 Code / Codex | **7.40** | 1,475,552 | $1.23 | 3m 59.996s | Reversed T orientations; full spins and core clocks work, but mini/PC scoring and hidden lock-out fail |
| 45 | [Cat-jam](cat-jam/STATISTICS.md) | `longcat-2.5-preview-free` | `default` | T3 Code / OpenCode | **7.40** | 2,070,440 | $0.12 | 23m 42.424s | Malformed L rotation state; no T-spin, B2B or perfect-clear scoring |
| 46 | [Muse Spark 1.3 (xhigh)](muse-spark-1.3-contributor-xhigh/STATISTICS.md) | `muse-spark-1.3-contributor` | `xhigh` | T3 Code / OpenCode | **7.35** | 610,821 | $0.86 | 4m 44.107s | Hard drop erases spin credit; mini/PC gaps, hidden lock-out, soft-drop jump and phone clipping |
| 47 | [GPT-6.1 Terra (low)](gpt-6.1-terra-low/STATISTICS.md) | `gpt-6.1-terra` | `low` | T3 Code / Codex | **7.30** | 186,465 | $0.06 | 56.483s | Canonical SRS and basic modern scoring; mini/PC omissions, early landing lock and premature partial lock-out; compressed source |
| 48 | [DeepSeek OMP/PI](deepseek-pi/STATISTICS.md)† | `deepseek-v4-flash` | — | OMP/PI | **7.30** | 18,118,592 | $0.12 | 44m 11.418s | Piece can lock in mid-air after a ledge move; basic scoring only |
| 49 | [GPT-6 Luna (max)](gpt-6-luna-max/STATISTICS.md) | `gpt-6-luna` | `max` | T3 Code / Codex | **7.25** | 1,535,665 | $0.05 | 8m 51.327s | Wrong I kicks; B2B perfect-clear, stale soft-drop spin, timing and phone preview defects |
| 50 | [Muse Spark 1.3 (medium)](muse-spark-1.3-contributor-medium/STATISTICS.md) | `muse-spark-1.3-contributor` | `medium` | T3 Code / OpenCode | **7.05** | 262,101 | $0.37 | 43.277s | From scratch: no T-spins, B2B or perfect-clear bonus; hidden lock-out, soft jump and preview/phone clipping |
| 51 | [GPT-6.1 Terra (medium)](gpt-6.1-terra-medium/STATISTICS.md) | `gpt-6.1-terra` | `medium` | T3 Code / Codex | **6.90** | 392,853 | $0.11 | 1m 21.624s | Canonical SRS/full-mini scoring; missing PC, stale spin, landing/refresh clocks, terminal engine mutation and stretched previews |
| 52 | [Space-bunny](space-bunny/STATISTICS.md) | `space-bunny` | `xhigh` | T3 Code / OpenCode | **6.75** | 21,547,591 | — | 13m 19.433s | Non-SRS shapes and kicks, flattened ghost piece, scoring errors |
| 53 | [Muse Spark 1.3 (low)](muse-spark-1.3-contributor-low/STATISTICS.md) | `muse-spark-1.3-contributor` | `low` | T3 Code / OpenCode | **6.75** | 289,934 | $0.41 | 2m 1.225s | Incorrect kicks and incomplete advanced scoring; soft-drop jump, clipped phone board and overlaid legend |
| 54 | [GPT-5.6 Luna (high)](gpt-5.6-luna-high/STATISTICS.md) | `gpt-5.6-luna` | `high` | T3 Code / Codex | **6.70** | 1,213,979 | $0.06 | 2m 49.620s | Canonical SRS and working controls; scoring, gravity, contact timing and overlapping previews fail |
| 55 | [Muse Spark 1.3 (minimal)](muse-spark-1.3-contributor-minimal/STATISTICS.md) | `muse-spark-1.3-contributor` | `minimal` | T3 Code / OpenCode | **6.65** | 561,377 | $0.73 | 45.005s | Canonical core geometry; incomplete scoring, lock resets and soft timing, hidden lock-out and phone clipping |
| 56 | [GPT-5.6 Luna (max)](gpt-5.6-luna-max/STATISTICS.md) | `gpt-5.6-luna` | `max` | T3 Code / Codex | **6.65** | 2,769,139 | $0.11 | 4m 54.330s | Broad scoring and responsive panels; inverted kick Y, later gravity, B2B-PC, hidden lock and overlay defects |
| 57 | [GPT-6 Luna (xhigh)](gpt-6-luna-xhigh/STATISTICS.md) | `gpt-6-luna` | `xhigh` | T3 Code / Codex | **6.65** | 973,306 | $0.03 | 4m 51.291s | Wrong I kick and gravity; hidden lock-out, B2B perfect-clear and phone next gaps |
| 58 | [GPT-5.6 Terra (xhigh)](gpt-5.6-terra-xhigh/STATISTICS.md) | `gpt-5.6-terra` | `xhigh` | T3 Code / Codex | **6.40** | 1,698,319 | $0.70 | 6m 28.758s | Canonical SRS; scoring, gravity/lock clocks, restart bag and preview rendering fail |
| 59 | [GPT-6 Luna (high)](gpt-6-luna-high/STATISTICS.md) | `gpt-6-luna` | `high` | T3 Code / Codex | **5.90** | 481,494 | $0.01 | 2m 4.148s | Basic-only scoring, wrong and refresh-dependent gravity; airborne moves exhaust lock resets |
| 60 | [GPT-6 Luna (low)](gpt-6-luna-low/STATISTICS.md) | `gpt-6-luna` | `low` | T3 Code / Codex | **5.65** | 131,696 | $0.01 | 1m 8.749s | Wrong SRS pivots, basic-only scoring and gravity; erased next previews and hidden phone hold |
| 61 | [Beam](beam/STATISTICS.md) | `beam-free` | `xhigh` | T3 Code / OpenCode | **5.60** | 1,334,888 | — | 3m 3.429s | Lock timer mixes two clocks; classic scoring table |
| 62 | [GPT-5.6 Sol (low)](gpt-5.6-sol-low/STATISTICS.md) | `gpt-5.6-sol` | `low` | T3 Code / Codex | **5.55** | 734,959 | $0.69 | 2m 42.865s | Inverted kicks, incomplete scoring and slow gravity; lock/reset clocks, hidden lock-out and stretched phone hold |
| 63 | [GPT-5.6 Terra (high)](gpt-5.6-terra-high/STATISTICS.md) | `gpt-5.6-terra` | `high` | T3 Code / Codex | **5.50** | 954,304 | $0.43 | 4m 6.160s | Inverted vertical kicks and incomplete scoring; slow high-level gravity, refresh, hold-clock and phone gaps |
| 64 | [GLM-5.3-Flash (low)](glm-5.3-flash-free-low/STATISTICS.md) | `glm-5.3-flash-free` | `low` | T3 Code / OpenCode | **4.85** | 4,356,489 | $0.16 | 10m 15.035s | Canonical SRS, but hold, gravity/frame timing, scoring and blocked spawn fail; previews overlap and clip |
| 65 | [GPT-5.6 Terra (medium)](gpt-5.6-terra-medium/STATISTICS.md) | `gpt-5.6-terra` | `medium` | T3 Code / Codex | **4.65** | 396,017 | $0.23 | 2m 12.950s | Text-only smoke test; generic kicks, basic scoring, gravity and lock timing fail; phone next clips |
| 66 | [GPT-5.6 Terra (low)](gpt-5.6-terra-low/STATISTICS.md) | `gpt-5.6-terra` | `low` | T3 Code / Codex | **4.65** | 178,320 | $0.16 | 45.685s | Canonical shapes, but generic kicks, basic scoring, wrong clocks, hidden lock-out and presentation defects |
| 67 | [GPT-5.6 Luna (low)](gpt-5.6-luna-low/STATISTICS.md) | `gpt-5.6-luna` | `low` | T3 Code / Codex | **4.25** | 195,984 | $0.02 | 41.388s | Non-SRS rotations, broken hold, basic scoring and wrong timing; phone state clips |
| 68 | [GPT-5.6 Luna (medium)](gpt-5.6-luna-medium/STATISTICS.md) | `gpt-5.6-luna` | `medium` | T3 Code / Codex | **4.20** | 378,157 | $0.02 | 1m 5.368s | Build/tests pass, but a CSS module import prevents browser startup; source scoring and gravity fail |
| 69 | [Nemotron](nemotron/STATISTICS.md) | `nvidia/nemotron-3.5-super-vl:free` | `thinking` | T3 Code / OpenCode | **4.00** | 1,851,716 | $0.20 | 9m 8.773s | Does not start in the browser: imports lack .js extensions |
| 70 | [GPT-6 Luna (medium)](gpt-6-luna-medium/STATISTICS.md) | `gpt-6-luna` | `medium` | T3 Code / Codex | **3.80** | 160,641 | $0.01 | 1m 35.743s | Does not build or start; diagnostic source has wrong SRS, scoring and gravity |
| 71 | [Beam (medium)](beam-free-medium/STATISTICS.md) | `beam-free` | `medium` | T3 Code / OpenCode | **3.80** | 419,090 | — | 38.039s | CommonJS prevents browser startup; diagnostic SRS, scoring, gravity, lock clocks and supporting UI fail |
| 72 | [Beam (low)](beam-free-low/STATISTICS.md) | `beam-free` | `low` | T3 Code / OpenCode | **2.95** | 82,729 | — | 16.402s | Basic falling blocks; missing hold/ghost/next/SRS, incomplete scoring, wrong gravity and broken restart |
| — | [Qwen3.8 Flash (low)](qwen3.8-flash-low/STATISTICS.md) | `qwen3.8-flash` | `low` | T3 Code / OpenCode | Pending | 2,797,077 | $0.44 | 18m 29.858s | Not ranked yet |
| — | [Qwen3.8 Flash (xhigh)](qwen3.8-flash-xhigh/STATISTICS.md) | `qwen3.8-flash` | `xhigh` | T3 Code / OpenCode | Pending | 5,100,876 | $0.81 | 31m 16.524s | Not ranked yet |

**† Claude Opus 5.5 (medium, original):** Kept as a reference. This original medium run worked inside the benchmark repository and read its README, including the results table with other runs' scores and main defects, before implementing; it may have realized it was being rated, so it is not an independent comparison. The isolated re-run, Claude Opus 5.5 (medium), is the comparable medium result.

**† Muse Spark 1.3 (medium, reference-assisted):** Reference-assisted run: the medium-reasoning child read Gemini-4's engine, shape tables, tests, and build files before writing this implementation, so token/time efficiency is not an independent from-scratch comparison. Primary time covers the child task only. The xhigh parent prepared/delegated and verified/reported the result: 339,157 recorded parent tokens and 2m 54.475s end-to-end are documented separately.

**† DeepSeek OMP/PI:** The implementation required two user messages, while the other runs used one benchmark prompt. Elapsed time includes both agent-work phases but excludes the wait for the second message. A later README-only message did not affect the audited implementation and is reported separately.

**Columns:** Quality is the weighted [ranking](RANKING.md) score out of 10; token use and time do not affect it. Tokens are the tested agent's total (input + cache read + cache write + output). Effort is the recorded reasoning setting; `—` means it was not recorded. Effort labels are provider-specific, not equivalent reasoning budgets.

**Est. cost** prices the tested agent's tokens at the model's public API list price on the run date, from [`pricing.json`](pricing.json); `—` means the model has no public price. It is an estimate of the API cost, not what a subscription or free tier charged. Some prices come from third-party listings or are upper bounds; `pricing.json` records the source and caveats for each model.

**Harness overhead:** each run's statistics report separate harness requests. For T3 runs they are not verified; unknown does not mean zero.
<!-- benchmark-results:end -->

## Implementation quality

[`RANKING.md`](RANKING.md) has the rubric, per-criterion scores,
task-conformance and test-coverage tables, and the audit of each
implementation. Scores and confirmed bugs are recorded in
[`ranking.json`](ranking.json); after changing them, run `python3 scripts/benchmark.py render` to regenerate the
leaderboard above and the ranking table.

Evidence is in the audit records: the [October audit](.audit/october-review.md)
for the five T3 Code/OpenCode imports, the [October 23 audit](.audit/oct23-review.md)
for Opus 5.5 and Muse Spark, the [Haiku audit](.audit/haiku-review.md)
for Claude Haiku 5.5 (high, xhigh and max), the [Sonnet audit](.audit/sonnet-review.md)
for Claude Sonnet 5.5 (low, medium, high and xhigh), the
[Gemini high audit](.audit/gemini-high-review.md) for Gemini 4 Argon (high),
the [Muse contributor audit](.audit/muse-review.md) for the five independent
`muse-spark-1.3-contributor-*` efforts (including medium from scratch, distinct
from reference-assisted `muse-spark-1.3-medium`), the
[GLM audit](.audit/glm-review.md) for GLM-5.3-Flash (low, high and max), the
[DeepSeek V4.1 audit](.audit/deepseek-v41-review.md) for DeepSeek V4.1 Flash
(low, high and max), the [GPT-6 Luna audit](.audit/gpt6-luna-review.md)
for all five `gpt-6-luna-*` efforts (including medium's non-building delivery
and xhigh's broken bag-test fixture), the
[GPT-5.6 Luna audit](.audit/gpt56-luna-review.md) for all five
`gpt-5.6-luna-*` efforts (including medium’s browser module failure despite
passing builds/tests), the [GPT-6.1 Sol audit](.audit/gpt61-sol-review.md)
for all four `gpt-6.1-sol-*` efforts (audited by Claude Opus 5.5 to avoid
self-grading), the [GPT-5.6 Terra audit](.audit/gpt56-terra-review.md)
for all five efforts, including max’s separately documented external actions, the
[Qwen3.8 Max audit](.audit/qwen38-max-review.md) for low/medium
(unfinished xhigh excluded), the
[GPT-5.6 Sol audit](.audit/gpt56-sol-review.md) for low/medium/high/xhigh
(all four build, pass their own workflows and start in Chromium), and the
[audit index](.audit/README.md) for the rest. They hold exact session mappings,
reproducible probes, browser evidence, isolation context and test-coverage limitations.

Effort values are the exact settings T3 stored. Cat-jam's `default` means the
provider's default setting, not that reasoning was disabled. Opus 5.5 ran with
fast mode off.

## Results site

The same results are published as a static site with interactive charts
(quality against estimated cost, tokens, and time, each with a "Pareto line"
overlay and a "Pareto only" view of just the frontier runs; cost; token use; time; and
score breakdown) and a
page per run that shows its scores, confirmed bugs, usage, and a playable build
of its game. [`pages.yml`](.github/workflows/pages.yml) builds and checks it on
every pull request and deploys it to GitHub Pages from `main`.

```sh
python3 scripts/benchmark.py site            # builds _site/, including every game
python3 scripts/benchmark.py site --skip-games
npm ci && npx playwright install chromium   # once, for the browser check
npm run check:site                           # loads every page and game in Chromium
```

Each game is built with its own `npm ci` and `npm run build` in an isolated copy
and published as delivered, with two documented exceptions that only affect
static hosting. Asset URLs starting with `/` in a game's `index.html` are made
relative, because the site is served under a project path. A path the run's
own server maps to another file is declared as `static_aliases` in
[`benchmark-runs.json`](benchmark-runs.json) and copied into place. Each run
page names any such change. Nemotron is published unfixed: it is declared as a
`known_browser_failure`, and the browser check confirms it still fails. A run
delivered without `package-lock.json` is declared `missing_lockfile` and
installed with `npm install` instead of `npm ci`. A run whose own build fails is
declared `known_build_failure` (`import --build-failure "<why>"`): `npm test`
must keep failing, and its page has no playable game. A run that builds but
whose own tests fail is declared `known_test_failure` (`--test-failure`): the
tests must keep failing, and the game is still published. A run whose own server
publishes only its build folder is declared with `web_root` (e.g. `dist`), and
the site serves that folder as the game; `static_aliases` are now applied
before the site looks for `index.html`, so a server that maps `/` to
`public/index.html` can be aliased too. A file the run's own server builds on
each request (GPT-6.1 Terra (low) concatenates its `bundle.js`) is declared as
`server_generated` with the server's port and the paths: the site build starts
the run's unmodified `npm start` and saves what the server returns.

Runs that are not a fair comparison, or that newer runs of the same model
supersede, are declared with `site_excluded` and the reason. They stay recorded here, in this README's leaderboard, `RANKING.md`, and
the audits, but the site leaves them out of its charts, leaderboard, and run
pages, renumbers its ranking without them, and names them with their reasons:
currently the reference-assisted Muse Spark 1.3 (medium) run and DeepSeek
OMP/PI, which needed two user messages.

The site's model filter lists models by family, then tier (strongest first),
then version (newest first). [`pricing.json`](pricing.json) gives the order: its
`families` list puts OpenAI, Anthropic and Meta first, then the rest
alphabetically and unattributed stealth models last, each family with its
tiers strongest first; every model entry names its `family`, `tier`, and
`version`, and `verify` rejects one whose family or tier is not listed.

The page generator is [`scripts/results_site.py`](scripts/results_site.py); the
charts and styles are in [`site/assets`](site/assets).

## Token accounting

Every normalized usage table uses the same columns and equation:

```text
Total = Input + Cache Read + Cache Write + Output
```

- **Input** means uncached input tokens.
- **Cache Read** and **Cache Write** remain visible because cached tokens still
  represent model token processing and are included in provider totals.
- **Output** already includes reasoning output when the provider reports a
  reasoning-token subset. Reasoning tokens must not be added again.
- **Tested-agent total** includes only requests made by the implementation
  model through the benchmark harness.
- **Harness overhead** includes identifiable model requests made for harness
  operation: Codex guardian approval reviews or OMP title generation.
- **Combined recorded total** is tested-agent usage plus harness overhead.
  It is shown as `Not verified` when overhead is unknown.

The leaderboard's **Tokens** column is the tested-agent total. Harness overhead
and combined totals appear in each run's `STATISTICS.md`.

OMP's earlier `Tokens total` values of `172,351` for Luna and `78,367` for Sol
were actually `Input + Output`; they excluded cache reads. They are retained in
the detailed files only as **non-cache tokens**, not as total usage.

### Timing convention

Start is the timestamp of the first benchmark user message. End is completion
of the final tested-agent response: Codex's root `task_complete` event, the OMP
response timestamp plus its duration, the final PI assistant-message
timestamp, or T3's completed provider-turn timestamp. Session-file creation and title-generation timestamps are excluded
because they are harness lifecycle events, not benchmark work boundaries.
DeepSeek is the documented exception: its end is the completed implementation
response to message two, and the wait between messages one and two is
subtracted from elapsed time.

## Cost estimates

The **Est. cost** column prices each run's tested-agent tokens at the model's
public pay-as-you-go API list price in effect on the run date:

```text
Cost = (Input × input price + Cache Read × cache-read price
        + Cache Write × cache-write price + Output × output price) / 1,000,000
```

[`pricing.json`](pricing.json) holds the price per million tokens for every
model in the registry, with its source, the date it was checked, and how
strongly it is backed: When a price changed, an entry lists dated `periods`; each run is priced at
the period in effect when it started (its `STATISTICS.md` start time). GPT-5.6
Sol keeps its recorded $5 / $30 for the August runs and uses OpenAI's
promotional $4 / $20 from August 21, 2026.

- **`recorded`**: the price reproduces the cost the harness itself recorded.
  OMP and PI record a dollar cost, so Luna, Sol, and DeepSeek prices are
  checked against four real bills. `verify` fails if any estimate drifts more
  than 1% from a recorded cost.
- **`official`**: taken from the provider's own pricing page.
- **`third-party`**: taken from a price listing because the provider's page
  was not available. Treat these as approximate.

The estimate is what the run would cost through the provider's API. It is not
what a subscription such as OpenCode Go or a free tier actually charged. When a
run used a free or contributor variant, the standard public price of the same
model is used. Where a provider publishes no cached-input price, cached tokens
are priced as regular input, which makes that estimate an upper bound. Models
with no public price at all (Beam and Space Bunny, both free stealth models)
have no estimate. Every assumption is recorded in the model's `note`.

## Session isolation

Sessions were matched by exact ID, working directory, model, prompt, and time.
Broad date filtering is unsafe because unrelated sessions overlap these runs.

The authoritative mappings are stored in
[`benchmark-runs.json`](benchmark-runs.json). Each run declares its tested
session ID, expected provider/model/directory, cutoff policy, and exact
guardian IDs, expected OMP title count, or explicitly unknown T3 overhead.
T3 runs additionally declare their exact T3 thread ID, original working
directory, and recorded reasoning variant. Generated `STATISTICS.md` files
also display the tested session ID.

For Codex, guardian records are included only when their `parent_thread_id`
matches the tested root session. For OMP, database rows are grouped by the
exact `session_file`, and log overhead is included only when its `sessionId`
matches. This excludes, among other data, an overlapping `chrome-bookmarks`
OMP session and the later statistics-audit Codex session.

For PI, the collector opens the one JSONL file whose filename contains the
exact configured session ID, then validates the session record's ID, version,
working directory, provider, and model. Usage is summed across assistant
responses in the included user-message phases; tool calls and results are
counted from those same messages. PI reasoning tokens are an informational
subset of output and are not added again.

For T3 Code/OpenCode, both the exact T3 thread ID and native OpenCode session
ID must match. The collector validates the original project directory, model
alias, reasoning variant, and complete main-agent usage without subagents.
T3 Claude Agent SDK runs also require a matching native `query.open` log
record for their effective effort and fast-mode settings. Delegated Muse
collection validates its parent lineage and explicit task-directory instruction.

## Reproducing the calculations

### Codex

Codex rollouts are JSON Lines files under `~/.codex/sessions/`. The final
cumulative `token_count` event contains the tested-agent usage:

```sh
codex_rollout=/path/to/matching/root-rollout.jsonl

jq -s '
  [.[]
   | select(.type == "event_msg")
   | select(.payload.type == "token_count")
   | select(.payload.info != null)]
  | last
  | .payload.info.total_token_usage
' "$codex_rollout"
```

Codex's raw `input_tokens` includes cached input. Normalize it as:

```text
Input = input_tokens - cached_input_tokens
Cache Read = cached_input_tokens
Cache Write = cache_write_input_tokens
Total = Input + Cache Read + Cache Write + output_tokens
```

Locate child overhead from its metadata and require the expected parent:

```sh
guardian_rollout=/path/to/candidate/guardian-rollout.jsonl

jq -s '
  first
  | select(.type == "session_meta")
  | .payload
  | {id, parent_thread_id, thread_source, source, cwd}
' "$guardian_rollout"
```

The detailed Codex statistics files preserve both final cumulative JSON usage
events, including `reasoning_output_tokens` for reference.

### OMP

OMP's `stats.db` already stores uncached input and cache reads separately. Use
read-only SQLite and restrict the query to the exact session file:

```sh
omp_db=/path/to/.omp/stats.db
omp_session_file=/absolute/path/to/the/matching-session.jsonl

sqlite3 -readonly -header -column "$omp_db" "
  SELECT
    folder,
    model,
    provider,
    COUNT(*) AS model_responses,
    SUM(input_tokens) AS input,
    SUM(cache_read_tokens) AS cache_read,
    SUM(cache_write_tokens) AS cache_write,
    SUM(output_tokens) AS output,
    SUM(total_tokens) AS total,
    SUM(cost_total) AS cost
  FROM messages
  WHERE session_file = '$omp_session_file'
  GROUP BY session_file, folder, model, provider;
"
```

The end time is the latest response completion rather than the latest request
start:

```sql
MAX(timestamp + COALESCE(duration, 0))
```

OMP title-generation calls are recorded in JSON log lines rather than the
tested-agent database aggregate. Match them by exact session ID:

```sh
omp_session_id=replace-with-exact-session-id

jq -s --arg id "$omp_session_id" '
  [.[]
   | select(.sessionId == $id)
   | select(.message == "title-generator: success")
   | .usage]
  | {
      requests: length,
      input: (map(.input // 0) | add),
      cache_read: (map(.cacheRead // 0) | add),
      cache_write: (map(.cacheWrite // 0) | add),
      output: (map(.output // 0) | add),
      total: (map(.totalTokens // 0) | add)
    }
' /path/to/.omp/logs/*.log
```

The OMP directory used for these runs was `/Users/agent/.omp`; the originally
suggested singular path `/User/agent/.omp` does not exist.

### PI

PI sessions are append-only JSON Lines files under
`~/.pi/agent/sessions/`. Restrict collection to the exact session ID and sum
the per-response usage objects:

```sh
pi_session=/path/to/exact-pi-session.jsonl

jq -s '
  [.[]
   | select(.type == "message")
   | select(.message.role == "assistant")
   | .message.usage]
  | {
      responses: length,
      input: (map(.input // 0) | add),
      cache_read: (map(.cacheRead // 0) | add),
      cache_write: (map(.cacheWrite // 0) | add),
      output: (map(.output // 0) | add),
      total: (map(.totalTokens // 0) | add),
      reasoning_subset: (map(.reasoning // 0) | add),
      cost: (map(.cost.total // 0) | add)
    }
' "$pi_session"
```

Each PI response must satisfy the common total equation independently. The
session used for Luna PI declared no separate model-powered harness overhead.

### T3 Code / OpenCode, Claude Agent SDK, and Codex

T3 stores the audited runs in `~/.t3/userdata/statev2.sqlite`. The collector
joins the exact configured T3 thread to its project, native OpenCode session,
and completed provider turn. It uses the whole-turn `turnTokenUsage` field,
not the latest-request `tokenUsage` snapshot:

```text
Input = inputTokens - cachedInputTokens - cacheCreationTokens
Cache Read = cachedInputTokens
Cache Write = cacheCreationTokens
Output = outputTokens
Total = inputTokens + outputTokens
```

Here `outputTokens` already includes `reasoningTokens`. The recorded reasoning
variant is taken from the provider thread's model-selection options. The
[October audit record](.audit/october-review.md) includes the read-only SQLite
query and exact session mappings.

Claude Agent SDK usage uses the same normalized whole-turn fields. Its model
comes from T3's application thread, and effective effort is validated from the
matching SDK `query.open` provider log. For the delegated Muse run, the tested
agent is the medium child; verified xhigh parent turns are shown separately as
recorded orchestration usage, with a lower bound for child plus parent. These
records do not establish a complete harness-overhead total.

Codex runs in T3 (`t3_codex`) use the same whole-turn fields. Their model also
comes from T3's application thread, and the model, effort, working directory,
and service tier Codex actually used are validated from the session's own
rollout under `CODEX_HOME` (`~/.codex/sessions/**/rollout-*-<session>.jsonl`),
whose `turn_context` records must agree. A run on the faster `priority`
service tier is refused.

This adapter supports the audited single-user-message, single-provider-turn
schema. The one exception is a later turn the harness itself starts with a
notification, such as OpenCode's "Background task completed." when a server the
agent left running in the background is stopped after the run. Such turns must
come after the benchmark turn ended and be declared as `t3_notification_turns`
in the registry (`import` records them); they are excluded from usage and time
and listed in `STATISTICS.md`. Cleanup now stops the harness process before its
leftover children, so the notification cannot start a turn. Partial usage, subagents, extra turns, identity/configuration
mismatches, or unsupported schemas fail explicitly. T3 activity counts and
cost are not yet verified. The registry declares overhead as `unknown`, so
both overhead and combined totals remain `Not verified` rather than zero.

## Running a benchmark in T3 Code

New runs are executed in [T3 Code](https://github.com/pingdotgg/t3code) and
brought into the repository in three steps:

```sh
# 1. Prepare an isolated workspace and register it as a T3 project
python3 scripts/benchmark.py new claude-opus-5-5 high
python3 scripts/benchmark.py new opencode-go/gemini-4-argon-contributor medium --launch

# 2. Wait for every pending run to finish and import each one
python3 scripts/benchmark.py watch --import

# 3. Or import one run by hand
python3 scripts/benchmark.py import claude-opus-5-5-high-<id>
```

`new` takes the model ID as T3 reports it and the effort to select. It creates
`~/tetris-bench/runs/<random>/tetris/` holding only `README.md`, a copy of
[`TETRIS.md`](TETRIS.md), adds it to T3 as a project, and opens it. Start a
thread there with that model and effort in full-access mode, and send the
prompt that every T3 run has used, `Read the README.md file and implement it`;
`new` copies it to the clipboard. With `--launch`, `new` starts the thread
itself (see below).

`watch` checks pending runs every 20 seconds by reading T3's database
read-only. With `--import`, each finished run is imported immediately; runs
that cannot be imported are reported and left pending.

`import` reads the thread, native session, model, effort, and provider instance
from T3's own records rather than from what was typed. It refuses the run when
T3 used a different model or effort than `new` prepared, when the thread was
not in full-access mode (elapsed time would include approval waits), or when
the agent reached outside its workspace. It then adds the entry to
[`benchmark-runs.json`](benchmark-runs.json), copies the implementation into
the repository without `node_modules` or build output, runs `refresh`
(collection, isolated `npm test`, `STATISTICS.md`, README and RANKING tables),
and rolls everything back if any step fails. The run shows as `Pending` until
it is audited and scored. Its model needs a [`pricing.json`](pricing.json)
entry first.

### Isolation

Earlier runs shared a parent folder with other implementations, and several
agents looked there. Each new workspace sits in its own randomly named folder
under `~/tetris-bench/runs`, which holds only the active run: `new` refuses to
start while another run is pending, and moves every other folder there into
`~/tetris-bench/archive`. `import` moves the run's folder there once it is
imported. The archive has the owner's read permission removed, so the agent,
which runs as you, cannot list it; listing the folders above its workspace
shows only its own. To delete old runs, restore read permission first
(`chmod -R u+r ~/tetris-bench/archive`).

The workspace layout does not hide copies kept elsewhere on the same disk, and
Beam searches the whole disk for "hidden tests". On October 26, 2026, Beam
(xhigh) found the October runs in an old project folder and copied
Space-bunny's implementation into its workspace, and Beam (high) read a stale
temporary copy of this repository; both were discarded (see
[`.audit/beam-attempts.md`](.audit/beam-attempts.md)). So `new` now also
removes every permission from what a run could copy while it is active: every
top-level entry of this repository except `scripts/`, `.bench/`, `TETRIS.md`
and the manifest, ranking and pricing files (so `.git` and all implementations
are locked), `.bench/abandoned`, `.bench/held` and `.bench/imported` (which name
earlier workspaces), the archive, and any folder listed one per line in the untracked
`.bench/lock-extra`. The original permissions are stored in
`.bench/locked.json`; the next `benchmark.py` command of any kind restores
them first, so `cleanup` and `import` find the repository as it was. The agent
runs as you and could restore the permissions itself, but that is a deliberate
act the isolation check below would report. The lock keeps an agent that is
merely looking around from finding other runs; it does not stop one that sets
out to break it. Beam (high) did exactly that when it was rerun under the lock,
so Beam's remaining efforts were not run. Audits and site builds must delete
their temporary copies too, since a copy in `/tmp` is not locked.

The first layout also removed read permission from `runs` and the run's own
folder. OpenCode cannot start in such a workspace: it resolves the real path of
every folder above it and fails with `PermissionDenied`, so its turn ends
before the model is called.

Isolation is also checked after the fact. `import` scans every tool call in the
T3 session and reports:

- **paths outside the workspace**: file reads, directory listings, searches,
  and paths in shell commands, ignoring system folders and package manager
  caches;
- **T3 data** (`t3-data`): anything under `~/.t3`, whose database holds the
  transcripts of every earlier run;
- **benchmark lookups** (`benchmark`): web searches, fetched URLs, or commands
  that name this benchmark's folder, GitHub repository, or Pages site.

Web access itself is allowed. Searching for the Tetris Guideline or SRS tables
is fine; finding other runs' code or results is not. A run with findings is
refused unless imported with `--allow-outside`, in which case the findings are
stored with its registry entry. `python3 scripts/benchmark.py isolation
[RUN_ID]` runs the same check on registered T3 runs.
When findings have been reviewed by hand, `isolation.review` records the
conclusion; the runs that predate isolated workspaces were reviewed this way in
[`.audit/pre-isolation-runs-review.md`](.audit/pre-isolation-runs-review.md).

Every run records its web mode as `"web"` in
[`benchmark-runs.json`](benchmark-runs.json) and on its site page. All runs so
far are `open`, the default. A planned isolated mode will block web tools
through each harness's workspace configuration and record `blocked`.

### Launching through T3's API

`--launch` starts the thread through `orchestration.launchThread`, the RPC the
T3 app itself uses: full-access mode, the fixed prompt, the effort as the
model's option (`variant` for OpenCode, `effort` for Claude), and title
generation off, which avoids an extra untracked model request.
[`scripts/t3-launch.mjs`](scripts/t3-launch.mjs) authenticates with a
five-minute session that can only operate threads, issued by
`t3 auth session issue` and revoked once the thread starts. This API is
internal and undocumented, so a T3 update can break it. When the launch fails,
`new` falls back to opening the workspace for a manual start. Use `--instance`
when more than one provider instance of the model's driver is enabled.

### Running directly from T3

A run can also be driven from inside a T3 thread, using the orchestration
tools T3 gives its agents instead of `scripts/t3-launch.mjs`. It was first
used for the Claude Haiku 5.5 (high) run; `new --launch` remains for terminal
use.

T3's own tools take over the launch and the wait. `t3_thread_launch` accepts
everything the launch script sends by hand: the `projectId`, a
`modelSelection` whose options carry the effort, `runtimeMode: "full-access"`,
`interactionMode: "default"`, and the first message. `t3_thread_wait` blocks
until the thread reaches a final state. The orchestrating thread runs:

1. `python3 scripts/benchmark.py new <model> <effort> --no-open` in its shell,
   to create the isolated workspace and register the T3 project. The project
   ID is stored as `t3_project_id` in `.bench/pending/<key>.json`. If `t3`
   cannot reach the running app (it then reports `ServerAlreadyRunningError`
   because `~/.t3/userdata/server-runtime.json` is missing), use
   `new <model> <effort> --no-register` and register the printed workspace with
   `t3_project_create`; `import` finds the thread by its workspace path.
   `batch` and `new --launch` need that file too, until T3 is restarted.
2. `t3_thread_launch` with that project ID, the model and effort, full-access
   mode, the fixed prompt `Read the README.md file and implement it` as the
   message, and the same prompt as the title, as `--launch` does.
3. `t3_thread_wait` on the returned thread ID.
4. `python3 scripts/benchmark.py cleanup <key>`, then
   `python3 scripts/benchmark.py import <key>` in its shell.
5. `t3_thread_organize` with `action: "settle"` on the run's thread, so
   finished benchmark threads leave T3's active list. Settle each audit's
   thread too once its results are committed.

This removes the undocumented `orchestration.launchThread` RPC, the
`t3 auth session issue` token, the WebSocket client, and the 20-second polling
in `watch`. `orchestrator_capabilities` lists the exact model IDs, provider
instances, and options T3 accepts, so they no longer have to be typed. Several
runs can be launched in parallel and awaited together.

The CLI is still needed for the rest. Creating the randomly named folders,
removing their read permission, and everything `import` checks and rolls back
are file and database operations an agent should not improvise.

What the Haiku run established:

- **Title generation.** `t3_thread_launch` has no `generateTitle` parameter,
  but with an explicit title none ran: T3's server trace has no title span for
  the thread and the title stayed as given.
- **Permission modes.** A launched thread cannot run with broader modes than
  the thread that launched it, so the orchestrating thread must itself be in
  full-access mode. It was, and the tested thread ran in full access.
- **Thread IDs.** Threads started this way have IDs like `mcp:<uuid>`, and T3
  writes the `:` as `-` in provider log names. The collector now looks the log
  up under that name.
- **Fast mode.** Models without fast mode, such as Haiku, have no `fastMode`
  setting in the SDK log, so none is recorded for them.

Tested agents in T3 are given `allowedTools: ["mcp__t3-code__*"]`, which
includes `t3_thread_search` and `t3_thread_read`; they can read earlier runs'
transcripts without touching a file. The isolation check therefore reports any
call to a T3 tool as `t3-tool`, except the preview browser (`preview_*` and
`t3_preview_*`), which
shows the agent its own pages. The screenshots the preview browser saves under
`~/.t3/userdata/browser-artifacts` are not `t3-data` findings when the same
thread saved them; the Haiku xhigh run checked its game this way. Likewise, a
background command's log under `~/.local/share/opencode/shell` is not a finding
when OpenCode told the same thread it streams there. Calls to harness apps that act on the user's own accounts are reported as
`external-app`: GPT-5.6 Terra (max) used Codex's Sites app to create and
privately deploy a site under the account, so it was left pending for review.

### Running several benchmarks

Workspaces cannot see each other, but every run on the machine shares `/tmp`
and local server ports, and agents of the same model pick the same names. The
Haiku run left `/tmp/tetris-fuzz` (with its own Playwright install),
`/tmp/tetris-serve.log`, and `/tmp/tetris-serve.pid`, and its first server
attempt found its default port taken by an unrelated server for the Opus 5.5
game. Concurrent runs, or later runs finding those leftovers, could therefore
read each other's files or test each other's game. Runs are executed one at a
time, which also keeps elapsed time free of CPU contention, and after each run:

- `cleanup KEY` removes the `/tmp` entries it named (unless they existed before
  it started) and stops anything still running from its workspace. The
  harness's own processes are left alone, except that OpenCode's server or
  Claude's agent process is stopped before a leftover child, since stopping
  the child alone makes the harness start a new turn;
- `preflight`, before the next run, stops any process listening on a port or
  running from a benchmark folder (an active or archived workspace, or a run
  folder in the repository; an old Opus 5.5 server held port 8321 this way)
  and reports, without stopping, anything else on a common game port;
- `hold KEY --reason "..."` parks a finished run that needs a person's
  decision in `.bench/held`, moving its folder into the archive so the next
  run can start without seeing it; `import` and `discard` still find it. A
  run that acted on the user's accounts (GPT-5.6 Terra max deployed a private
  Site through Codex's Sites app) is recorded with `external_actions`, shown
  in its `STATISTICS.md` and on its site page;
- `discard KEY --reason "..."` sets a failed attempt aside in
  `.bench/abandoned` and archives its workspace. When a later attempt is
  imported, the registry's `earlier_attempts` field describes the set-aside
  ones in its `STATISTICS.md` and on its site page (Gemini 4 Argon (high):
  four failed launches and one attempt that killed its own harness, see
  [`.audit/gemini-high-attempts.md`](.audit/gemini-high-attempts.md));
- `python3 scripts/benchmark.py overlaps KEY...` lists every `/tmp` entry named
  by more than one of the given runs (pending keys or run IDs), and every
  localhost port they used during overlapping intervals. It exits non-zero
  when it finds one.

For the 23 runs of October 24, 2026, `overlaps` lists four `/tmp` names used by
more than one run, such as `/tmp/tetris-server.log` (four runs) and DeepSeek's
screenshot names. The runs never overlapped in time, and each earlier run's copy
was removed before the next run started, so no run could read another's files;
no port was shared by overlapping runs.

GPT models run through T3's Codex provider: `new` selects it for `gpt-` model
IDs, with the `reasoningEffort` option and the standard service tier.

`batch` does all of this for one model at several efforts, one run at a time:

```sh
python3 scripts/benchmark.py batch claude-sonnet-5-5 low medium high xhigh --commit
python3 scripts/benchmark.py batch gpt-6-luna low medium high xhigh max --commit
```

For each effort it runs `preflight`, creates the workspace, launches the thread
through T3's API (as `new --launch`), waits for it, runs `cleanup`, imports it,
and with `--commit` commits the run. It finishes with `overlaps` across the
batch. It stops at the first run that needs a person: a failed turn, or an
import refusal such as an isolation finding or failing tests. That run stays
pending to inspect, then import (with `--allow-outside`, `--build-failure`, or
`--test-failure` as appropriate) or `discard`. Quality audits are a separate
step.

## Adding a benchmark run

The benchmark CLI uses only the Python standard library. T3 Code runs are
handled by the commands above; this section covers the manual path every
harness supports. The CLI does not launch Codex, OMP, or PI, modify
implementations, update quality rankings, or create Git commits.

1. Put the completed implementation in a new repository subdirectory with a
   `package.json`, `package-lock.json`, and working `npm test` command.
2. Add one entry to [`benchmark-runs.json`](benchmark-runs.json), including the
   exact root session ID, provider/model, working-directory basename, cutoff,
   and overhead policy. For T3, also include its T3 thread ID, exact original
   directory, and reasoning variant. If its model is new, add the model's
   price to [`pricing.json`](pricing.json), or say why it has none.
3. Point `CODEX_HOME`, `OMP_HOME`, `PI_HOME`, or `T3_HOME` at the machine that
   owns the session data.
4. Refresh the run, review the generated Markdown, and commit it. Until the
   run is scored it appears at the bottom of the leaderboard as `Pending`.
5. After auditing it, add its entry to [`ranking.json`](ranking.json),
   including each confirmed bug's severity, title, and detail, and its audit
   section to [`RANKING.md`](RANKING.md), then run
   `python3 scripts/benchmark.py render`.
6. Build the site and run the browser check. If the game needs its own server
   to load, declare the mapping as `static_aliases` (or `server_generated`
   for a file the server builds per request), or record a
   `known_browser_failure` if it cannot run in a browser at all, or a
   `known_build_failure` if it does not build.

```sh
# Codex defaults to CODEX_HOME=~/.codex
python3 scripts/benchmark.py refresh new-codex-run

# OMP can live under another user's home directory
OMP_HOME=/Users/agent/.omp \
  python3 scripts/benchmark.py refresh new-omp-run

# PI defaults to PI_HOME=~/.pi
PI_HOME=/Users/agent/.pi \
  python3 scripts/benchmark.py refresh new-pi-run

# T3 defaults to T3_HOME=~/.t3
T3_HOME=/Users/david/.t3 \
  python3 scripts/benchmark.py refresh beam

# Claude SDK effort also requires the matching T3 provider log
T3_HOME=/Users/david/.t3 python3 scripts/benchmark.py refresh opus-5.5
```

`refresh` finds only the configured session, fails closed when identity or
expected overhead evidence is missing, installs dependencies and runs tests in an
isolated temporary copy, regenerates the run's `STATISTICS.md`, and refreshes
the README leaderboard and the RANKING table. An explicit T3 `unknown` policy permits the
verified agent total while clearly marking overhead and combined usage as
unverified. Other useful commands are:

```sh
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py refresh --all
python3 scripts/benchmark.py refresh RUN_ID --dry-run
python3 scripts/benchmark.py render
python3 scripts/benchmark.py verify
OMP_HOME=/Users/agent/.omp python3 scripts/benchmark.py verify RUN_ID
python3 -m unittest discover -s tests -v
```

Generated Markdown is the committed result record. `render` regenerates the
README leaderboard and RANKING table from committed statistics and
`ranking.json`, without session files. `verify` without a run ID checks report
arithmetic, that both generated tables are current, that every scored run
has a matching RANKING.md audit heading, and that cost estimates reproduce
every harness-recorded cost. `verify RUN_ID` additionally
recollects that exact source and requires its generated statistics to match
byte-for-byte. Quality scoring itself remains a separate audited workflow.
