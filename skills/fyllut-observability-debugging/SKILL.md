---
name: fyllut-observability-debugging
description: Navigate Fyllut-Sendinn logs, metrics, and traces after preprod testing or during incidents. Use with observability-debugging for app names, namespaces, flow, and integrations.
license: MIT
metadata:
  version: "1.1.0"
---

# Fyllut-Sendinn observability

Load `observability-debugging` first. Use it for query tools, access, time
windows, correlation, and safety rules.

Use [the application map](references/submission-map.md) to choose services and
namespaces. It is a starting point, not an exhaustive catalog. Verify names
against the selected environment when they differ from the map.

## Navigation hints

- Match the frontend URL to its service. Preprod, preprod-alt, and delingslenke
  can route to different apps. For a deploy check, establish which revision
  handled the tested requests.
- Metrics usually use `app` and `namespace`; Loki uses `service_name` and
  `service_namespace`. Cluster labels are commonly `dev`/`prod`, while Tempo
  uses `dev-gcp`/`prod-gcp`. Confirm the labels in the data.
- Follow the relevant part of the flow and its dependencies. A successful
  submit response or local status `Innsendt` does not confirm archiving.
- The map lists business metric names to start with. Discover available
  families rather than treating missing data as zero errors.

Keep the investigation read-only unless the user requests a separate change.
Keep personal data, raw payloads, and correlation IDs out of shared output.

## Ingress and HAProxy in FSS

In `prod-fss`, ingress logs were found in Loki's **platform dataset**:
use `--org nais`, not the application default `tenant`. Access logs use
`service_name="nais-ingress"` and **the target application's namespace** in
`service_namespace`, even though the ingress controller runs in `nais-system`.
Controller lifecycle and reload logs use `service_namespace="nais-system"`.
Verify these labels in other environments rather than assuming the same layout.

For example, find access logs for Foerstesidegenerator with this selector:

```logql
{k8s_cluster_name="prod-fss",service_name="nais-ingress",service_namespace="teamdokumenthandtering"} |= "foerstesidegenerator"
```

Pass the selector to `obs-query.sh loki` with `--org nais`, an explicit
`--range <start> <end>`, and a small `--limit`. Inspect the JSON field names
first, then select only the technical fields needed. Do not dump raw access
logs: URLs, query strings, client addresses, and trace fields can be sensitive.

- Indexed `service_name` identifies the ingress logger. The JSON body's
  `service_name` identifies the target app. Distinguish them when parsing.
- Useful fields include `upstream_status`, `termination_state`, `request_time`,
  `upstream_connect_time`, `upstream_header_time`, and `upstream_response_time`.
  Confirm timing units against the controller's log format before interpreting.
- A normal termination state (`----`) with an upstream 504 can mean the target
  app returned that status. It does not by itself prove an ingress timeout.
- For resets, compare both ingress hops: incoming traffic to the proxy and its
  outgoing traffic to the dependency. Correlate with controller shutdown/reload
  logs and pod start times. HAProxy backend metrics can be selected by `proxy`,
  for example `teamdokumenthandtering_svc_foerstesidegenerator_http`, in Mimir
  with `--org nais`; discover available names and labels first.
- Missing access entries and zero backend error counters do not prove a request
  never arrived. A nearby rollout is a hypothesis, not proof that a particular
  socket used a terminating pod or a stale keep-alive connection.

## Suggest useful updates

If the investigation reveals general knowledge that would help future
investigations, suggest an update to `fyllut-observability-debugging` in the
final response. Examples include an application name, an integration, a useful
metric, or a correction to the flow. Do not edit the skill automatically.
Do not suggest incident-specific details or personal data.
