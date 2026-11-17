# GPT-6.2 Sol xhigh / max independent audit

**November 17–18, 2026, Europe/Prague. Reviewer: GPT-6.1 Sol xhigh, Codex / T3 Code.**
Reviewed in the requested order **xhigh → max**, without delegation or reading
implementation transcripts. Both deliveries build, pass their unchanged own
suites, and run in Chromium. Xhigh delivers standard Tetris; max delivers the
custom game “Fluxwell”. Generation effort, elapsed time, tokens, and accepted
outside-access reviews have no effect on these quality scores.

The [evidence](gpt62-sol-xhigh-max-evidence.json) records actual reviewer
`turn_context` **model=gpt-6.1-sol, effort=xhigh**, read from native session
`01a1ebb6-6798-7431-ab26-f52b04963d59`. Current-thread T3 configuration agrees.
Only this review's native metadata was read. The parent must confirm the
completed review turn and archive the isolated run projects with read-back of
`archivedAt`; this reviewer did not archive projects or change the run registry.
No commit, push, PR, model generation, or rerun was performed.

## Scores and calibration

| Effort | Correctness | Own tests | Code | Simplicity | Browser UX | Weighted | Findings |
|---|---:|---:|---:|---:|---:|---:|---|
| xhigh | 9.0 | 6.5 | 9.0 | 9.0 | 9.0 | **8.50** | 2 minor |
| max | 4.5 | 6.0 | 9.0 | 9.0 | 9.0 | **6.60** | 3 major, 2 minor |

Half-point scores, weights **40/20/20/10/10**, major −1.5 / minor −0.5.
Xhigh's PC omission and fifteenth-reset early lock use exactly the earlier
medium cohort's calibration. Max's nonstandard pieces and generic kicks form
one major, as for low/high. Its scoring arithmetic, absent spin/PC/B2B and
nonstandard combo form one major, matching high's grouped scoring finding;
these are not charged separately. Wrong low/middle-level gravity and eight-line
progression form one major. The 450 ms / ten-reset / retained-clock variants
share one minor. Field size is a separate fidelity minor. No critical failure
applies to either playable delivery, and no extra deduction is taken for max's
three-piece preview, visible spawn, lack of hidden storage, or gravity floor.
Automatic-gravity spin history remains outside the policy ruling.

Xhigh's **6.5 tests** match medium: meaningful deterministic bag, hold, kick,
drop/ghost, gravity, lock, line/B2B/level, spin and top-out cases, but no complete
canonical matrix, PC, HD-SPIN-1, ledge/contact/cap boundary or browser tests.
Its own fifteenth-reset test explicitly encodes the early lock. Max's **6.0**
recognizes eleven meaningful native-rule tests: real bag/queue integration,
positive and blocked rotations, collisions, hold/drop, scoring/compaction,
clock/cap, ready/pause and actual reset. That is somewhat broader negative and
lifecycle coverage than high's 5.5, while it lacks authoritative SRS data,
Guideline gravity values, spin, PC, B2B and browser coverage. Added audit probes
earn no own-test credit. Nonconforming gameplay is charged in correctness;
test coverage scores are not additional bug deductions.

Both receive **9.0 code / 9.0 simplicity**: strict TypeScript, no runtime
dependencies, readable state transitions, bounded storage and direct input/
rendering. Xhigh separates geometry/engine/view/controller (684 TS lines);
max separates engine/controller (517). Both use incremental DOM rendering and
small built-in-Node servers. Both receive **9.0 UX** for clear colors, ghost,
hold/queue, status, score/level, discoverable controls, focus handling, pause/
restart and usable phone controls. Four screenshots were inspected; neither
layout overflows horizontally or obscures active play. Phone pages scroll to
additional help. The desktop xhigh page's two-pixel vertical overflow does not
clip the board and is not a defect.

## Xhigh findings

1. **Minor — Perfect-clear bonuses are missing.** Fresh level-one game;
   place I r0(4,18), O r0(4,18), T r1(4,17), or I r1(4,16), fill the complement
   of its cells in the bottom 1/2/3/4 rows, then zero-travel hard drop. The entire
   board empties for **100/300/500/800**, expected additive-PC totals
   **900/1500/2300/2800**. At nine lines a PC single gives100 instead of900
   while correctly advancing to level2. Non-PC Tetris, no-clear placement,
   PC Tetris totals2000 instead of5200. `awardPoints` has no PC detection/bonus.
   These are one omission, not separate findings.

