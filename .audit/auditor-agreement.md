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

### Limits

Three runs is a very small sample. The blind auditor had two calibration
audits; Sol had the full ranking and every earlier audit. Disputed findings
have not yet been adjudicated, so neither auditor's version is treated as
correct here.

### Next

1. Adjudicate the disputed findings by reproduction: Opus's three extra
   Gemini findings and its Terra T-spin finding, and Sol's two Opus xhigh
   timing findings that the blind audit missed.
2. Extend to the full eight-run sample (adding Terra low, GPT-5.6 Sol high,
   GLM-5.3-Flash max, MiMo and Sonnet 5.5 medium) with the same blind setup.
