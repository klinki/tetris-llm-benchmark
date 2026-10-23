# October T3 Code/OpenCode implementation audit

Audit date: 2026-10-20. Scope: Beam, Cat-jam, Gemini-4, Nemotron, and
Space-bunny. The six earlier implementations retain their existing scores.
The result is integrated into [`RANKING.md`](../RANKING.md).

## Imported source and reproducibility

The five completed directories were copied from
`/Users/david/projects/own/tetris/` into directories of the same names in this
repository. Source files, tests, lockfiles, README files, and assets were
preserved, with trailing spaces removed on six lines (five README headings and
one Beam comment), plus a final newline in that Beam source file. All other bytes match the originals. `.git`, `node_modules`,
`dist`, `dist-test`, and `.DS_Store` were omitted. The README-only `step-5`
directory was not imported. The audit did not repair any implementation.

Builds and tests ran in fresh temporary copies with `npm ci --ignore-scripts`
and each project's declared `npm test`. All five passed. The additional
Nemotron engine probes compile to temporary CommonJS output because Node's
ability to run its source through `tsx` does not prove its emitted browser
imports work. This compile is separate from the unchanged browser build.

```sh
python3 .audit/run-october-audit.py --offline
# Omit --offline when the locked dependencies are not already cached.
```

The runner builds/tests in isolated copies and executes
[`october-audit.mjs`](october-audit.mjs). Its assertions intentionally describe
the observed defects, so changed implementation behavior requires a review of
the evidence and scores. A passing audit script means the documented findings
were reproduced, not that all games are correct.

## Scoring profile and rule references

The original benchmark rubric and deductions remain in use. A missing scoring
system is one major deduction; related missing or incorrect subfeatures are
listed together rather than charged repeatedly. A narrow scoring fidelity
gap receives a minor deduction. Perfect-clear bonuses retain the original
benchmark convention and are not presented as universal across licensed games.

