# Applications and flow

## Application map

The team's namespaces are `skjemadigitalisering`, `fyllut-sendinn`,
`team-soknad`, and `teamserviceklage`. Use the names below to start searching;
check runtime labels or Nais manifests for variants and apps not listed here.

| App/service | Namespace | Role |
| --- | --- | --- |
| `skjemautfylling`, `skjemautfylling-preprod`, `skjemautfylling-preprod-alt`, `skjemautfylling-delingslenke` | `skjemadigitalisering` | FyllUt frontend/server variants. Match the service to the tested URL. |
| `fyllut-ettersending` | `skjemadigitalisering` | Ettersending entry point. |
| `send-inn-frontend` | `team-soknad` | Send inn entry point. |
| `innsending-api` | `team-soknad` | Submission state, attachments, sending, and archiving feedback. |
| `soknadsmottaker` | `team-soknad` | Receives submissions and publishes to Kafka. |
| `soknadsarkiverer` | `team-soknad` | Processes submissions and archives documents in Joark. |
| `upload-convert-to-pdf` | `fyllut-sendinn` | File conversion. |
| `tilbakemeldingsmottak-api`, `tilbakemeldingsmottak-frontend` | `teamserviceklage` | API and frontend for tilbakemeldingsmottak. |

## Submission flow

FyllUt, Send inn, and ettersending use `innsending-api` for submission handling.
The API sends to `soknadsmottaker`, which publishes to Kafka.
`soknadsarkiverer` processes the submission and archives it in Joark.
Archiving feedback returns to `innsending-api`.

Local status `Innsendt` confirms a different stage from completed archiving.
To check completion, correlate archiverer completion with archiving feedback
to the API for the same submission. This describes the submission flow, not
the separate tilbakemeldingsmottak flow.

## Integrations

Follow the relevant outgoing call or asynchronous message when the symptom
points beyond an app. Locate the dependency's service and namespace from runtime
telemetry or configuration rather than assuming it shares our namespace.

| System | Where it matters |
| --- | --- |
| ID-porten, TokenX, Azure | Login, token validation, and token exchange. |
| SAF | Lookup of previously archived submissions, including ettersending. |
| Joark | Document archiving through `soknadsarkiverer`. |
| Kafka | Submission messages, processing events, and archiving feedback. |
| PDF conversion, Cloud SQL, document storage | Upload, conversion, persistence, and attachment handling. |
| Skjemabygger and `forms-api` | Form configuration and publishing. This is a separate flow from submitting a completed form. |

## Metric starting points

| Area | Names to look for |
| --- | --- |
| API submissions and operations | `innsendingapi_submissions_total`, often with `visningstype`; `innsendingapi_number_of_operations_total`, `innsendingapi_number_of_errors_total`. |
| API archiving checks | `innsendingapi_applications_absent_in_archive`, `innsendingapi_archiving_of_applications_failed`, `innsendingapi_applications_not_sent_in`. |
| Archiverer work and Joark | `soknadinnsending_gauge_tasks`, `soknadinnsending_gauge_tasks_given_up_on`, `soknadinnsending_latency_joark_operations`. |

Confirm metric types and labels before interpreting values. HTTP telemetry may
use Micrometer's `http_server_requests_seconds_*` or OpenTelemetry's
`http_server_request_duration_seconds_*`. They can describe the same traffic;
do not add them together as independent requests.
