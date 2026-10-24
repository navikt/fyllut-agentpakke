# Bounded query starter

Load the base skill and read the app map first. These are templates, not commands
to run with literal placeholders. Select the actual service/variant and confirm
production approval before querying. No example needs a payload or raw message.

Every shell invocation starts fresh. Set these values again when running a new
block. Choose a fixed, short UTC window around the test/incident:

```bash
: "${NAV_PILOT_SKILLS_DIR:?Start the client through nav-pilot}"
set -o pipefail
OBS="$NAV_PILOT_SKILLS_DIR/observability-debugging/obs-query.sh"
CLUSTER='<verified dev or prod label>'
NAMESPACE='<verified namespace>'
APP='<verified service name>'
START='<UTC RFC3339 start>'
END='<UTC RFC3339 end>'
```

`pipefail` prevents a successful `jq` exit from hiding wrapper failures. Inspect
stderr and the API status before interpreting data. `--range` bounds evaluation
times; `[5m]` and `[15m]` also read that much before each evaluation. Keep that
lookback inside the approved data window, or explicitly include it in scope.

## Resolve coverage and metric schema

Use a known app rather than a cluster-wide metric-name scan. Retain pod identity
when separating old/new processes. If `up` is empty or zero, check readiness and
other pillars before interpreting absent HTTP series.

```bash
bash "$OBS" mimir \
  "up{k8s_cluster_name=\"$CLUSTER\",namespace=\"$NAMESPACE\",app=\"$APP\"}" \
  --range "$START" "$END" 60 | jq '{status, error, data}'

bash "$OBS" mimir \
  "count by (__name__) ({k8s_cluster_name=\"$CLUSTER\",namespace=\"$NAMESPACE\",app=\"$APP\",__name__=~\"http_server_requests_seconds_count|http_server_request_duration_seconds_count|innsendingapi_submissions_total\"})" \
  --range "$START" "$END" 60 | jq '{status, error, data}'
```

Discovery is evaluated across the window so it also sees families from pods
that disappeared before its end. Only use the family and labels found above.
For example, Micrometer errors by
route/status/pod, or API submissions by type:

```bash
bash "$OBS" mimir \
  "sum by (pod,uri,status) (increase(http_server_requests_seconds_count{k8s_cluster_name=\"$CLUSTER\",namespace=\"$NAMESPACE\",app=\"$APP\",status=~\"4..|5..\"}[5m]))" \
  --range "$START" "$END" 60 | jq '{status, error, data}'

bash "$OBS" mimir \
  "sum by (pod,visningstype) (increase(innsendingapi_submissions_total{k8s_cluster_name=\"$CLUSTER\",namespace=\"$NAMESPACE\",app=\"innsending-api\"}[5m]))" \
  --range "$START" "$END" 60 | jq '{status, error, data}'
```

These are overlapping five-minute increases, not disjoint buckets to sum across
evaluation times. For a whole-window estimate, evaluate one `increase` covering
the approved window at its fixed end. For low-volume/new series, inspect the
underlying counter range per pod as well. Do not present either as exact tests
passed without log/trace confirmation.

## Count log signatures without returning raw lines

First confirm the frontend variant or backend service within its namespace.
The first example groups errors by container, avoiding confusion with sidecars.
The second deliberately targets `team-soknad`/`innsending-api`, regardless of
the selected frontend, and counts a transition without exposing its identifiers.
These are metric queries: Loki's `--limit` does not cap their series or scanned
data. Bound them with labels, time range, lookback, and evaluation step instead.

```bash
bash "$OBS" loki \
  "sum by (service_name,k8s_container_name) (count_over_time({k8s_cluster_name=\"$CLUSTER\",service_namespace=\"$NAMESPACE\",service_name=\"$APP\"} | detected_level=~\"error|warn\" [15m]))" \
  --range "$START" "$END" 60 | jq '{status, error, data}'

bash "$OBS" loki \
  "sum(count_over_time({k8s_cluster_name=\"$CLUSTER\",service_namespace=\"team-soknad\",service_name=\"innsending-api\"} |= \"sendInnForArkivering, satt soknad.status=Innsendt\" [15m]))" \
  --range "$START" "$END" 60 | jq '{status, error, data}'
```

Again, do not sum overlapping log windows. These counts locate activity; they
do not deduplicate submissions or verify archiving. For follow-up log queries,
keep service/window/limit and project only allowlisted technical fields or fixed
signatures before tool output. Do not dump `.message` or a raw Loki response.

## Find traces, then inspect only the required spans

Set `ENV` to the verified `dev-gcp`/`prod-gcp` and `START_SECONDS`/`END_SECONDS`
to unix seconds for the same window. Keep trace IDs internal for correlation;
the summary below deliberately omits IDs and request names that can carry paths.

```bash
bash "$OBS" tempo-search "$ENV" "{resource.service.name=\"$APP\"}" \
  --range "$START_SECONDS" "$END_SECONDS" --limit 10 \
  | jq '{traces: [.traces[]? | {rootServiceName, durationMs}], error}'
```

Check actual resource service membership when the root is a frontend or another
upstream service. When retrieving an internally selected trace by ID, verify
its timestamps fall in the approved window. Do not print the whole trace,
resource attributes, URL parameters, or bodies. Async processing may require
another trace correlated through logs, not a larger search limit.

## Keep correlation IDs inside the shell

Run this only in an approved, narrow API test window containing the submission
you are checking. Reapply the setup variables first. This pattern captures a
single observed `trace_id` without printing it or the log message. It refuses
ambiguous results and a full page; narrow the window rather than choosing the
first trace. An empty/missing trace field is a coverage gap, not a failed flow.
Do not enable shell tracing (`set -x`) or echo the variable. Do not save the raw
response to a tracked file.

```bash
TRACE_ID="$(bash "$OBS" loki \
  "{k8s_cluster_name=\"$CLUSTER\",service_namespace=\"team-soknad\",service_name=\"innsending-api\"} |= \"sendInnForArkivering, satt soknad.status=Innsendt\"" \
  --range "$START" "$END" --limit 20 \
  | jq -er '
      [.data.result[]?.values[]?] as $lines
      | if ($lines | length) >= 20 then error("Narrow the window: full log page")
        else [$lines[] | .[1] | fromjson? | .trace_id // empty | strings
              | select(test("^[0-9a-fA-F]{32}$"))] | unique
        | if length == 1 then .[0] else error("Need exactly one trace in the selected window") end
        end')" || exit 1

bash "$OBS" tempo-trace "$ENV" "$TRACE_ID" \
  | jq --arg app "$APP" '{expected_service_spans: [
      .batches[]?
      | select(any(.resource.attributes[]?;
          .key == "service.name" and .value.stringValue == $app))
      | .scopeSpans[]?.spans[]?
      | {status: (.status.code // 0),
         start_seconds: ((.startTimeUnixNano | tonumber) / 1000000000),
         duration_ms: (((.endTimeUnixNano | tonumber) - (.startTimeUnixNano | tonumber)) / 1000000)}
    ]}'
```

`ENV` must match the cluster; `APP` selects the service whose membership you
are verifying, even if another service is the root. Compare the projected times
with the approved window. An empty span list does not verify membership. This
does not establish cross-service completion: follow the same submission using
the deployed log schema, keeping further correlation values internal and
projecting only the required technical fields before tool output.
