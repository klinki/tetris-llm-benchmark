# Review 2 — informed re-audit (9.30)

| | |
|---|---|
| Date | 2026-11-19 |
| Reviewer | GPT-6.1 Sol (`gpt-6.1-sol`), effort `xhigh`, verified from the native Codex `turn_context` |
| Native session | `01a1f45b-1d8e-7d40-b62d-6ce80306faa6` (`~/.codex/sessions/2026/11/19/rollout-2026-11-19T16-09-34-01a1f45b-1d8e-7d40-b62d-6ce80306faa6.jsonl`) |
| T3 thread | `thread:delegated-task:command%3Amcp%3Af8e67e82-33a8-4752-a87c-b7bc072bd0bf%3Adelegate-task%3A04ba6eb6-0a95-459c-b74f-539200ed3598` |
| Briefing | **Informed:** told the entry was hand-improved, given review 1's findings and the author's claimed fixes, and asked to verify them and hunt for new defects. |
| Version reviewed | Second version (56 tests). Its finding was fixed before review 3. |

The reviewer's final report follows unchanged. It wrote no files. Its links
point to the folder's location at the time (`perfect-artificial/`, now
[`../tetris-hand-improved/`](../tetris-hand-improved/)).

---

**Weighted score: 9.30/10.** Both previous findings are fixed. I confirmed **one new minor timing defect**. Artificial provenance, tokens, time, and cost had no scoring effect.

Reviewer: **GPT-6.1 Sol, xhigh reasoning effort**.

| Category | Score | Justification |
|---|---:|---|
| Correctness — 40% | **9.5** | Broad conformance passes; one browser input/lock-timing minor deducted. |
| Tests — 20% | **9.5** | 56 passing cases with strong canonical geometry, legal kick fixtures, scoring, timing, input, and server coverage. No owned browser integration suite. |
| Code — 20% | **9.0** | Readable strict TypeScript, focused modules, DOM-free engine, validated DOM lookups/actions, no runtime dependencies. Public writable state leaves invariants dependent on caller discipline. |
| Simplicity — 10% | **9.0** | Proportionate implementation and standard tooling. Some state-transition bookkeeping remains distributed through the browser entry point. |
| Browser UX — 10% | **9.0** | Clear board/ghost/previews, working keyboard and touch controls, pause, sound, and responsive layouts. Small-screen explanations and board size could improve. |

`9.5×0.40 + 9.5×0.20 + 9×0.20 + 9×0.10 + 9×0.10 = 9.30`

Calibration:

- **High, 9.35:** current tests and simplicity each improve by 0.5; current correctness is 0.5 lower because of the newly confirmed edge case.
- **Xhigh, 9.25:** equal correctness/tests/code/UX; current simplicity improves by 0.5.
- **Prior artificial audit, 9.10:** fixing two minors and finding one new minor raises correctness from 9.0 to 9.5. Other category scores remain unchanged.

These are comparisons with the recorded calibration scores, not fresh certifications of the historical implementations.

**Confirmed finding — minor: horizontal repeats shorten lock delay and produce refresh-dependent results.**

The browser frame loop (`src/main.ts:254`) processes `controls.update(delta)` before `game.update(delta)`. A repeat can reset lock time, after which the engine immediately charges the entire frame’s elapsed time against that fresh delay.

Minimal repro, using the unchanged frame callback and a real held key:

1. Start a fresh level-one game with an empty board.
2. Place a legal O, rotation 0, at origin **(3,18)**; reset input and clock.
3. Hold **Right** continuously.
4. Advance exactly **725 ms**, once using 60 Hz frames and once using 144 Hz frames.

| At 725 ms | Observed result |
|---|---|
| 60 Hz | O has locked; `pieces = 1`; next piece spawned. |
| 144 Hz | O remains active at **(7,18)**; `pieces = 0`; lock timer ≈ **495.833 ms**. |

The last successful repeat is due at 233 ms, so its fresh 500 ms delay should expire at 733 ms. The implementation applies the repeat before advancing through its frame, consuming some delay prematurely. Reproduced at desktop and phone widths. This is **one grouped minor**, consistent with existing frame/contact timing deductions.

The remedy is to advance repeat events and engine time in chronological order. Merely reversing the two update calls would move the timing error.

**Previous findings and author claims verified**

- **Downward kick:** the supplied stack and movement sequence reaches T r1 at **(2,14)**. It survives 499 ms after the kick and locks at 500 ms. Source inspection confirms the shared lowest-row restoration runs after successful placements and descent.
- **Stale toast:** a scoring block-out produces “Single +100”; immediate real **R** starts clean, with neither the toast shown nor the flash class retained.
- **Kick tests:** source poses are now legal; assertions use the first fitting candidate from the independent offset list.
- **Tests:** exactly **56/56 pass**, including the kick regression and action validation.
- **Initialization/validation:** one bag construction per restart; `byId` validates element types; markup action values are checked with `isAction`.
- **Layout:** all four requested viewports fit without document scrolling.

**Verification performed**

The temporary copy passed `npm ci --ignore-scripts --offline`, build, and the unchanged test suite, including a final rerun. Local socket/Chromium sandbox restrictions were resolved with process permission; they were not scored as implementation failures.

Independent probes covered:

- All **28 canonical states**, **48 ordered non-O kick sequences**, and **5,600 legal rotation scenarios**, including 604 rejected rotations.
- 100 actual engine bags, hold restrictions/retrieval, and obstructed ghost/drop checks across all 28 orientations.
- Gravity at every level **1–20**, soft-drop transition, engine frame equivalence, 499/500 ms locking, reset cap, ledges, and lowest-row restoration by fall and kick.
- Full/mini spins across all facings, fifth-kick promotion, full doubles/triples, HD-SPIN-1, B2B, combos, perfect clears including B2B Tetris PC, and level crossing.
- Block-out, hidden/partial lock-out, terminal guards, restart, and 30 seeded games through top-out.

Chromium **156.0.8078.4** passed required keys, touch controls, header-button Space handling, pause/blur, game-over → R, and served-module scoring probes. Console errors and failed requests: **zero**.

| Viewport | Board | Scrolling |
|---|---:|---|
| 1280×800 | 338×676 | None |
| 1366×640 | 268×536 | None |
| 390×844 | 260×520 | None |
| 320×568 | 128×256 | None |

All four screenshots were visually inspected; board and preview proportions are correct.

**Observations without deductions**

No additional defect was confirmed. The 320×568 board is small, although unclipped; touch rotation/drop explanations are mostly symbolic. Public writable engine state is a deliberate design tradeoff. Automatic-gravity spin interpretation remains unresolved under the audit policy. Physical touch hardware, other browsers, and exhaustive state-space coverage remain unverified.

**What remains for 10.0**

- **Correctness:** fix chronological repeat/engine timing and pass the repro at matching timestamps across refresh rates.
- **Tests:** add owned browser regressions covering integrated repeat/lock timing, restart effects, header focus, pause/blur, touch, and compact layouts.
- **Code:** provide a controlled fixture/state boundary so production invariants do not rely on unrestricted mutation; further separate browser orchestration from optional audio/storage.
- **Simplicity:** consolidate remaining start/resume/restart/pause transition responsibilities without introducing extra framework machinery.
- **UX:** improve touch/state explanations and small-screen board allocation while retaining the verified fit.

All **16 authored target files remained byte-identical**. Temporary copies, scripts, results, screenshots, and audit-owned processes were removed.
