# Review 1 — informed audit (9.10)

| | |
|---|---|
| Date | 2026-11-19 |
| Reviewer | GPT-6.1 Sol (`gpt-6.1-sol`), effort `xhigh`, verified from the native Codex `turn_context` |
| Native session | `01a1f44f-f61e-7a81-8fbc-6966ff7f6e54` (`~/.codex/archived_sessions/rollout-2026-11-19T15-57-23-01a1f44f-f61e-7a81-8fbc-6966ff7f6e54.jsonl`) |
| T3 thread | `thread:delegated-task:command%3Amcp%3Af8e67e82-33a8-4752-a87c-b7bc072bd0bf%3Adelegate-task%3A47f6cc1c-eb03-4e7f-94bd-a1da9d283659` |
| Briefing | **Informed:** told the entry was hand-improved from `gpt-6.1-sol-high` and listed past defect classes. Asked to score with no leniency. |
| Version reviewed | First hand-improved version (54 tests). Later fixed; see [the reference README](../README.md#history). |

The reviewer's final report follows unchanged. It wrote no files. Its links
point to the folder's location at the time (`perfect-artificial/`, now
[`../tetris-hand-improved/`](../tetris-hand-improved/)).

---

**Score: 9.10/10. Two confirmed minor defects; no major or critical findings.**

Auditor: **GPT-6.1 Sol (`gpt-6.1-sol`), xhigh reasoning effort.** Artificial provenance had no scoring effect.

| Category | Score | Justification |
|---|---:|---|
| Correctness — 40% | **9.0** | Strong conformance across the independent probes; two minors below, each deducted once. |
| Tests — 20% | **9.5** | All 54 pass. Broad deterministic engine coverage and isolated input tests; no delivered browser regression suite, and kick fixtures often begin with overlapping source poses. |
| Code — 20% | **9.0** | Readable strict TypeScript, focused modules, DOM-free engine and no runtime dependencies. Public writable state and unchecked DOM casts still require caller discipline. |
| Simplicity — 10% | **9.0** | Proportionate five-module design with one engine clock and shared input handling; simpler browser wiring than the calibrated high/xhigh entries. |
| Browser UX — 10% | **9.0** | Clear board, ghost, proportional previews, useful statistics, responsive controls and clean runtime. Consistent with high/xhigh’s qualitative calibration. |

Weighted total: `3.60 + 1.90 + 1.80 + 0.90 + 0.90 = 9.10`.

Compared with the recorded **high: 9.35** and **xhigh: 9.25**, this entry earns stronger test coverage than high and better simplicity, but the two confirmed correctness deductions outweigh those gains.

The offline install, build and **54/54 tests passed** in a temporary copy. Independent probes passed all 28 canonical states, 48 ordered kick sequences, 672 legal rotation outcomes, 100 bags, hold, obstructed ghosts, drops, gravity levels 1–20, ordinary lock boundaries/cap/ledge descent, scoring and top-out/restart checks. Scoring included full/mini spins, fifth-kick double/triple, B2B, combos, all perfect-clear sizes and B2B Tetris PC.

Chromium **156.0.8078.4** passed the requested keyboard bindings, pointer controls, focused-header Space checks, pause/resume, terminal controls and R restart at **1280×800, 390×844 and 320×568**. HD-SPIN-1 produced **28/100/400** for travel/zero-travel mini/full, with matching timed controls. No application errors or failed assets occurred.

1. **Minor: a downward kick reaches a new lowest row without restoring lock state.**

   Minimal reproduction, using visible coordinates:

   - Stack: **(3,12), (4,14), (4,16)**.
   - Start a legal **T r0 at (4,12)**, with lowest row initialized to 12.
   - Perform **15 alternating Left/Right moves**, beginning Left; finish at **(3,12)**.
   - Wait **490 ms**, then rotate clockwise.
   - The fifth SRS kick reaches grounded **T r1 at (2,14)**.
   - It locks **10 ms later**, rather than receiving a fresh **500 ms** delay.

   After the kick, `lockTime=490`, `lockResets=15` and `lowestY=12`. Lowest-row restoration occurs only in `descend()`, whereas rotation uses `place()`. This reproduced in Node and through real Chromium keys at desktop and phone sizes. See `engine.ts:216` and `engine.ts:226`.

2. **Minor: restarting can display the previous game’s scoring toast.**

   Minimal reproduction:

   - Fill row 19 except columns **3–6**; add stack cell **(4,−2)**.
   - Place **I r0 at (3,18)** and set incoming piece to T.
   - Press Space: the single scores **100**, shifts the blocker into the incoming spawn and causes game over.
   - Immediately press **R**, before the 1.6-second toast expires.
   - The new game has score **0**, but displays **“Single +100.”**

   Restart clears engine state but leaves `toastUntil` active. This reproduced at both desktop and phone sizes. See `main.ts:79` and `main.ts:207`.

Observations without deductions: the 320×568 document needs about **44 px of vertical scrolling**, with no horizontal clipping and reachable controls. Automatic gravity clears spin eligibility; that interpretation remains unresolved by benchmark policy. Blur-handler behavior passed dispatched-event checks, but headless tab switching did not generate a genuine blur event, so physical focus transitions are not certified.

To reach **10.0 in each category**:

- **Correctness:** refresh lowest-row lock state after downward kicks while preserving rotation credit; clear transient scoring UI on restart.
- **Tests:** add legal starting-pose kick fixtures and delivered browser regressions covering focus, restart effects, responsive layout and both findings.
- **Code:** tighten writable engine-state boundaries and replace unchecked generic DOM casts with validated element access.
- **Simplicity:** remove redundant bag initialization and consolidate overlapping start/resume/restart bookkeeping without adding abstraction layers.
- **UX:** make the smallest phone layout fit without scrolling and improve visible explanations for touch actions and game state. These are qualitative improvements, not additional defect deductions.

The target remained read-only. Browsers and servers were closed, temporary copies/scripts/screenshots were deleted, and the original worktree status was unchanged.
