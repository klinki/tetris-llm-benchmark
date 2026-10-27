# Pre-isolation runs: isolation review

Review date: **2026-10-27**. Six runs shown on the site predate isolated
workspaces and have no recorded spec hash. Five October T3/OpenCode runs
(`beam`, `cat-jam`, `gemini-4`, `nemotron`, `space-bunny`) ran in parallel
on 2026-10-16 in sibling folders of `/Users/david/projects/own/tetris/`,
next to finished August runs (`luna-codex`, `tetris-sol`, `deepseek-pi`).
`opus-5.5` ran on 2026-10-23 in a folder inside this repository. The
question is whether any of them read other runs' code, tests or results
before implementing, as the original Opus medium run did.

## Method

`python3 scripts/benchmark.py isolation <run>` runs the same scan that
`import` applies to new runs: every tool call in the T3 thread is checked
for paths outside the run's folder, T3 data and lookups of this benchmark.
Each flagged call was then read in full, together with its output, from
the T3 thread record. No implementation or score was changed.

## Results

| Run | Flagged calls | What happened | Conclusion |
|---|---:|---|---|
| Cat-jam | 0 | — | Clean |
| Nemotron | 0 | — | Clean |
| Beam | 1 | `node --version && npm --version && which tsc && ls <parent>`: `which tsc` failed, so the listing never ran. | Clean |
| Space-bunny | 2 | Listed the parent folder once (folder names only); a second attempt failed with "Unknown tool 'shell'". | Clean; saw sibling folder names only |
| Gemini-4 | 8 | Its own folder had **no README.md**. It listed the parent folder, searched it for `**/README.md` (paths only) and read the READMEs of `beam`, `cat-jam`, `nemotron`, `tetris-sol` and `deepseek-pi`. The first four were the unchanged task spec, identical to `TETRIS.md` (all 40 lines, including its Development section). `deepseek-pi`'s was an older 26-line version of the same spec. | Clean; it obtained the task from sibling copies of the prompt and read no code, tests or results |
| Opus 5.5 (medium, original) | 6 | Read the repository README with the results table and other runs' main defects, plus the first 50 lines of Luna PI's README and its `package.json`. | **Exposed**; kept as a reference with a comparison note and re-run in isolation as `claude-opus-5-5-medium` |

Gemini-4's missing README means its prompt file came from a sibling folder
rather than its own; the content was the same task, so the run stays
comparable. The concurrent October runs could have seen each other's work
in progress, but no flagged call read a sibling's source, tests or build
output.

The flagged calls and these conclusions are stored per run in
[`benchmark-runs.json`](../benchmark-runs.json) as `isolation.outside_access`
and `isolation.review`.

## Not covered

`deepseek-pi` (OMP/PI) and the August Codex/OMP/PI runs are not T3 runs, so
this scan does not apply to them. All of them are already excluded from the
site: the August runs as superseded, `deepseek-pi` for needing two user
messages.
