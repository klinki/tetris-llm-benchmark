# TODO

## Make audit findings consistent across all runs

The blind auditor-agreement check
([`.audit/auditor-agreement.md`](.audit/auditor-agreement.md)) found that
correctness findings are not applied evenly: Sol misses T-spin credit kept
through a hard drop that travels, the blind Opus audit missed seven lock and
gravity timing defects, and three rule questions have been judged
differently from run to run. No score has been changed yet.

- [ ] **Decide three open rules** (each would be a minor correctness
      defect):
  - [ ] Gravity floor: falling capped at about one row per frame from
        level 14 (four of the eight sampled runs do this).
  - [ ] Spawn position and visibility: must new pieces appear just above
        the field and be visible at once? GPT-5.6 Sol high's pieces stay
        hidden for about 1 s at level 1.
  - [ ] Held Space: should holding Space keep hard-dropping new pieces?
- [ ] **Probe every run the same way**, then apply deductions to all runs at
      once: T-spin credit after a travelling hard drop, partial locks above
      the field, and any rule adopted above. Among the sampled runs only
      GPT-6.1 Terra max (8.85 → 8.65), Terra low (7.30 → 7.10) and Gemini 4
      Argon (8.45 → 8.25) are known to change; unsampled runs probably have
      the same misses.
- [ ] **Optional: checklists for the judgement criteria** (tests, code,
      simplicity, UX), which cause most of the 0.78 mean gap between
      auditors.
