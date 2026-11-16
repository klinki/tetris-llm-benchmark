# Unavailable models

Check this list before preparing or launching a benchmark. These are confirmed
failures on the recorded provider, account, and local connection, not claims that
the underlying models are unavailable everywhere. Skip the affected combinations
until the user asks for a recheck or there is concrete evidence of changed
availability. Catalog listings alone do not establish access.

| Exact provider/model ID | Last confirmed | Reason | Scope |
|---|---|---|---|
| `opencode/inkling-2-small-free` | 2026-11-16 | HTTP 403 `RegionError`: “This model is not available in your country” | OpenCode free endpoint on this connection; all reasoning efforts |
| `opencode/crouton-alpha-free` | 2026-11-04 | `provider.auth`: “This model is not available in your country” | OpenCode free endpoint on this connection; all reasoning efforts |
| `openrouter/meta/muse-ember` | 2026-11-16 | HTTP 402 `provider.quota`: “Insufficient credits. This account never purchased credits.” | Current OpenRouter account; all reasoning efforts until credits or account/key setup changes |
| `opencode/muse-ember-1.0` | 2026-11-16 | `provider.no-route`: “Model unavailable: opencode/muse-ember-1.0” | Installed OpenCode client cannot route this model ID; provider access remains unverified |

## Inkling 2 Small Free

- **2026-11-10:** A medium-effort benchmark attempt failed immediately with the
  country restriction. No implementation was produced; the remaining efforts
  were not launched.
- **2026-11-16:** An explicitly requested availability recheck used
  `opencode/inkling-2-small-free#low` through the local OpenCode CLI with the
  prompt “Reply with exactly OK. Do not use tools or read or modify files.”
  The provider returned HTTP 403, `RegionError`, with the message above, before
  any model response. Native session: `ses_e1c56745dffeF5RybfFhGA0QQP`.

The November 16 check was not a benchmark. Its unused benchmark workspace was
archived. Local attempt records are kept in `.bench/abandoned` under
`inkling-2-small-free-medium-03f4a8e5789e` and
`inkling-2-small-free-low-99cbc3ac8180`; this tracked summary preserves the
restriction when those ignored records are absent.

## Crouton Alpha Free

The minimal-effort provider turn was rejected before implementation. Low,
medium, high, xhigh, and max were not launched because the country restriction
applies to the model. The November 4 failure is preserved in the local record
`.bench/abandoned/crouton-alpha-free-minimal-f5aa7cae3083.json`.

## Muse Ember

Previously exposed as the stealth model `crouton-alpha`
(`opencode/crouton-alpha-free`).

- **2026-11-10:** The first low-effort benchmark attempt through
  `openrouter/meta/muse-ember` failed before any model response or implementation.
  OpenRouter reported insufficient credits and that the account had never
  purchased credits. The local record is
  `.bench/abandoned/muse-ember-low-0df3e9153427.json`.
- **2026-11-16:** An explicitly requested availability recheck used
  `openrouter/meta/muse-ember#low` through the local OpenCode CLI with the prompt
  “Reply with exactly OK. Do not use tools or read or modify files.” OpenRouter
  again returned HTTP 402, classified as `provider.quota`, with the message
  above and `limit_source: openrouter_credits`. No model response was received.
  Native session: `ses_e1c532f18ffe14lh6fL9pD7ybr`.

This is an account billing block, not a confirmed model or regional restriction.
Changing reasoning effort does not resolve it. Skip retries on this account
until credits are added or the account/key configuration is corrected; those
changes have not been made.

A separate explicitly requested check on **2026-11-16** found Muse Ember 1.0 in
OpenCode's official catalog as `opencode/muse-ember-1.0`, but not in the installed
client's model list. A minimal request to `opencode/muse-ember-1.0#low` returned
`provider.no-route`: “Model unavailable: opencode/muse-ember-1.0”. Native session:
`ses_e1c508383ffeLam3xW5H1BYOzv`. The request did not reach the model provider;
this establishes a local routing block, not a regional or billing restriction
on OpenCode's endpoint. Recheck after the client supports that route or at the
user's explicit request.

No successful benchmark or quality score exists for these failed attempts.
Other providers or paid endpoints are separate combinations; their access has
not been established by these checks.
