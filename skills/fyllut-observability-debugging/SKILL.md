---
name: fyllut-observability-debugging
description: Navigate Fyllut-Sendinn logs, metrics, and traces after preprod testing or during incidents. Use with observability-debugging for app names, namespaces, flow, and integrations.
license: MIT
metadata:
  version: "1.0.0"
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

## Suggest useful updates

If the investigation reveals general knowledge that would help future
investigations, suggest an update to `fyllut-observability-debugging` in the
final response. Examples include an application name, an integration, a useful
metric, or a correction to the flow. Do not edit the skill automatically.
Do not suggest incident-specific details or personal data.