2. **Minor — The fifteenth grounded reset locks immediately.** Grounded I
   r0(3,18), normal first contact established, wait100ms, then fifteen
   alternating successful Right/Left actions. The fifteenth writes four cells
   immediately rather than granting its500ms reset. `afterManipulation`
   increments `lockMoves`, then `checkLanding` calls `lock` at `>=15`.
   One through fourteen resets receive500ms. Both desktop/phone real keys
   reproduce the immediate fifteenth lock; the own suite expects it.

## Max findings

1. **Major — Custom pieces and generic kicks replace the standard seven
   tetrominoes/SRS.** `PIECES.elbow` contains **3 cells**, `cross` and `pocket`
   **5 cells** each; J/L/Z tetrominoes are absent. `bar/box/ridge/step` have
   I/O/T/S geometry. Real hard drops independently weld4/3/4/5/4/4/5 native
   cells. The same nine offsets are tried for every directed transition;
   `box/cross` refuse rotation. All48 ordered diagnostic candidate lists differ
   from SRS (including empty cross lists). The28 ordinal state comparisons
   yield24 mismatches; that diagnostic is not an asserted identity mapping.
   The finding rests on native cardinalities and generic kicks, with no
   invented substitute tetromino or requirement that all native pieces fail.

2. **Major — Line and advanced scoring use different rules.** Grounded
   native `bar0(4,16)`, `box0(4,16)`, `ridge1(4,15)`, `bar1(4,14)` with bottom
   1/2/3/4-row complements produce non-PC **100/300/600/1000**, expected
   **100/300/500/800**. Removing the marker empties the board for those same
   totals rather than PC **900/1500/2300/2800**. The second consecutive single
   adds175 instead of150; at level2 it adds350 instead of300. Separated
   Tetrises give1000 then1000 instead of800 then1200: the total2000 happens
   to match, so the audit records the separate deltas. There is no spin history
   or recognition. Native ridge T, r3(3,15), real CW into r0 with three corner
   supports, zero-distance hard drop gives **0** for mini/full instead of
   **100/400**; timed locks agree at0. This is the y−2 native analogue of
   SPEC's zero-travel controls, not the exact10×20 fixture. The travelling
   native control rotates ridge0(0,3), independently ghosts to r1(0,15), and
   drops12 rows for24. That ordinary-drop result does not establish spin
   conformance when all spin bonuses are absent. Desktop/phone served modules
   and actual Up/Space reproduce24/0/0. No separate HD-SPIN-1 deduction.

3. **Major — Gravity and level progression differ from the Guideline.**
   `round(850*0.82**(level−1))` gives first-row boundaries **850/697/384/142ms**
   at levels1/2/5/10, expected1000/793/356/65 at integer resolution. At eight
   cleared lines the game is level2 rather than1. `LINES_PER_LEVEL=8` and the
   wrong curve are one progression group, matching the earlier high effort.
   No additional deduction for the75ms high-level floor.

4. **Minor — Lock timing is shortened and spent clocks/resets survive a
   lower landing.** Lock delay is450ms and allowance10 instead of500/15.
   Legal native bar0(0,12), supports(0,14),(1,14): alternate Right/Left10 times,
   wait440ms, Right twice off the support. It stays airborne, lands3400ms
   after leaving, then locks at3410ms, retaining the old440ms. The unspent
   control locks3850ms. Separately leave after the same10 resets without the
   440ms wait; at the new floor `lockResets` remains10. Wait400ms, successfully
   move Right, then100ms: six occupied cells instead of the two supports,
   because the lower row received no reset allowance. No airborne lock is
   claimed. Contact itself is event-split correctly:850ms landing +450ms
   lock =1300ms, with no extra frame-loss finding.

5. **Minor — Field dimensions are 9×18 instead of 10×20.** WIDTH9/HEIGHT18
   drive storage, collision, line clearing and162 rendered cells. Both browser
   sizes confirm it. Hidden O-like setups at y−2/−1 are illegal in this native
   engine; that is recorded as unavailable coverage, not a hidden-lock pass.

