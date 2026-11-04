# Hard-drop spin-credit consistency amendment

Adopted **2026-11-04** by the benchmark owner. This is a rule reconciliation
and focused regression pass, not a new independent quality review. The earlier
[auditor-agreement ruling](auditor-agreement.md) is now explicit in
[HD-SPIN-1](SPEC.md): positive hard-drop travel cancels rotation credit;
zero-distance hard drop preserves it. Automatic gravity remains unruled.
No delivered implementation, original prompt, usage, price or effort changed.

## Confirmed outcomes and score effects

Every travel fixture starts from the same stack `(0,17),(0,19),(2,19)` and
T r0 at `(0,3)`, uses an actual CW rotation, and hard-drops fourteen rows.
Expected score delta: **28**, not 128/428. Existing real-rotation zero-travel
full/mini controls and timed locks guard against removing all spin scoring.

| Implementation | Observed travel score | Rule outcome | Weighted before → after |
|---|---:|---|---|
| GLM-5.3 low | 28 | Conforming; manual-soft/fourth-kick defects retain grouped minor | 7.80 → 7.80 |
| GLM-5.3 high | 128 | Stale credit; joins existing manual-soft spin-history minor | 6.90 → 6.90 |
| GLM-5.3 max | 28 | Conforming; withdraw the isolated spin-loss minor | 8.20 → 8.40 |
| Qwen3.8 Max xhigh | 28 | Conforming travel; missing zero-travel spins/PC/B2B retain major | 8.00 → 8.00 |
| GPT-6.1 Sol max | 28 | Conforming; retain prior interpretation | 8.95 → 8.95 |
| GPT-6.1 Terra low | 428 | Stale full credit; mini/PC/stale-spin errors become one major | 7.30 → 7.10 |
| GPT-6.1 Terra medium | 128 | Stale credit; joins existing manual-soft spin-history minor | 6.90 → 6.90 |
| GPT-6.1 Terra high | 28 | Conforming | 7.90 → 7.90 |
| GPT-6.1 Terra xhigh | 128 | Stale credit; joins existing manual-soft spin-history minor | 8.25 → 8.25 |
| GPT-6.1 Terra max | 128 | Add isolated stale-credit minor | 8.85 → 8.65 |
| GPT-6.1 Terra ultra | 128 | Add isolated stale-credit minor | 8.65 → 8.45 |

The eleven implementations were checked in Node and served Chromium at
1280×800 and 390×844. Terra's six-effort runner now records actual score,
expected score and conformance separately, with explicit assertions for all
six recorded outcomes. GLM and Sol max runners do the same. A successful
regression runner asserts known failures as well as conforming behavior;
it does not certify every implementation as correct. Qwen's existing
absent-spin major is supported by zero-travel/timed full/mini fixtures, so
removing the incorrect travelling-drop expectation does not erase that major.

Only four weighted scores change. Correctness changes, respectively:
GLM max 8→8.5; Terra low 8→7.5; Terra max 9→8.5; Terra ultra 9.5→9.
Other criteria stay unchanged. Related scoring defects are grouped using the
existing calibration; soft/hard stale-credit manifestations do not stack.

## Reproduction

Run from the repository root:

```sh
python3 .audit/run-gpt61-terra-audit.py --offline
python3 .audit/run-glm53-audit.py --offline
python3 .audit/run-glm53-max-audit.py --offline
python3 .audit/run-gpt61-sol-max-audit.py --offline
python3 .audit/run-qwen38-max-xhigh-audit.py --offline
python3 scripts/benchmark.py render
python3 scripts/benchmark.py verify
node .audit/verify-ranking.mjs
```

Each runner uses a disposable copy, locked dependencies, explicit build and
unchanged own tests. The full engine suite and both browser sizes repeat the
findings. Existing documented temporary server-port adaptations remain;
no game rule is patched. Runners clean copies, logs, screenshots and owned
server/browser processes on exit. The amended audits preserve the original
source/test/visual evidence and mark original scores/ranks as historical;
`ranking.json` and the regenerated current tables are authoritative.

## Scope and remaining work

This pass reconciles the recorded conflict and the six Terra implementations
with the same fixture. It does **not** assert that all 80 historical runs
have been freshly tested for HD-SPIN-1. The other 69 retain their prior
coverage; the broader census remains explicit in [`TODO.md`](../TODO.md).
Missing zero-travel spin recognition, zero-distance hard-drop cancellation,
and stale manual-soft credit remain valid defects. Gravity-only spin credit,
fast-gravity floors, spawn visibility, held Space and unrelated partial-lock
findings are outside this change. No unrelated deduction is introduced.

## Validation record — November 4

The five full cohort runners above completed successfully: eleven delivered
implementations, their unchanged own suites, independent engine fixtures and
both Chromium viewports. All 70 repository unit tests pass. Report verification
and the ranking validator pass (80 score rows, their deductions/order, tables
and 507 local links in eight documents). Exactly four correctness scores
change; all other criteria, all implementation sources, registry identities,
usage and pricing remain unchanged. The full site build and all **146 site checks** pass, including the three
expected historical game failures. Disposable copies, screenshots, logs and
owned browser/server groups were cleaned up.
