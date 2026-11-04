# TODO

## Make audit findings consistent across all runs

The blind auditor-agreement check
([`.audit/auditor-agreement.md`](.audit/auditor-agreement.md)) found that
correctness findings are not applied evenly: Sol misses T-spin credit kept
through a hard drop that travels, the blind Opus audit missed seven lock and
gravity timing defects, and three rule questions have been judged
differently from run to run. The November 4 [hard-drop consistency amendment](.audit/hard-drop-rule-review.md)
applies the adopted spin-credit ruling to confirmed cases; the remaining
findings and unsampled implementations still need the broader census.

- [ ] **Decide the open rules** (each would be a minor correctness
      defect):
  - [ ] Gravity floor: falling capped at about one row per frame from
        level 14 (four of the eight sampled runs do this).
  - [ ] Spawn position and visibility: must new pieces appear just above
        the field and be visible at once? GPT-5.6 Sol high's pieces stay
        hidden for about 1 s at level 1.
  - [ ] Held Space: should holding Space keep hard-dropping new pieces?
  - [x] Hard-drop spin credit: adopted the earlier ruling as
        [HD-SPIN-1](.audit/SPEC.md). Positive travel cancels credit;
        zero-distance locking preserves it. Confirmed cases reconciled;
        gravity-only behavior remains unruled.
- [ ] **Probe every run the same way**, then apply deductions to all runs at
      once: T-spin credit after a travelling hard drop, partial locks above
      the field, and any rule adopted above. The confirmed Terra spin-history
      findings are now applied, including ultra; Gemini 4 Argon's separate partial-lock correction (8.45 → 8.25)
      and other untested historical runs remain pending. Do not infer that
      untested runs conform to HD-SPIN-1.
- [ ] **Optional: checklists for the judgement criteria** (tests, code,
      simplicity, UX), which cause most of the 0.78 mean gap between
      auditors.
