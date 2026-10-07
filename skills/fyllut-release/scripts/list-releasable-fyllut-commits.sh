#!/usr/bin/env bash

set -euo pipefail

readonly target_branch="${1:-master}"
readonly target_count=5
readonly scan_limit=25
readonly repository="navikt/skjemabygging-formio"
readonly workflow="build-and-test.yaml"
readonly target_repository="navikt/skjemautfylling-formio"

if ! current_monorepo_sha="$(
  gh api "repos/${target_repository}/contents/MONOREPO?ref=${target_branch}" \
    --jq .content | base64 --decode
)"; then
  printf 'Could not read MONOREPO from %s:%s. Check GitHub access and stop.\n' \
    "$target_repository" "$target_branch" >&2
  exit 1
fi

if ! [[ "$current_monorepo_sha" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'MONOREPO on %s:%s does not contain a full commit SHA. Stop.\n' \
    "$target_repository" "$target_branch" >&2
  exit 1
fi

printf 'Current MONOREPO on %s: %s\n\n' "$target_branch" "$current_monorepo_sha"

if ! commit_shas="$(
  gh api "repos/${repository}/commits?sha=main&per_page=${scan_limit}" --jq '.[].sha'
)"; then
  printf 'Could not read main commits from %s. Check GitHub access and stop.\n' \
    "$repository" >&2
  exit 1
fi

listed_count=0

while read -r sha; do
  if ! run_status="$(gh run list \
    --repo "$repository" \
    --workflow "$workflow" \
    --branch main \
    --commit "$sha" \
    --status completed \
    --json conclusion \
    --jq 'any(.[]; .conclusion == "success")')"; then
    printf 'Could not check the build workflow for %s. Check GitHub access and stop.\n' \
      "$sha" >&2
    exit 1
  fi

  if [ "$run_status" = true ]; then
    if ! commit_details="$(
      gh api "repos/${repository}/commits/${sha}" \
        --jq '[.sha, (.commit.author.date | split("T")[0]), .commit.author.name, (.commit.message | split("\n")[0])] | .[]'
    )"; then
      printf 'Could not read commit details for %s. Check GitHub access and stop.\n' \
        "$sha" >&2
      exit 1
    fi

    printf '%s\n' "$commit_details"

    if [ "$sha" = "$current_monorepo_sha" ]; then
      printf 'Currently deployed on %s\n' "$target_branch"
    fi

    listed_count=$((listed_count + 1))

    if [ "$listed_count" -eq "$target_count" ]; then
      break
    fi
  elif [ "$run_status" = false ]; then
    printf 'Skipping %s because build-and-test.yaml has no successful run.\n' "$sha" >&2
  else
    printf 'Could not determine build status for %s. Check GitHub access and stop.\n' \
      "$sha" >&2
    exit 1
  fi
done <<< "$commit_shas"
