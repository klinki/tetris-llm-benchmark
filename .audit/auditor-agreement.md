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
| Gemini Argon | 10 ms gravity floor at levels 15+ (Opus) | **Rule question, not deducted** (revised in round 2) | `getGravityIntervalMs` returns `Math.max(10, …)`; its own Guideline formula gives about 7.1 ms at level 15 and 0.45 ms at level 20. Round 2 found a similar floor in three more runs, and no audit has ever deducted one, so it is treated as a rule to decide for all runs. |
| Gemini Argon | Held keys auto-repeat hard drop and rotation (Opus) | **Rule question, not deducted** | Native key repeat is noted as UX context in many audits (including Sol's Gemini audit) and has never been deducted. Repeated hard drop on a held Space is arguably different and should be ruled on for all runs at once, not for one. |

**Correctness if every valid finding were applied** (each −0.5):

| Run | Sol | Opus (blind) | Adjudicated | Weighted (Sol's other criteria) |
|---|---:|---:|---:|---:|
| GPT-6.1 Terra (max) | 9.0 | 9.0 | 8.5 | 8.85 → 8.65 |
| Claude Opus 5.5 (xhigh) | 8.0 | 9.0 | 8.0 | 8.30 (unchanged) |
| Gemini 4 Argon (high) | 9.0 | 7.5 | 8.5 | 8.45 → 8.25 |

## Round 2 (remaining five runs) — 2026-10-27

Same blind setup and auditor (Claude Opus 5.5, high). The calibration audits
were [Luna PI](luna-pi-review.md) and the [October audit](october-review.md),
because the GLM and MiMo audits cover sample runs. One clause in the rubric
text that named a GLM test failure was removed from the blind copy. The
unedited report, scores and probes are in
[`auditor-agreement/`](auditor-agreement/opus-blind-round-2-report.md).

| Group | Run | Sol | Opus (blind) | Weighted Sol → Opus | Opus − Sol |
|---|---|---|---|---:|---:|
| Neither | GLM-5.3-Flash (max) | 8 / 7.5 / 9 / 8 / 9 | 8 / 7 / 8.5 / 7 / 8 | 8.20 → 7.80 | −0.40 |
| Anthropic | Claude Sonnet 5.5 (medium) | 8.5 / 7.5 / 9 / 8.5 / 8 | 9 / 5.5 / 8 / 9 / 6 | 8.35 → 7.80 | −0.55 |
| OpenAI | GPT-6.1 Terra (low) | 8 / 5 / 7 / 9 / 8 | 7.5 / 2 / 3 / 5 / 8 | 7.30 → 5.30 | −2.00 |
| Neither | MiMo-V2.6-Flash | 7 / 7.5 / 9 / 8.5 / 8.5 | 7.5 / 7.5 / 8.5 / 7 / 7 | 7.80 → 7.60 | −0.20 |
| OpenAI | GPT-5.6 Sol (high) | 8 / 6 / 9 / 8.5 / 9 | 7 / 3.5 / 7.5 / 7 / 8.5 | 7.95 → 6.55 | −1.40 |

### Adjudication

| Run | Finding (reported by) | Verdict | Evidence |
|---|---|---|---|
| GLM max | — | Both auditors report the same two findings | Correctness agrees (8.0). |
| Sonnet medium | Starting soft drop reuses accumulated normal-gravity time (Sol) | **Valid minor**; missed by Opus | Reproduced by Sol's runner; the same minor is deducted for several runs (e.g. Qwen3.8 Flash medium/xhigh, Opus 5.5 medium). |
| Terra low | T-spin credited after an air rotation and a long hard drop (Opus) | **Valid**, joins the scoring group | `hardDrop()` never clears `lastRotation`; only `move()` (including soft drop) does, the same pattern as Terra max. With mini-as-full and the missing perfect-clear bonus this makes three related scoring defects, which earlier audits group as one major (e.g. GPT-5.6 Terra xhigh, DeepSeek V4.1 Flash low). |
| Terra low | Landing frames charge pre-contact time to lock delay (Sol) | **Valid minor**; missed by Opus | Reproduced by Sol's runner. |
| Terra low, MiMo, GPT-5.6 Sol high | Gravity floor of about one row per frame from level 14 (Opus) | **Rule question, not deducted** | `Math.max(16, …)` (Terra low), `1 / 60` (MiMo) and `Math.max(16.67, …)` (Sol high) are confirmed in the source; see the Gemini ruling above. |
| MiMo | Entering soft drop consumes old normal time; combo and B2B values lie below the canvas backing (Sol) | **Valid minors**; missed by Opus | Reproduced by Sol's runner. Opus's extra "air rotation plus hard drop counts as a spin" falls inside MiMo's existing grouped scoring major and changes nothing. |
| GPT-5.6 Sol high | New pieces spawn wholly inside the hidden rows and stay invisible for about 1 s at level 1 (Opus) | **Rule question, not deducted** | `spawn()` places pieces at board rows 2–3 of 4 hidden rows with no immediate one-row drop. Sol's own fixtures start from this hidden spawn without deducting it, and no audit has ruled on spawn position (see Gemini's spawn row above). |

**Correctness after adjudication:** GLM max 8.0, Sonnet medium 8.5, MiMo
7.0 and GPT-5.6 Sol high 8.0 equal Sol's scores. GPT-6.1 Terra low falls from
8.0 to 7.5 (scoring group becomes one major; 7.30 → 7.10 with Sol's other
criteria).

## Summary of all eight runs

| | Value |
|---|---:|
| Mean absolute weighted difference (Opus − Sol) | 0.78 |
| Mean signed weighted difference | −0.69 |
| OpenAI runs, mean signed difference (3) | −1.17 |
| Anthropic runs, mean signed difference (2) | −0.10 |
| Neutral runs, mean signed difference (3) | −0.62 |

**Correctness: Sol is the more reliable auditor.** After adjudication, Sol's
correctness score was right on 5 of 8 runs and 0.5 too high on 3 (Terra max,
Terra low, Gemini Argon). The blind Opus audit missed seven real defects
Sol found, mostly lock and gravity timing that Sol's runners probe
systematically.

**Sol's misses look like a shared blind spot.** Two of its three misses are
the same bug in two GPT-6.1 Terra runs: T-spin credit kept through a hard
drop that travels. Sol's own family writes this pattern and Sol's probes test
only zero-travel hard drops. It is now in the standard probe list for new
audits (first used for Qwen3.8 Max xhigh).

**Most of the weighted gap is judgement, not defects.** The blind Opus audit
scored tests, code, simplicity and UX lower on almost every run, by up to
four points (Terra low code 7 → 3, simplicity 9 → 5; its game logic is
written as dense one-line methods). These criteria have no fixed deductions,
so two careful auditors can differ by 1.0–2.0 weighted points on the same
code.

**Family bias is not established.** Against the neutral runs, the blind
audit was about 0.55 harsher on OpenAI runs and about 0.5 kinder to Anthropic
runs, but with three, two and three runs and one large outlier (Terra low's
code score) this is within noise. Opus did not know which runs were which.

### Limits

Eight runs, one second auditor, and calibration context that differed
(the blind auditor had two earlier audits, Sol had the full ranking). The
gravity-floor, spawn-position and held-key questions are open rules, not
findings. No score in `ranking.json` or `RANKING.md` was changed.

### Next

1. Decide the three open rules for all runs: gravity floor near one row per
   frame at high levels, spawn position and visibility, and repeated hard
   drop on a held key.
2. Apply findings fairly: run the probes that exposed misses (T-spin credit
   after a travelling hard drop, partial locks above the field, plus any rule
   adopted in step 1) across every run, then deduct uniformly.
3. Consider anchoring the judgement criteria (tests, code, simplicity, UX)
   with explicit checklists, since they cause most of the disagreement.