## Coverage, preservation and reproduction

Read TETRIS.md, AGENTS.md's reviewer policy, all of SPEC.md, methodology and
cohort calibration in RANKING.md, the earlier Sol review and its complete
runner/fixtures, and canonical SRS oracle. Completely read every delivered
file: **14 xhigh + 13 max =27**, including all own tests, source, HTML/CSS,
server/asset scripts, manifests, lockfiles, configs, ignore, README and statistics.
Full SHA-256 lists are below and under `runs.<effort>.hashes` in the evidence.
All27 were checked unchanged after each successful disposable workflow.
The unrelated `benchmark-runs.json` hosting change and all94 old ranking
entries remain exactly as at audit start.

Fresh copies run `npm ci --ignore-scripts --offline`, an explicit
`npm run build`, and unchanged `npm test`: **9/9 xhigh, 11/11 max pass**.
Both resolve TypeScript5.9.3; environment versions and workflow output are in
evidence. Neither installation/build/server touches a delivered directory.
Both servers honor PORT, so **no port constants or other copied source needed
adaptation**. Max uses its intended `npm start`, including prestart build,
serving `dist/`; requesting `/main.js` is correct for its declared web root.
127.0.0.1:8765 was never used, stopped, or inspected.

Engine probes run again against real served modules at **1280×800** and
**390×844**, including28 states/48 ordered candidate lists and504 real native
rotation attempts per effort,100 actual bags each, hold limits/restoration,
independent ghosts/welds/drop points,500ms or native450ms timing, reset/cap,
mid-frame contact, ledge/exhaustion/new-lowest, levels1–20 and60/144Hz cadence,
normal clears/PC, combo/B2B/pre-clear level, compaction, blocked spawn, terminal
freeze, natural top-out and fresh reset/bags. For max, canonical rotation
outcomes are explicitly inapplicable for its custom set, not zero-mismatch
conformance. No delivered application rule body is replaced. A sacrificial
`fits` rejection enumerates candidate lists only; real rotations use intact
collision. Pose/stack/clock setup never assigns rotation success or spin credit.

Xhigh additionally exercises all four T-spin facings, full/mini zero/single
hard and timed locks, double, insufficient corners, no rotation, fourth/fifth
kick distinction, failed actions and manual-soft translation. Exact SPEC
HD-SPIN-1 travel14→28 and zero mini/full→100/400 fixtures pass in Node and
through actual Up/Space at both sizes. Max's smaller field cannot express the
exact y19 controls; its delivered ridge T native analogues are reported
separately with actual/expected values. Missing recognition is not a travel
conformance pass.

Actual Chromium keys exercise Left/Right/Up/X/Z/LeftCtrl/Down/Space/C, pause
freeze/resume, natural top-out and R restart in both sizes. Ghost DOM cells,
preview cell counts and hidden overlay agree with engine state; no application
page error or failed required asset. Four final layout screenshots inspected
before removal. Root Playwright1.64.0 / Chromium156.0.8078.4. A shared-preview
startup check also loaded unmodified xhigh successfully; the owned preview tab
was closed and no files were generated by it.

The first sandboxed server run was denied port binding; approved execution
completed the same workflow. One initial browser serialization referenced an
unserialized oracle name; only the audit adapter changed to a literal piece
list. Initial timing setup omitted prior surface contact, and copied custom
ledge coordinates would have overlapped a bar mino; the corrected fixtures
explicitly establish contact and independently reject colliding ledge poses.
Initial generic PC selection left extra minos after some clears; final named
native poses independently empty the board for every PC case. These are
harness corrections, not implementation failures. All disposable copies,
logs, PNGs and owned servers/browser processes clean on completion and handled
failures/interruption; no /tmp artifact remains.

```sh
python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline
python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline --effort max --engine-only
# Inspect PNGs interactively, then Enter removes them:
python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline --review
```

