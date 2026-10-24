---
name: fyllut-observability-debugging
description: Check Fyllut-Sendinn logs, metrics, and traces after preprod testing or during a production incident. Use for submission flow diagnostics across FyllUt, Send inn, innsending-api, soknadsmottaker, and soknadsarkiverer. Extends observability-debugging with team application names, completion signals, and interpretation pitfalls.
license: MIT
metadata:
  version: "1.0.0"
---

# Diagnose the submission flow

Use this skill for read-only diagnostics, not release approval or bug fixes.
Load `observability-debugging` first. It owns access diagnostics, the query
wrapper, tenant headers, and general PromQL/LogQL/TraceQL guidance. Do not copy
its script or change sandbox/network rules to get access.
If the base skill cannot be loaded, stop and report the missing dependency.

Read [the application and signal map](references/submission-map.md) before
choosing services. It records observations from earlier investigations, not
a permanent runtime contract. Verify names, labels, and behavior for the
environment and deployed revision being investigated.

## Establish scope

Use information already provided. Ask only for missing facts needed to scope
the investigation:

- Preprod test check or production incident? Which frontend URL/variant?
- Test/incident start and end, including time zone. Freeze the end time so
  successive queries describe the same window. Report UTC and, when useful,
  `Europe/Oslo` with its actual offset, not a hardcoded two-hour difference.
- Which flows ran: FyllUt, Send inn, ettersending, løspost, logged-in or nologin?
  Were attachments/PDF conversion involved? What did the user observe?
- For a deploy check, which PR/commit/image should have been tested?

Confirm explicit approval for the named apps and time window before any
production query: metrics, log counts, log fields, or traces. Do not ask again
if the user has already explicitly approved that scope. A request to investigate
an incident alone is not blanket approval to read production data. Approval
never permits unrestricted logs or payloads in output.
Start with a short incident window or the stated test window;
ask before expensive multi-day queries. Do not silently widen the scope.

If the user limits the investigation to metrics, respect that limit. State that
it cannot establish an individual submission's outcome or root cause. Otherwise,
correlate at least two pillars before concluding, as the base skill requires.

## Prepare access without querying workloads

Use the client's skill-loading and question tools when available, or their
documented equivalents. Do not assume an MCP server, subagent, or CLI exists.

```bash
: "${NAV_PILOT_SKILLS_DIR:?Start the client through nav-pilot to load skill scripts}"
bash "$NAV_PILOT_SKILLS_DIR/observability-debugging/obs-query.sh" --help
```

If the variable or script is missing, stop and ask the user to restart through
nav-pilot. Query only through that wrapper. Follow its stderr diagnostics;
do not rewrite a query to work around an access refusal. Do not bypass blocked
kubeconfig or repository access. Report the missing evidence instead.

## Investigate in this order

1. **Resolve the actual apps and labels.** Metrics normally use `app` and
   `namespace`; Loki uses `service_name` and `service_namespace`. Observed
   cluster labels are `dev`/`prod`, while Tempo and kubectl contexts use
   `dev-gcp`/`prod-gcp`. Verify instead of substituting one into the other.
   Discover within the selected environment and small time window. Do not start
   with a global scan or every team app.
2. **Check evidence coverage.** Compare `up`, readiness, ingress probes, and
   available HTTP metric families. `up=0` is a scrape failure, not proof the app
   is down. Empty query results are missing evidence, not zero errors.
3. **Bind observations to the tested revision.** Use deployment evidence and,
   when accessible, pod image/digest and process start times. Separate old/new
   pods during rollout. A green CI run or a local branch name does not prove
   which image handled a request. Discover local repos from the workspace,
   read their guidance, and inspect source at the deployed revision when needed.
4. **Measure activity and failures.** Compare business submissions, HTTP
   operations, warnings/errors, and latency in the same window. Split business
   routes from `/internal/isReady` and other health endpoints. Use the matching
   Micrometer or OpenTelemetry family; never add them together as independent
   traffic. Check counter baselines and newly appearing series.
5. **Follow each relevant submission across boundaries.** Start at the failing
   frontend/API for a user symptom, or at metrics for a general regression.
   Follow API → mottaker → Kafka/arkiverer → Joark → feedback to API. Use only
   the internal correlation identifiers needed, kept out of published output.
   HTTP success or `Innsendt` is not proof of `FINISHED` or confirmed archiving.
6. **Inspect the failing or slow step.** Separate upload, PDF conversion,
   submission, and asynchronous archiving. Check Kafka progress/tasks and Joark
   operations for a stuck submission; check downstream client spans for a slow
   HTTP call. Validate that a Tempo result contains the expected service and
   window. Check `rootServiceName` as the base skill advises; a downstream
   service can have a different root, so verify its resource spans before
   discarding the trace or treating it as evidence.
7. **Classify warnings in context.** Use the map's known signatures as leads,
   never as an ignore list. Compare before/after deploy, container, pod lifecycle,
   and the affected flow's final outcome. Check rates before generalizing from
   a single trace.

For bounded discovery and safe output examples, read
[the query starter](references/query-starter.md). Replace all placeholders with
verified values. Retain explicit windows and limits on follow-up queries.

## Interpret low-volume preprod data

- `increase()` can miss the first event of a new counter series whose first
  sample is already 1. Compare first/last samples and series appearance per pod.
  Do not turn a cumulative total into a count for the test window.
- `increase()` extrapolates; decimal results are estimates, not fractional
  submissions. Do not round them into exact test counts without other evidence.
- Historical error counters or nonzero gauges are not new failures. Determine
  the metric type and compare the window with its baseline.
- A handful of requests does not support a meaningful p99 or load assessment.
  Distinguish observed maxima, averages, and histogram estimates. A scrape's
  first observation time is not the exact request time.
- Zero restarts does not exclude pod replacement or HPA scaling. Separate
  application errors from sidecars such as `cloudsql-proxy`.
- Do not sum overlapping tenant/nais platform series or duplicate Kafka topic
  spellings. Missing container metrics mean incomplete resource coverage.

## Report evidence and limits

Answer in the user's language. Include the fixed window/time zone, environment,
apps/variants, and verified revision (or the verification gap). Then give:

- Observed flows and the furthest confirmed stage for each. Separate receipt,
  `Innsendt`, archiverer completion, and feedback to API.
- New deviations versus historical counts or lifecycle-related messages, with
  the metric/log/trace evidence supporting the distinction.
- Coverage gaps, untested flows, and the next bounded check needed. Distinguish
  confirmed facts from hypotheses; name root cause only when supported.

Use anonymous labels such as “submission 1”. Never publish raw log lines,
payloads, tokens, personal data, filenames, submission IDs, journalpost IDs,
or trace IDs in commits, issues, PRs, reports, or chat/tool output. Prefer counts
and allowlisted technical fields over dumping `.message`, attributes, or entire responses.
Do not rely on masking eleven-digit numbers to remove all personal data.

Do not approve/merge a PR, deploy, replay submissions, change alerts/resources,
or create issues/comments as a side effect. Successful preprod smoke tests are
not release approval and do not cover negative auth cases, concurrency, PDF
appearance, every client, or production load. If the user requests a fix or
publication, agree on that separate scope and load the relevant skill.
