# Reviewer brief template

The orchestrator fills in this brief and passes it as the whole task to the
required independent reviewer: GPT-6.1 Sol (`gpt-6.1-sol`) at `xhigh`, through
`delegate_task` with `providerInstanceId: codex` and
`options: [{id: reasoningEffort, value: xhigh}]` (see
[AGENTS.md](../AGENTS.md#required-independent-reviewer)). Replace each
`<…>` and delete the notes in brackets. One review can cover two runs of the
same model. That costs about the same quota as one run (12–13 points of the
5-hour window instead of 9–10), so pair efforts when both are ready.

After the review finishes, record it with:

```sh
python3 scripts/benchmark.py audit-record .audit/<slug>-review.md <run ids…> --session <reviewer native session>
```

Then run `verify`, `site` and `npm run -s check:site`, commit, and settle the
review thread.

---

You are the independent final quality auditor for <one benchmark run | two benchmark runs> in the repository /Users/david/projects/own/tetris-llm-benchmark (a Tetris LLM benchmark). Do the audit yourself; do not delegate.

RUNS UNDER REVIEW (review in this order)
1. <run-id>/ — <Model label>, reasoning effort <effort>, T3 Code / <harness>. ~<lines> lines across src/tests/scripts; server <server file>. <Anything unusual: web_root, extra assets, agent clutter such as output/playwright/ (judge only whether it matters for code quality; it is not part of the game).>
Registry ids <`run-id`, …> in benchmark-runs.json. The task the models received is TETRIS.md.

CALIBRATION REFERENCES: <earlier audits of the same model, with scores and their recurring findings>. Reuse their probes (<.audit/…-audit.mjs, …-browser.cjs, run-…-audit.py>) as a starting point, and calibrate against <closest other audits> and other .audit/*-review.md so equivalent defects get equivalent severity.

RUBRIC (RANKING.md "Score calculation" and conformance tables)
- Half-point scores 0–10 for: correctness, own tests, code quality, simplicity, browser UX.
- Weighted = correctness×0.40 + tests×0.20 + code×0.20 + simplicity×0.10 + browser UX×0.10.
- Correctness starts at 10: critical failure (unplayable / does not start) → correctness 0; major −1.5; minor −0.5. Group related defects into one finding as earlier reviews did.
- "Guideline scoring" includes drop points, normal clears, T-spins incl. mini, back-to-back, combos, perfect clears.
- Own-tests score rates only the delivered suite's meaningful coverage; your probes earn no credit.
- Generation effort, elapsed time, tokens, cost and quota have no effect on quality scores. Brevity earns simplicity credit only when readable; code golf hurts code quality. Extra polish (art, sound, fonts) earns UX credit only where it helps play.

METHOD
- Never edit delivered implementations. Work in fresh random temporary copies (npm ci / build / unchanged `npm test`), run engine probes (SRS states and all kicks, bag, hold, ghost, drop points, lock delay/reset cap/retained clocks, soft-drop entry timing, scoring incl. T-spin/mini/B2B/combo/PC, gravity/levels, top-out incl. hidden lock-out, restart) and desktop + 390×844 Chromium checks with the installed Playwright (download nothing new). Inspect screenshots. Assert delivered file hashes are unchanged; leave STATISTICS.md out of the hashes, because the orchestrator regenerates it afterwards to add the review's quota. Use free ports in 41000–49999; clean up every temp copy, server and browser you start (copies in /tmp are not access-locked, so delete them).
- Do not read the tested models' T3 transcripts or other runs' transcripts. Do not read ~/.t3 except your own native session metadata.

DELIVERABLES (repo, existing naming/layout; <slug> is the model and its efforts, e.g. gpt6-astra-medium-high)
1. .audit/<slug>-review.md — header with date/reviewer, scores table, numbered findings per run with severity, exact reproduction and expected vs actual, calibration notes, own-test, code/simplicity/UX rationale, coverage limits.
2. .audit/run-<slug>-audit.py plus its .mjs/.cjs probes, and .audit/<slug>-evidence.json with recorded outcomes and file hashes.
3. In evidence JSON and review header, record your ACTUAL model and effort read from your own native Codex session `turn_context` (your own rollout in ~/.codex/sessions only) and your native session ID.
4. A section for these runs in .audit/README.md in the style of existing sections.
5. ranking.json `entries` for each run in exactly the existing schema: {"run_id":..,"audited":"YYYY-MM-DD","scores":{"correctness":..,"tests":..,"code":..,"simplicity":..,"browser_ux":..},"bugs":[{"severity":..,"title":..,"detail":..}],"summary":".."}. Then run `python3 scripts/benchmark.py render` and `python3 scripts/benchmark.py verify`; both must pass.
Do NOT change benchmark-runs.json, pricing.json, STATISTICS.md, commit, push, open PRs, archive projects, or generate/rerun any model.

FINAL ANSWER: scores and weighted totals per run, findings lists, your verified model/effort and native session ID, files written, verification results.