[Runner](run-gpt62-sol-xhigh-max-audit.py), [engine fixtures](gpt62-sol-xhigh-max-audit.mjs),
[browser fixtures](gpt62-sol-xhigh-max-browser.cjs), [evidence](gpt62-sol-xhigh-max-evidence.json).
`--record` deliberately refreshes numeric outcomes; ordinary execution compares
all engine outcomes with the pinned evidence, including confirmed defects.
A passing audit runner establishes reproducibility, not universal conformance.
Offline mode needs cached dependencies and root Playwright/Chromium installed.

This is a focused conformance review, not exhaustive state-space proof or a
long-duration physical-touch/cross-browser test. Native hidden setups for max
are unavailable. Automatic-gravity spin interpretation is not scored. Usage
accounting/generation state are separate from this quality audit. Supplied
xhigh second-turn server-only restart and allowed outside access are context
only; neither source generation transcript was opened for grading.

## Validation

- `python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline --record --review`: passed both efforts in order, explicit builds, unchanged own9/11, all engine/served-module/actual-key checks; four PNGs visually inspected before cleanup.
- `python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline --record`: final numeric/workflow recording passed both efforts and Chromium views; all copies and owned processes removed.
- `python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline`: final pinned fresh-copy rerun passed both efforts,9/11 own suites and both viewports; all27 hashes unchanged and cleanup confirmed.
- `python3 .audit/run-gpt62-sol-xhigh-max-audit.py --offline --record --engine-only`: passed both efforts during fixture development; `--effort xhigh --engine-only --record` also passed. Final full workflow covers the final fixture revision.
- `python3 scripts/benchmark.py render`: exit0. `python3 scripts/benchmark.py verify`: exit0.
- `node .audit/verify-ranking.mjs`: exit0, **577 local links,96 score rows**, deductions, arithmetic, ordering and Markdown tables pass.
- `node --check` on both new JavaScript fixtures and Python `ast.parse` on the runner: pass. `git diff --check`: pass.
- Parsed preservation: all94 earlier ranking entries identical; untouched registry hosting change and prior low/medium/high audit files match the initial snapshot; all27 delivered hashes match; Node and both served-module engine outcomes are identical per effort.

The first repository verification identified new/shifted heading ordinals; all
heading ranks were updated while retaining prior scores and section bodies.
The ranking validator then identified the introductory count still at94; it
was updated to96. These were reporting updates, and all final checks pass.
Only the two ranking entries, this audit's five artifacts, the audit index,
RANKING sections/heading ordinals and generated README/ranking tables changed.
The registry's pre-existing uncommitted hosting declarations remain untouched.
Quality review is finished. Parent confirmation of this completed turn and
isolated-project archival remain lifecycle steps; this is not a claim that
the run projects have been archived.

## Delivered SHA-256 hashes

### xhigh

| Delivered relative path | SHA-256 |
|---|---|
| `.gitignore` | `790e3169bc19b046fe55ba1da6d13b976c28363c8c00462a2195fe5faf260910` |
| `README.md` | `36e2097a78fe8b5646e6216338640831cff0a284cc823c4b1f658991c8d40294` |
| `STATISTICS.md` | `e556876c5ae9785e2aa2cac2e3f770f6949ebbeea6dd42470fcc2d57767c8b19` |
| `index.html` | `cc26f5fb981138b026b9b5854d9660cb64acc885c3a7a6a0a60f8cd00ada92fb` |
| `package-lock.json` | `faaf9dc47889addc46cf05ed05b3897a29c30388d46151de185d1722a2a7b1e2` |
| `package.json` | `9c7abf1cc9b15e186484921b00ec91a508f124fbfcaed045521d7307248e5b79` |
| `server.mjs` | `3b3886e331f3a9b67e3d47558418824e541ed80abeb14c598d66cd8d2a234018` |
| `src/game.ts` | `a73e32e41ccc13390417d3b454f5b9cb072f14bdaa1c140e53a99df94943bced` |
| `src/main.ts` | `83339c54dd67be0866f9b713eaf23ae1246bec48f3127a9cb6a0bea4a8dd165a` |
| `src/pieces.ts` | `06b13bc3c1e15136fb97d083bb8797eb4aea5508622de0e2a2813b30e61d9c40` |
| `src/view.ts` | `a9e6f5c56eeb756e86dadcfdac4ab2dda2fb5a3d2e063988409a3a5d529e787d` |
| `styles.css` | `af1ac2d288555a40ba0113d8dd512aec2a48cc893c321af332bb864ae640183c` |
| `test/game.test.mjs` | `6e4cf97d740cd1a6d408d0abb3b89238fe884ca846a9a6082724d8f33be222d7` |
| `tsconfig.json` | `64e985901dfaa84497345c429e1b6a0f5da27fc02b97652bd087e74beadd3330` |