Normal line/drop scoring, preservation of B2B through no-clear placements,
T-spin recognition, and rotation behavior were cross-checked against Blue
Planet Software's 2009 *Tetris Design Guideline*, chapters 5, 8, 9, and appendix
A ([primary document transcription](https://studylib.net/doc/27262492/2009-tetris-design-guideline)).
The coordinate reference is the same canonical SRS data used by the earlier
audit. A fixed origin translation is allowed for a differently represented
piece (such as a 2×2 O); rotations are not independently shifted to conceal
incorrect pivots or orientation tables.

## Build/test comparison

| Run | Install/build/tests | Existing suite | Main coverage and limitations |
|---|---|---|---|
| Beam | Pass | 5 tests | Dimensions, initial spawn/queue, one bag, generic matrix rotation, full-row clear; little gameplay coverage |
| Cat-jam | Pass | 16 cases | Deterministic game transitions, ghost, hold, top-out/restart, scoring helpers and 5,000-frame simulation; misses canonical geometry and timing |
| Gemini-4 | Pass | 7 function groups | Exact drop scoring, ghost/hard-drop agreement, actual T wall kick, hold, Tetris, lock-delay boundary and blocked spawn; misses advanced scoring integration |
| Nemotron | Pass | Uncounted assertion script | Board operations, movement, rotation, hard drop, hold, restart; `tsx` masks browser module resolution failure |
| Space-bunny | Pass | 479 checks | Broad seeded engine and scoring integration, reset limits, bot play; some rule oracles assert incorrect behavior |

Raw printed counts are different units and are not a quality metric by
themselves. Space-bunny's large suite deliberately expects mirrored reverse
CCW tables, a mini classification for a full-spin corner case, and a broken
B2B chain after a no-clear lock. Those are false oracles, not independent
confirmation of the rules.

## Engine findings

Common probes exercise all 28 orientations and basic movement, hard drop,
hold restrictions, blocked spawn, and restart/reset for each engine. Targeted
probes then reproduce the findings below. Public state and compiled private
methods are used only as setup/observation adapters; implementation code is
not altered.

| ID | Run | Severity | Expected behavior | Observed evidence/reproduction |
|---|---|---|---|---|
| B1 | Beam | Major | Grounded moves restart a usable 500 ms lock timer | `resetLockDelay` uses Unix `Date.now()` while `updateLockDelay` receives animation time. Ground O at y=20, start timer at 1,000 ms, move right, then advance to 10,000 ms: zero cells lock |
| B2 | Beam | Major, grouped scoring | Modern normal/drop and advanced scoring profile | Single/Tetris table is 40/1200 at the initial multiplier, soft drop returns 1 but never updates score, and spin/B2B/combo/perfect-clear state is absent |
| B3 | Beam | Minor | Supporting state remains visible at 390 px | Document width 467 px; hold canvas x≈−77 |
| B4 | Beam | Minor | No extraneous generated text | `EOF` after the closing HTML renders as an extra desktop flex item |
| C1 | Cat-jam | Major | L remains an L through four SRS states | The exact coordinate probe finds `L2`; that state has the J-shaped pattern |
| C2 | Cat-jam | Major, grouped scoring | Spins/B2B/perfect clears score under the profile | Scoring contains only normal clears and combos; zero-distance single-line perfect clear scores 100, not 900 |
| C3 | Cat-jam | Minor | Layout fits 390 px | Document width 538 px; side panels extend beyond the right edge |
| G1 | Gemini-4 | Minor | Single-line perfect clear adds the profile's 800 bonus | Zero-distance horizontal I clears the only occupied row; empty board results but score is only 100 |
| G2 | Gemini-4 | Minor | Hold, next and board are available at 390 px | Document width 570 px; hold x=−150, next x=415 |
| N1 | Nemotron | Critical | Emitted modules resolve in declared static server | `dist/main.js` imports `./game` and `./render`; browser requests return 404 and no game or controls initialize |
| N2 | Nemotron | Major | Canonical orientation and I-specific kick data | After one fixed origin correction per piece, mismatches are `I1,I3,J0,J1,J2,J3,L0,L1,L2,L3,T0,T2`; I kicks use non-I-style offsets |
| N3 | Nemotron | Major, grouped scoring | Normal/drop and advanced scoring profile | A zero-distance single awards 40; no advanced scoring exists; four 16 ms soft-drop frames move one row but award zero |
| N4 | Nemotron | Minor | Grounded delay is 500 ms with a finite reset cap | Ground O at y=18. `step(499); step(2)` leaves it unlocked; the next 315 ms triggers an 816 ms failed gravity tick and lock. Successful moves reset without a cap |
| N5 | Nemotron | Minor | Board fits 390 px | Board x=−22 and document width 412 px; body uses hidden overflow |
| S1 | Space-bunny | Major, grouped SRS | Correct states and screen-coordinate CCW kicks | Mismatches `L2,L3,T1,T2,T3`; `L2` is T-shaped. T transition 1→0 yields Y offsets −1/+2 where canonical screen offsets are +1/−2 |
| S2 | Space-bunny | Major | Ghost has the four landing cells | `ghostCells` omits each local Y offset: an O ghost has two distinct coordinates, all on one row; renderer uses this output |
| S3 | Space-bunny | Major, grouped scoring | Independent spin, B2B, combo and drop behavior | Reference full-spin corners classify as mini; fifth-kick helper accepts an empty field; ordinary no-clear lock breaks B2B; level-two combo is 400 instead of 300; three held-soft-drop rows award 1 instead of 3 |

One major deduction groups the scoring subdefects for each affected run, and
one groups all SRS subdefects. Ghost corruption is a separate required feature.
These findings receive no additional numerical penalty in the other score
categories. Only the five newly imported implementations were re-audited.

## Browser evidence

Browser: installed Chromium 156.0.8078.4, driven through the Playwright CLI.
Viewport sizes: 1280×800 and 390×844. Each fresh build used its supplied server
implementation or the same static server specified by its start command; only
ports were changed where supported to run concurrently.

| Run | Server used | Application load | Desktop board size | 390 px document width | Keyboard flow |
|---|---|---|---|---:|---|
| Beam | `npm start`, port 8321 | Pass | 204×404 including border | 467 | Movement, CW/CCW, soft/hard drop, hold respond |
| Cat-jam | `PORT=18322 npm start` | Pass | 302×602 including border | 538 | Same flow responds |
| Gemini-4 | Declared Python static server, port 18323 | Pass | 322×642 including border | 570 | Same flow responds |
| Nemotron | Declared `http-server`, port 18324 | Fail: two required module 404s | 240×480 static canvas | 412 | No working game; keys leave score at zero |
| Space-bunny | `PORT=18325 npm run serve` after build | Pass | 678×762 full game canvas | 390 | Same flow responds; full state is drawn inside the canvas |

The keyboard sequence was `ArrowLeft, ArrowRight, ArrowUp, X, Z, ControlLeft,
ArrowDown, Space, C`. The four working games had no application asset failures
or page exceptions during this flow. Missing favicon requests on other games
were ignored as in the earlier audit. Nemotron's failures are application
module loads, not favicon requests.

[`october-browser.cjs`](october-browser.cjs) is the reusable Playwright CLI
`run-code` snippet. After navigating to a supplied URL and capturing a fresh
snapshot, it reloads, measures the layout, exercises controls and saves
screenshots. Read its result with `eval '() => window.__tetrisAudit'`.

```sh
# Start one isolated build's server first. Use a temporary working directory
# or output/playwright/october for transient browser artifacts.
playwright_cli=/absolute/path/to/skills/playwright/scripts/playwright_cli.sh
"$playwright_cli" --session tetris-review open http://127.0.0.1:8321
"$playwright_cli" --session tetris-review snapshot --boxes
"$playwright_cli" --session tetris-review run-code "$(cat /absolute/path/to/.audit/october-browser.cjs)"
"$playwright_cli" --session tetris-review eval '() => window.__tetrisAudit'
"$playwright_cli" --session tetris-review close
```

Desktop and mobile screenshots were inspected for all five games. They are
temporary artifacts rather than committed images of random falling pieces.
The responsive Space-bunny canvas keeps all panels visible but scales the
playfield and stats quite small on a phone; none of the new games provides
touch controls. Nemotron's UX score assesses static desktop presentation only;
its live gameplay is unavailable, not silently passed.

## Sessions and non-scoring usage context

Source: read-only `/Users/david/.t3/userdata/statev2.sqlite`. Each row joins
its exact project path to a T3 thread, native OpenCode session reference, and
completed provider turn. All five have one user message, `usageScope` equal
to `main_agent`, `usageStatus` equal to `complete`, and `hasSubagents=false`.
The prompt is `Read the README.md file and implement it`.

| Directory | T3 thread ID | Native OpenCode session ID | Configured model alias | Recorded reasoning variant |
|---|---|---|---|---|
| beam | `ccd1f409-32b9-4084-a132-64fd37e1ef1c` | `ses_eb90d6bacffeRMha5Jrs2NSqnv` | `opencode-go/beam-free` | `xhigh` |
| cat-jam | `6a787f63-97b4-4a31-b22a-412cad6d4e02` | `ses_eb90cdccfffefsOuOzMDaDKP26` | `opencode-go/longcat-2.5-preview-free` | `default` |
| gemini-4 | `21851234-b5df-4c93-9255-ec9ea5ccf684` | `ses_eb90c4585ffe2x3cw2Q8SJRhhu` | `opencode-go/gemini-4-argon-contributor` | `medium` |
| nemotron | `5ef0b18d-70fe-4873-a385-639aa2441f36` | `ses_eb90ac243ffepFgepUhU9ONqfk` | `openrouter/nvidia/nemotron-3.5-super-vl:free` | `thinking` |
| space-bunny | `aa95f286-fe37-40ff-bba7-acde75779f28` | `ses_eb90ba7cbfferS9hPJdJ5WblRP` | `opencode-go/space-bunny` | `xhigh` |

Reasoning variants come from the provider thread's
`nativeMetadata.modelSelection.options` entry with `id="variant"`, not the
current application default. The provider record explicitly stores Cat-jam's
`default` value even though its top-level T3 thread selection omits the option.
These labels document configuration, not verified effective backend budgets;
they are not a common effort scale across models. `default` does not imply
reasoning is off. Reasoning-token counts remain a separate usage measurement.

Names are recorded aliases, not an independent identification of underlying
models. Use `turnTokenUsage`, not the latest-request `tokenUsage`. T3's installed
OpenCode adapter accumulates input with cache reads/writes included, and output
with reasoning included. Normalize as:

```text
Input = turn.inputTokens - turn.cachedInputTokens - turn.cacheCreationTokens
Cache Read = turn.cachedInputTokens
Cache Write = turn.cacheCreationTokens
Output = turn.outputTokens  (already includes turn.reasoningTokens)
Total = turn.inputTokens + turn.outputTokens
```

| Run | Input | Cache Read | Cache Write | Output | Total |
|---|---:|---:|---:|---:|---:|
| Beam | 59,252 | 1,256,128 | 0 | 19,508 | 1,334,888 |
| Cat-jam | 90,366 | 1,914,368 | 0 | 65,706 | 2,070,440 |
| Gemini-4 | 69,220 | 494,761 | 0 | 26,222 | 590,203 |
| Nemotron | 139,340 | 1,669,360 | 0 | 43,016 | 1,851,716 |
| Space-bunny | 209,899 | 21,184,322 | 0 | 153,370 | 21,547,591 |

Timing starts at the stored user-message `created_at`, ending at the completed
provider turn. This excludes project/session creation and UI settlement time.

| Run | First user message (UTC) | Completed response (UTC) | Elapsed |
|---|---|---|---|
| Beam | 2026-10-16T23:01:05.169Z | 2026-10-16T23:04:08.598Z | 3m 3.429s |
| Cat-jam | 2026-10-16T23:01:41.761Z | 2026-10-16T23:25:24.185Z | 23m 42.424s |
| Gemini-4 | 2026-10-16T23:02:20.493Z | 2026-10-16T23:08:57.355Z | 6m 36.862s |
| Nemotron | 2026-10-16T23:03:59.646Z | 2026-10-16T23:13:08.419Z | 9m 8.773s |
| Space-bunny | 2026-10-16T23:03:00.884Z | 2026-10-16T23:16:20.317Z | 13m 19.433s |

These main-agent totals do not establish that title-generation or other harness
overhead was zero. Cost, overhead, and normalized tool-call counts are not yet
verified for this cohort, so combined usage is not claimed. The root generated
statistics workflow now includes these five T3 Code/OpenCode runs alongside
the six earlier runs. Each has a generated `STATISTICS.md`, and the README
results block displays the verified agent total with `Not verified` overhead
and combined totals. `T3_HOME` selects the T3 data directory; the collector
requires the exact registry thread/session IDs and reasoning variant.

Read-only reproduction query (replace the database path if necessary):

```sh
sqlite3 -readonly -header -column /path/to/.t3/userdata/statev2.sqlite "
SELECT
  p.workspace_root,
  t.thread_id,
  json_extract(pt.payload_json, '$.nativeThreadRef.nativeId') AS opencode_session,
  (SELECT json_extract(model_option.value, '$.value')
   FROM json_each(pt.payload_json, '$.nativeMetadata.modelSelection.options') model_option
   WHERE json_extract(model_option.value, '$.id') = 'variant') AS reasoning_variant,
  m.created_at AS first_user_message,
  u.completed_at,
  json_extract(u.payload_json, '$.turnTokenUsage') AS turn_usage
FROM orchestration_v2_projection_threads t
JOIN projection_projects p ON p.project_id = t.project_id
JOIN orchestration_v2_projection_provider_threads pt ON pt.thread_id = t.thread_id
JOIN orchestration_v2_projection_provider_turns u ON u.thread_id = t.thread_id
JOIN orchestration_v2_projection_messages m ON m.thread_id = t.thread_id
WHERE m.role = 'user'
  AND t.thread_id IN (
    'ccd1f409-32b9-4084-a132-64fd37e1ef1c',
    '6a787f63-97b4-4a31-b22a-412cad6d4e02',
    '21851234-b5df-4c93-9255-ec9ea5ccf684',
    '5ef0b18d-70fe-4873-a385-639aa2441f36',
    'aa95f286-fe37-40ff-bba7-acde75779f28'
  )
ORDER BY m.created_at;
"
```

## Limitations

This is a focused audit, not an exhaustive game-state proof. Canonical geometry
and the listed defects have repeatable probes; other features use existing
tests plus source/browser review. Browser testing used Chromium only, keyboard
input, and the two specified viewports. No physical touch device or long human
playtest was used. The imported source remains exactly as delivered, including
the confirmed defects.
