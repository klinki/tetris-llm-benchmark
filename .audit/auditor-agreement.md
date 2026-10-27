# Auditor agreement check

Most runs are audited by GPT-6.1 Sol (xhigh), including OpenAI models from its
own family. This check measures how far a second, independent auditor agrees
with those scores, and whether either auditor appears to favour its own family.
It changes no score in `ranking.json` or `RANKING.md`.

## Round 1 (small sample) — 2026-10-27

**Auditor:** Claude Opus 5.5 (high), blind. It received a folder outside the
repository, with no git history, containing only `TETRIS.md`, the rubric and
Methodology from `RANKING.md`, two calibration audits that never mention the
sample runs ([GLM](glm-review.md), [Luna PI](luna-pi-review.md)), and the three
implementations as `run-a`, `run-b`, `run-c` in shuffled order. No `STATISTICS.md`
was included, and no model or vendor name appears in the implementations, so it
did not know which model wrote which run, including its own. It reported staying
inside that folder, apart from loading Playwright and reading one public
tetris.wiki page. Its unedited report, scores and probes are in
[`auditor-agreement/`](auditor-agreement/opus-blind-round-1-report.md).

**Sample:** one run per group, all originally audited by Sol.

| Group | Run | Blind name |
|---|---|---|
| OpenAI (Sol's family) | GPT-6.1 Terra (max) | run-a |
| Anthropic (Opus's family; Opus's own model) | Claude Opus 5.5 (xhigh) | run-b |
| Neither | Gemini 4 Argon (high) | run-c |

### Scores

Criteria: correctness / tests / code / simplicity / browser UX.

| Run | Sol | Opus (blind) | Weighted Sol → Opus | Opus − Sol |
|---|---|---|---:|---:|
| GPT-6.1 Terra (max) | 9.0 / 8.5 / 9.0 / 8.5 / 9.0 | 9.0 / 8.0 / 8.5 / 9.0 / 9.5 | 8.85 → 8.75 | −0.10 |
| Claude Opus 5.5 (xhigh) | 8.0 / 8.0 / 9.0 / 8.5 / 8.5 | 9.0 / 8.0 / 9.0 / 9.0 / 7.5 | 8.30 → 8.65 | +0.35 |
| Gemini 4 Argon (high) | 9.0 / 8.0 / 8.5 / 7.0 / 8.5 | 7.5 / 6.5 / 7.5 / 6.5 / 7.5 | 8.45 → 7.20 | −1.25 |

Mean absolute difference: **0.57**. Mean signed difference (Opus − Sol): **−0.33**.
The order of the three runs also differs: Sol ranks Terra > Gemini > Opus,
the blind Opus audit Terra > Opus > Gemini.

### Findings (all minor in both audits)

| Run | Found by both | Sol only | Opus only |
|---|---|---|---|
| Terra max | A new lowest row keeps exhausted lock time | Stretched desktop next preview | T-spin credited after the T falls following its rotation |
| Opus xhigh | No perfect-clear bonus; phone layout clipping | Landing frames charge pre-contact time to lock delay; the 15th reset forces an immediate lock | — |
| Gemini Argon | No perfect-clear bonus; phone layout clipping | — | No hidden rows above the field (spawn one row low, cells above the field discarded); 10 ms gravity floor at levels 15+; held keys auto-repeat hard drop and rotation |

### Reading

- **No sign that Sol favours its own family.** On Terra max the two auditors
  agree within 0.10 and on correctness exactly.
- **The blind Opus audit scored its own model 0.35 higher than Sol did,**
  mostly on correctness: it missed two lock-timing defects that Sol's runner
  reproduces. It also scored that run's UX a point lower. Because Opus did not
  know the run was its own, this looks like lower recall on subtle timing
  rather than favouritism, but one run cannot separate the two.
- **The largest gap is the neutral run (−1.25):** Opus reported three defects
  Sol did not, and judged its tests, code and UX lower. Whether those three
  defects are real decides whether Sol's 8.45 is too high or Opus is too strict.
- **Auditor noise is large.** With one auditor, a weighted score is uncertain
  by roughly ±0.5, so leaderboard gaps of a few tenths are not meaningful.
  Most disagreement comes from which defects each auditor finds, not from how
  it applies the fixed severities.

### Adjudication of disputed findings

Each finding reported by only one auditor was checked against the delivered
source and against how the benchmark has already ruled on the same behaviour
in other runs (`ranking.json`). No score was changed.

| Run | Finding (reported by) | Verdict | Evidence |
|---|---|---|---|
| Terra max | T-spin still credited after the T travels down by hard drop or gravity after its rotation (Opus) | **Valid minor** (hard-drop travel); gravity part unruled | `hardDrop()` and gravity never clear `lastRotation`; only `move()` and `softDrop()` do. The benchmark already deducts "Manual soft drop preserves stale T-spin credit" as a minor (GPT-5.6 Luna xhigh, GPT-5.6 Sol xhigh, GPT-6 Luna max, GPT-6.1 Terra medium/xhigh); travelling down by hard drop is the same downward last action. No precedent covers gravity alone. |
| Terra max | Stretched desktop next preview (Sol) | **Valid minor** | Sol's runner measures the 128×240 backing shown at 128×210; Opus did not examine it. |
| Opus xhigh | Landing frames charge pre-contact time to lock delay (Sol) | **Valid minor** | Reproduced by Sol's runner; the same defect is deducted for GPT-5.6 Terra max. |
| Opus xhigh | The fifteenth reset forces an immediate lock (Sol) | **Valid minor** | Reproduced by Sol's runner; deducted for Qwen3.8 Max low and Claude Opus 5.5 high. |
| Gemini Argon | Cells locked above the field are discarded; pieces spawn one row low (Opus) | **Valid minor** (discarded cells); spawn row not a defect under current convention | `lockPiece()` writes only cells with `y >= 0` and continues play when any cell is visible, so blocks above the field vanish (deducted the same way for Beam medium). No earlier audit has deducted for spawning in the top visible rows. |
| Gemini Argon | 10 ms gravity floor at levels 15+ (Opus) | **Valid minor** | `getGravityIntervalMs` returns `Math.max(10, …)`; its own Guideline formula gives about 7.1 ms at level 15 and 0.45 ms at level 20. Sol's Gemini probe checked only levels 1–2; wrong gravity curves are minors elsewhere (GLM-5.3-Flash). |
| Gemini Argon | Held keys auto-repeat hard drop and rotation (Opus) | **Not a defect under current convention** | Native key repeat is noted as UX context in many audits (including Sol's Gemini audit) and has never been deducted. Repeated hard drop on a held Space is arguably different and should be ruled on for all runs at once, not for one. |

**Correctness if every valid finding were applied** (each −0.5):

| Run | Sol | Opus (blind) | Adjudicated | Weighted (Sol's other criteria) |
|---|---:|---:|---:|---:|
| GPT-6.1 Terra (max) | 9.0 | 9.0 | 8.5 | 8.85 → 8.65 |
| Claude Opus 5.5 (xhigh) | 8.0 | 9.0 | 8.0 | 8.30 (unchanged) |
| Gemini 4 Argon (high) | 9.0 | 7.5 | 8.0 | 8.45 → 8.05 |

Both auditors missed real defects: Sol three (one on Terra, two on Gemini),
the blind Opus audit three (one on Terra, two on Opus xhigh). Opus also
reported two behaviours the benchmark has not treated as defects. So the main
source of disagreement is recall, and a single audit tends to overstate
correctness by roughly 0.5–1.0 on some runs.

The scores in `ranking.json` are unchanged. Applying the missed findings only
to the sampled runs would penalise them relative to runs that were audited
once and never re-checked.

### Limits

Three runs is a very small sample. The blind auditor had two calibration
audits; Sol had the full ranking and every earlier audit. Disputed findings
are adjudicated above.

### Next

1. Decide whether adjudicated findings change official scores, and whether
   repeated hard drop on a held key and the spawn row become rules for all runs.
2. Extend to the full eight-run sample (adding Terra low, GPT-5.6 Sol high,
   GLM-5.3-Flash max, MiMo and Sonnet 5.5 medium) with the same blind setup.