### max

| Delivered relative path | SHA-256 |
|---|---|
| `.gitignore` | `e592a3be4d1497b648a6c1406fd1e6961f1fcac39b3f9458fb20a2a92c5010eb` |
| `README.md` | `1446b45469f013f5cd311ae43ab35c0da4b0079f56adc3331c7202ab2eb9e8d2` |
| `STATISTICS.md` | `39d252c24fe00603ec6e22cd90121413de8aaf6a8d82140949611d5c298f712b` |
| `package-lock.json` | `87257d9dac92d4f6b715866bc543413ad0cb341a1d5cc88d39eeb7a64c81c1ac` |
| `package.json` | `82a134f81bb2ddd6507b32522ae56112c06359694d0be583c464ae9d5a9fe7ee` |
| `public/index.html` | `54074d7276ee29435cd1df41eca07bd3b4d9abdcd9b1083d7ca4e7ae442d0a8a` |
| `public/styles.css` | `5a7808ce28af3350b104b0c4980e4fd5a7080c87591f6e7efb3388ec38e47964` |
| `scripts/copy-assets.mjs` | `9f9c3f051273c84de9020e6166b6d0d2e9648522b04a446ff442a768138f2447` |
| `scripts/serve.mjs` | `f27788a252a725941a1f765ba4b967754f84cbfd6192de3801024d87bb4508f0` |
| `src/game.ts` | `f19eedb36a2b2a0881b922131a277eb3fdd544d6c42bf0f46008f68cfcd38b82` |
| `src/main.ts` | `69a5cff8d2554fe56e6c09781a22aa5ad7acad797cb7ade1b08a89b52a1a1cb8` |
| `test/game.test.mjs` | `10679cf3a6ea702e31c1f8ef73e3be7ad37cd1ccf2b6639da5e7138fd8060cd4` |
| `tsconfig.json` | `55572f73ffcc996ebddcde5eb779259c227d24d97f1b51402e9f9f07504f1f48` |

## Parent verification (orchestrator)

Verified 2026-11-18 by the orchestrating thread (Claude Opus 5.5), independently
of this review's own claims:

- **Review thread:** T3 delegated task `Sol 6.2 xhigh/max quality audit (Sol 6.1 xhigh)`,
  child thread `thread:delegated-task:command%3Amcp%3A96b83502-020d-401c-b2ec-ca894389afa1%3Adelegate-task%3Abab4b01d-196d-4696-9471-4d0501891880`,
  status completed.
- **Native session:** `~/.codex/sessions/2026/11/17/rollout-2026-11-17T23-52-42-01a1ebb6-6798-7431-ab26-f52b04963d59.jsonl`
  (originator T3 Code, cwd this repository). Its `turn_context` records
  **model=gpt-6.1-sol, effort=xhigh**; 39 exec calls and no `spawn_agent` or
  `delegate_task` calls. The only related session,
  `01a1ebb6-d895-7a53-9456-871ec81a2259`, is Codex's automatic approval
  reviewer (`guardian_review`, `codex-auto-review`/low, parent this session)
  and made no tool calls.
- **Artifacts:** this review, the runner/fixtures/evidence named above, two new
  `ranking.json` entries (xhigh 8.50, max 6.60); no other entry changed
  relative to commit e0ffeee.
- **Re-checks:** `python3 scripts/benchmark.py verify` exit 0;
  `node .audit/verify-ranking.mjs` 577 links / 96 score rows;
  `python3 -m unittest discover -s tests` OK. The max custom-piece and field
  findings were confirmed in source (`gpt-6.2-sol-max/src/game.ts`: 9×18
  field, "Bar"/"Elbow" polyominoes) against TETRIS.md.
