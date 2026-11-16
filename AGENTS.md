# Benchmark instructions

Before preparing a workspace or launching any benchmark:

1. Check [benchmark-runs.json](benchmark-runs.json) for an existing run of the
   requested model, provider, reasoning effort, and harness. Report the existing
   run instead of repeating that combination unless the user explicitly requests
   a rerun. An existing run at another effort does not block a new effort.
2. Check [UNAVAILABLE_MODELS.md](UNAVAILABLE_MODELS.md). Skip a listed model on
   the affected provider and connection, across all efforts covered by its
   restriction. Do not retry it just because it appears in a model catalog.
   Recheck only when the user explicitly asks or there is concrete evidence that
   the restriction has changed. Do not substitute another model or provider
   without the user's instruction.
3. Inspect local `.bench/pending`, `.bench/held`, and `.bench/abandoned` records
   for active runs, completed runs awaiting import, and previous failures. Resume
   or report existing work instead of launching a duplicate. These records are
   ignored by Git and may be absent on another checkout; keep confirmed provider
   availability failures in the tracked root list as well.

Use the [benchmark procedure in README.md](README.md#running-a-benchmark-in-t3-code)
for runs that pass these checks. Preserve its fixed prompt, isolation, runtime,
cleanup, and import requirements.

When a provider confirms a persistent availability failure, update
`UNAVAILABLE_MODELS.md` with the exact provider/model ID, date, error, affected
scope, and evidence. Stop the remaining efforts when the failure applies to the
whole model. Keep failed availability attempts out of scored benchmark results.
Do not classify transient timeouts, rate limits, or local permission problems as
model unavailability. If an authorized recheck succeeds, update or remove the
block and retain the dated history.

After a run is imported, audited, scored, and its results are saved and verified,
archive the dedicated T3 Code project used for that run. This is a required
completion step in addition to workspace cleanup and settling the run's thread.
Use the recorded `t3_project_id`, or read the run's T3 thread to identify its
project, then call `t3_project_update` with `projectId` and `archived: true`.
Read the project back and confirm `archivedAt` is set before reporting that
archiving succeeded. Archiving preserves the project's threads and files.
Archive only the isolated run project, never the main benchmark repository
project or a project with unfinished work. An imported run still awaiting its
quality audit is not complete. If archiving fails or is denied, report it as
outstanding cleanup; do not claim that the project was archived.
