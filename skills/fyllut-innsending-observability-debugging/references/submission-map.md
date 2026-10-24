# Applications and submission signals

## How to use this map

This map distills OpenCode investigations from 18–22 October 2026: a preprod
end-to-end log check, two low-volume metric checks, a post-deploy API check,
and a “Send digitalt” failure. A production publishing investigation also
showed why upstream timeouts and pod replacement need separate checks.
These are historical observations, not current health findings or permanent
exceptions. No incident payloads or correlation IDs are retained here.

Validate the relevant row against current labels, Nais manifests, and source
at the deployed revision. Do not assume main is deployed. If access is blocked,
state which mapping or interpretation remains unverified.

## App map

| App/service to look for | Observed namespace | Role and routing hint |
| --- | --- | --- |
| `skjemautfylling`, `skjemautfylling-preprod`, `skjemautfylling-preprod-alt`, `skjemautfylling-delingslenke` | `skjemadigitalisering` for the observed preprod flow | FyllUt frontend/server variants. Testing “preprod” can produce activity under `preprod-alt`; a delingslenke failure need not affect the other variants. Verify the actual URL and service. |
| `fyllut-ettersending` | `skjemadigitalisering` | Ettersending entry point; distinguish a normal redirect to login from a persistent authentication loop. |
| `send-inn-frontend` | `team-soknad` | Send inn entry point. Correlate authenticated frontend requests with the API, not INFO-line counts alone. |
| `innsending-api` | `team-soknad` | Submission state, attachments, sending to mottaker, and archiving feedback. Repository `navikt/innsending-api`. |
| `soknadsmottaker` | `team-soknad` | Receives submissions and publishes to Kafka. Repository `navikt/soknadsmottaker`. |
| `soknadsarkiverer` | `team-soknad` | Asynchronous tasks, archiving in Joark, processing events and feedback. Repository `navikt/soknadsarkiverer`. |
| `upload-convert-to-pdf` (observed client destination `upload-convert-to-pdf.fyllut-sendinn`) | Verify runtime namespace; the observed destination uses `fyllut-sendinn` | Dependency for file conversion. Start from the API's client metric/span before querying this service separately. |

The map scopes the team's submission applications; it is not a complete ownership
catalog. SAF, Joark, ID-porten, TokenX, and Azure token endpoints are dependencies,
not evidence that the team owns those services. Skjemabygger/`forms-api`
publishing is a separate flow: investigate it only when the symptom points there.

## Completion is more than HTTP success

The observed logged-in flow was:

```text
FyllUt / Send inn / ettersending
  → innsending-api (attachments, submit, local status Innsendt)
  → soknadsmottaker (receipt, Kafka publication)
  → soknadsarkiverer (RECEIVED → STARTED → ARCHIVED → FINISHED)
  → archiving feedback to innsending-api ("er arkivert")
```

Use the same internal correlation across these boundaries. Async processing
can span multiple traces. Check attempt/retry progression and stuck tasks,
not just whether any `FINISHED` exists in the window. Verify separate logged-in
and nologin paths; success in one does not test the other.

| Evidence | What it establishes, and what it does not |
| --- | --- |
| `innsendingapi_submissions_total`, observed label `visningstype` | Business submission activity by flow. Verify label values; metrics alone do not identify a particular manual test or file type/language. |
| API `Sendt inn soknad.` and `sendInnForArkivering, satt soknad.status=Innsendt` | Sending/local state transition. Not independent confirmation of journalføring in Joark. These messages can contain identifiers; count or project safe fields rather than printing them. |
| Mottaker receipt and Kafka publication | Submission reached the receiving step. Not completion of asynchronous archiving. |
| Arkiverer `RECEIVED`, `STARTED`, `ARCHIVED`, `FINISHED` | Progress through processing. Match the submission and attempt; arbitrary status hits are insufficient. |
| API `er arkivert` for the same submission | Feedback reached the API. Combined with archiverer completion, stronger evidence than the submit response alone. Not a visual check of the stored PDF. |

## Metric families observed in the investigations

Discover the names and label schema in the selected window before composing
queries. Do not assume every app exports every family.

