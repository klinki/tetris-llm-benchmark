# Gemini 4 Argon (high): abandoned attempts

Run: `gemini-4-argon-contributor-high`, model
`opencode-go/gemini-4-argon-contributor`, variant `high`, harness
T3 Code / OpenCode. Five attempts were started on 2026-10-24 before the one
that was imported and scored (8.45, [audit](gemini-high-review.md)). None of
them is imported, scored or counted in tokens, cost or time. The user
confirmed on 2026-10-26 that the re-run counts as the result.

| Workspace key | Created (UTC) | T3 thread | Outcome |
|---|---|---|---|
| `9a18e8aee3eb` | 00:22:27 | not recorded | Launch failed before any model call |
| `1c2d162ef0fe` | 00:22:53 | not recorded | Launch failed before any model call |
| `cb4ceeecfabb` | 00:23:07 | `thread:project:fe855cc5-…:eab00d47-…` | Launch failed before any model call |
| `7802fb5c2f32` | 00:23:44 | not recorded | Launch failed before any model call |
| `abddd2cf651e` | 00:25:43 | `mcp:d0f4d270-f65d-4b0a-8827-cd2b60b1a914` | Agent killed its own harness after 8m 31.5s |
| `581246898fc4` | — | `mcp:d72913c3-6f3d-480b-9dd5-0eadd0f387a3` | **Imported and scored** |

## Launch failures (four attempts)

These were failures in the benchmark setup, not in the model. The workspace
parent folders were made unlistable so a tested agent could not browse other
runs. OpenCode resolves the real path of every folder above its workspace,
could not do so, and refused the turn. T3 recorded "The provider could not
start this turn" about 60 ms after the run started (00:23:08.315 →
00:23:08.376 for `cb4ceeecfabb`). No prompt reached the model, no tokens were
used, and no files were written.

Commit `e62f847` fixed this: workspaces now live in a readable `runs/` folder
that holds only the active run, and every other run is moved into an
unlistable archive.

## Interrupted attempt (`abddd2cf651e`)

Started 00:25:48 UTC and interrupted at 00:34:20 UTC (8m 31.5s), using
682,107 partial tokens. The prompt was the standard "Read the README.md file
and implement it".

Up to that point the attempt went normally. The agent:

1. read the README, checked `node -v` / `npm -v`, and wrote `package.json`,
   `tsconfig.json`, `scripts/server.mjs` (default port 8321), `src/types.ts`,
   `src/tetromino.ts`, `src/randomizer.ts`, `src/game.ts`, `src/renderer.ts`,
   `src/main.ts`, `index.html`, `styles.css` and `src/test.ts`;
2. ran `npm install && npm test`, fixed a line-clear test fixture, and reran
   `npm test`, which passed;
3. started `npm start` as an OpenCode background shell, opened
   `http://localhost:8321` with OpenCode's browser tool to press keys, then
   fetched `/`, `/styles.css`, `/dist/main.js` and `/dist/game.js` from
   inside OpenCode's `execute` tool to check that the server responded;
4. ran `lsof -ti:8321 | xargs kill -9 2>/dev/null || true` to free the port.

`lsof -ti:8321` lists every process with a socket on port 8321, including
clients as well as the listening server. At that moment the OpenCode server
itself held client connections to 8321 from its browser and `fetch` calls, so
its PID was in the list and `kill -9` ended it along with the game server. The
turn lost its harness mid-command, and T3 marked the run interrupted. The
agent had no way to continue or report.

The attempt was set aside rather than resumed: continuing it would have
needed a second user message, which the single-prompt protocol does not allow.
Its workspace was archived, and the next attempt started in a fresh, randomly
named workspace with the same prompt.

### Why the result still counts

- The failure was a self-inflicted harness crash caused by a common shell
  idiom, not a quality signal for a completed game. The benchmark scores
  delivered implementations, and this attempt delivered nothing.
- The imported attempt ran from scratch in a new randomly named workspace and
  could not see the earlier one. Its isolation scan found no outside access,
  no T3 tool calls and no benchmark lookups.
- Its reported tokens (1,125,477) and time (13m 9.707s) cover only the
  imported attempt. Including the wasted attempt would add about 682k tokens
  and 8.5 minutes. Readers comparing efficiency should keep that in mind.

### Lessons applied

- `preflight` now stops anything listening on a game port or running from a
  benchmark folder before each run, so agents are less likely to find 8321
  occupied and reach for `kill`.
- `discard KEY --reason "..."` now records why an attempt was set aside, in
  `.bench/abandoned/`.
