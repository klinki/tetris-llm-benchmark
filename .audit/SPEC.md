# Audit specification

This document defines benchmark audit interpretations in addition to the
requirements in [`TETRIS.md`](../TETRIS.md) and the
[scoring rubric](../RANKING.md#methodology). It is an audit policy, not a claim
that every official Tetris title implements the same edge cases. The original
generation prompt and delivered implementations must remain unchanged.

## HD-SPIN-1: T-spin credit after a hard drop

Adopted **2026-11-04** by the benchmark owner, retaining the earlier
[auditor-agreement ruling](auditor-agreement.md#reading).

- A successful rotation establishes eligibility for a T-spin. The final
  corner/kick geometry still determines whether it is full, mini or neither.
- A hard drop that moves the active piece by **one or more rows cancels**
  its rotation credit. Award ordinary drop/line-clear points, without a
  T-spin bonus solely from that earlier rotation.
- A **zero-distance hard drop preserves** rotation credit: it only locks the
  piece. Qualifying full/mini T-spins must still receive their normal bonuses.
- Failed actions that do not move/rotate a piece do not themselves cancel
  eligibility. A successful lateral move or manual soft-drop row cancels it
  under the existing manual-translation policy.
- Automatic gravity is a separate unresolved interpretation. Do not infer a
  new gravity rule or deduction from HD-SPIN-1.

### Required fixtures

Use visible field coordinates x=0..9, y=0..19, canonical SRS states and a fresh
level-one game. Only stack/pose/clock setup is allowed: never assign spin
credit, rotation success or application rule bodies.

1. Set stack cells `(0,17),(0,19),(2,19)` and a T in r0 at `(0,3)`.
   Perform a real clockwise rotation to r1 at `(0,3)`; independently verify
   the ghost destination r1 at `(0,17)`. Hard-drop fourteen rows. Expected
   score delta: **28**, from fourteen times two drop points, with **no** spin
   bonus. Scores 128/428 demonstrate stale mini/full credit.
2. Control for over-clearing: set stack `(5,17),(3,19),(5,19)`, T r3 at
   `(3,17)`, then real CW to r0 at `(3,17)`. Verify zero ghost distance;
   hard-drop without travel. Expected mini score: **100**. Replacing `(5,19)`
   with `(3,17)` makes the full-spin control, expected **400**. A timed lock
   of the same rotated placements must agree.
3. Replay both travel and zero-travel controls against served modules in
   desktop and phone Chromium. Keep evidence of actual and expected scores
   distinct: a runner passing assertions about a known defect is not a
   conformance pass.

### Deductions and coverage

Stale hard-drop credit is a minor correctness defect (−0.5 correctness,
−0.20 weighted). Combine manual-soft and hard-drop stale-credit manifestations
into one spin-history finding. If already part of a broader scoring group,
reassess that group using the established calibration instead of stacking
deductions. Missing spin recognition still fails the zero-travel controls;
awarding no bonus after travel does not prove all T-spin scoring works.

Apply the same policy to every model and future audit. Record exact tested
coverage; do not infer untested implementations are conforming. The
[consistency amendment](hard-drop-rule-review.md) lists reconciled cohorts
and the remaining historical coverage limitation.