| Area | Starting points |
| --- | --- |
| Micrometer HTTP server | `http_server_requests_seconds_count`, `_max`, `_bucket`; labels `uri`, `method`, `status`. Separate `/internal/isReady` from business traffic. |
| OpenTelemetry HTTP server | `http_server_request_duration_seconds_count`, `_sum`, `_bucket`; labels `http_request_method`, `http_response_status_code`, sometimes `http_route`. Missing route means endpoint attribution is unavailable. |
| Downstream HTTP / conversion | `http_client_request_duration_seconds_count`, `_sum`, `_bucket`; `server_address`, `http_response_status_code`, `error_type`. `error_type="cancelled"` against a token host alone does not prove failed authentication. |
| API business signals | `innsendingapi_number_of_operations_total`, `innsendingapi_number_of_errors_total` (observed `operation` label). Check `innsendingapi_applications_absent_in_archive`, `innsendingapi_archiving_of_applications_failed`, `innsendingapi_applications_not_sent_in` against baseline; do not assume they are counters. |
| Archiverer tasks and Joark | `soknadinnsending_gauge_tasks`, `soknadinnsending_gauge_tasks_given_up_on`; `soknadinnsending_latency_joark_operations` and its `_count`/`_sum`. Check current type/unit and operation labels before calculating latency or success. |
| Kafka clients | `kafka_consumer_records_lag`, `kafka_consumer_records_consumed_total`, producer error/retry totals, failed authentication/rebalance totals. Topic labels can use dots or underscores for the same logical topic; do not add aliases. Client fetch-lag is not broker-measured committed consumer-group lag. |
| JVM/database/lifecycle | `hikaricp_connections_pending`, `_active`, `_max`, `_timeout_total`, JVM memory/GC, `process_start_time_seconds`, readiness and restarts. Inspect pod replacement and sample gaps as well as counters. |

## Signatures to interpret, not suppress

| Signature or observation | Required follow-up |
| --- | --- |
| `Fontconfig error: No writable cache directories` | Appeared before successful submissions. Check flow completion and PDF appearance separately. Do not declare it harmless or infer a failed submission from the line alone. |
| `cloudsql-proxy` closed-network-connection messages | Previously coincided with SIGTERM/HPA scale-down. Verify the same pod's shutdown, readiness, and DB pool evidence before classifying as lifecycle noise. New pods do not increment the old container's restart counter. |
| `soknadsmottaker` app `up=0` with working ingress/OTel/logs | Previously a scrape gap, not a proven outage. Check current readiness, probes, and alternative telemetry. No Micrometer HTTP data is not “zero requests/errors”. |
| `schema is null!` on INFO | Occurred during flows that reached `FINISHED`. Inspect subsequent processing for that submission; the wording alone does not establish failure. |
| SAF “Fant ingen relevante søknader i søknadsarkivet” / “Fant ikke journalpost” | Distinguish no matching history from integration failure. Some paths caught SAF failures and returned an empty list. Inspect deployed code and downstream evidence rather than assuming auth rejection. |
| SAF HTTP 200 / body `ON_COMPLETE` | Body completion does not prove GraphQL success. Check GraphQL error handling and safe byte-count/terminal-signal fields (`saf_response_bytes_received`, `saf_response_body_terminal_signal`) if present. Never print the response body. |
| JOSE `Expected 200 OK from the JSON Web Key Set HTTP response` | Previously a test ID-porten JWKS 503 caused FyllUt `/fyllut/api/config` to return 500 before submission. Verify outgoing status/spans and affected variant; do not infer an API or production outage. |
| Hikari keepalive warning / `Thread starvation or clock leap detected` | These are different signatures. A configuration warning is not proof of pool exhaustion; starvation/clock-leap needs pod/node, CPU/GC, timing and dependency checks. Sampled pending=0 does not exclude short stalls. |
| Ingress 504 followed much later by `ECONNRESET` | A client timeout does not mean downstream work stopped. Inspect client spans and subsequent state; do not retry a state-changing call or replay a submission as a diagnostic action. |
