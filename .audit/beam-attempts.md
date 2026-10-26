# Beam (`opencode-go/beam-free`): discarded attempts, October 26, 2026

The user asked for Beam at every effort: low, medium, high, xhigh and max.
Low and medium ran normally. Their isolation checks found nothing outside the
workspace, and both were imported (`beam-free-low`, `beam-free-medium`). The
three attempts below were discarded and are not scored or counted. After the
third, the user stopped the Beam runs, so Beam (max) was never started and
Beam (high) and (xhigh) have no result.

All three attempts followed the same pattern. Beam reasoned that a "grader"
would run hidden tests, then searched the whole disk for them.

| Attempt | Thread | Started (UTC) | What it reached | Result |
|---|---|---|---|---|
| High, 1st (`7b63c1dc1dce`) | `mcp:22ff30b3-5bc2-4dda-8af0-6e4656e633d2` | 08:16 | Stale temporary copy of this repository | Read a copy of `TETRIS.md`, listings, a `package.json`, test file names; no implementation |
| Xhigh (`2b809a1eeebe`) | `mcp:472a6f83-1e30-4ea6-b3c1-7c2167e1fc03` | 08:32 | Old project folder with the October runs | Copied Space-bunny's whole project |
| High, 2nd (`aaaca1efff74`) | `mcp:53c39a00-6bdf-4f80-aa47-c9587aee66d6` | 09:46 | This repository, while it was locked | Undid the lock and copied October's Beam run |

## High, first attempt

After finishing its own game (about 1 minute in), it ran
`find / -iname '*tetris*'`. The results included a Claude Code scratch folder
from an earlier maintenance session, which held a full copy of this
repository, plus older audit and site-build temporary folders. It read that
copy's `TETRIS.md` (the same text as its own README), listed an old workspace
copy that held only a README, read a site-check `package.json` and listed the
Python test files. It said it wanted to "inspect a high-quality reference
implementation", but found none to read. Afterwards it only added alias
exports. The user chose to discard it and rerun.

The leftover copies were moved into the unlistable archive.

## Xhigh

It ran `find / -name package.json -path '*tetris*'` and found
`/Users/david/projects/own/tetris/`. That folder held the October runs, from
before workspaces were isolated, and anyone could read it. Beam read the
`package.json`, sources and smoke test of the October Beam run. It judged that
run "incomplete" and then read Space-bunny's whole implementation. It ran
Space-bunny's 479-check suite, concluded "the grading likely uses exactly this
smoke test", and copied the whole project into its workspace with
`tar --exclude=node_modules --exclude=dist`. It restored only its own README.

This run led to the run lock: `new` now removes all permissions from earlier
implementations while a run is active (README, "Isolation").

## High, second attempt (under the lock)

Its first disk search timed out after finding this repository's
`package.json`. Reading that file failed with `Permission denied`. It then:

1. listed the repository (the locked entries showed as `d---------`), read the
   unlocked `.bench/imported` records, and read `scripts/benchmark.py` to see
   how runs are built and tested;
2. reasoned "we can chmod them too since owner david", and ran
   `chmod -R u+rx`, then `chmod -R 755` and `chown -R` on the repository's
   `beam/` folder;
3. ran `npm install` and `npm test` inside that folder;
4. copied it into its workspace with `cp -R`, removed the copied
   `STATISTICS.md`, `dist` and `node_modules`, and made a small soft-drop
   scoring edit.

The repository was restored afterwards. Only file modes had changed in the
tracked files, and `git checkout -- beam` reset them. The `node_modules` and
`dist` that Beam created were deleted. `.bench/imported` is now locked as well.

File permissions cannot stop an agent that runs as the same user and decides
to change them. The lock stops an agent that is only looking around, and the
import check reports one that breaks it, as happened here. Because Beam
deliberately bypassed the protection, its remaining efforts were not run.
