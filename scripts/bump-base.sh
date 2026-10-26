#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 0 ]]; then
  printf 'Bruk: bash scripts/bump-base.sh (uten argumenter)\n' >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

for tool in git gh jq nav-pilot mise; do
  command -v "$tool" >/dev/null || fail "Mangler verktøy: $tool"
done

[[ "$(git branch --show-current)" == main ]] || fail 'Bytt til main før du kjører skriptet.'
[[ -z "$(git status --porcelain --untracked-files=all)" ]] || fail 'Repoet må være rent, også for uversjonerte filer.'
repo=$(jq -er '.owner.repo' .nav-pilot/agentpakke.json)
origin=$(git remote get-url --push origin)
case "${origin%.git}" in
  "https://github.com/$repo"|"git@github.com:$repo"|"ssh://git@github.com/$repo") ;;
  *) fail "origin må peke til GitHub-repoet $repo, ikke en fork eller et annet repo." ;;
esac
gh auth status

# Hent eksplisitt main, uavhengig av lokal upstream-konfigurasjon.
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge-base --is-ancestor HEAD origin/main || fail 'Lokal main har egne commits. Avklar dem før oppdatering.'
git merge --ff-only origin/main

lock=.nav-pilot/agentpakke.lock.json
old_sha=$(jq -er '.sha | select(test("^[0-9a-f]{40}$"))' "$lock")
source=$(jq -er '.source' "$lock")
temp_dir=$(mktemp -d)
summary="$temp_dir/summary"
trap 'rm -f "$summary" "$temp_dir/pr"; rmdir "$temp_dir"' EXIT
trap 'printf "Oppdateringen stoppet. Beholder filer og eventuell branch for manuell oppfølging. Sjekk git status.\n" >&2' ERR

nav-pilot pakke bump-base --target "$PWD" >"$summary"
cat "$summary"
if [[ -z "$(git status --porcelain --untracked-files=all)" ]]; then
  printf 'Nav-grunnpakken er allerede oppdatert. Ingen branch eller PR opprettet.\n'
  exit 0
fi

[[ "$(git status --porcelain --untracked-files=all)" == " M $lock" ]] || fail 'Uventede filendringer. Avbryter uten å committe.'
new_sha=$(jq -er '.sha | select(test("^[0-9a-f]{40}$"))' "$lock")
[[ "$old_sha" != "$new_sha" ]] || fail 'Låsefilen er endret uten ny base-SHA. Sjekk diffen.'
[[ "$(jq -er '.source' "$lock")" == "$source" ]] || fail 'Basekilden er endret. Sjekk diffen.'

branch="chore/nav-pilot-base-${new_sha:0:12}"
if git show-ref --verify --quiet "refs/heads/$branch"; then
  fail "Branchen $branch finnes lokalt. Beholder låsefilendringen på main. Sjekk git diff og følg opp eksisterende branch."
fi
remote_branch=$(git ls-remote --heads origin "refs/heads/$branch")
[[ -z "$remote_branch" ]] || fail "Branchen $branch finnes på origin. Følg opp eksisterende PR."
git switch --no-track -c "$branch"

nav-pilot validate --source "$PWD"
mise run test
mise exec -- node --check skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs
bash -n skills/fyllut-release/scripts/list-releasable-fyllut-commits.sh

[[ "$(git status --porcelain --untracked-files=all)" == " M $lock" ]] || fail 'Valideringen endret filer. Avbryter uten å committe.'
title="chore: nav-pilot pakke bump-base (${new_sha:0:12})"
git add -- "$lock"
git commit -m "$title" -m "Base: $source@$new_sha"
git push origin "HEAD:refs/heads/$branch"

# Bruk fil, slik at Markdown fra nav-pilot ikke tolkes av skallet.
{
  printf 'Oppdaterer `%s` fra `%s` til `%s`.\n\n' "$source" "$old_sha" "$new_sha"
  cat "$summary"
  printf '\n\nKontrollert med pakkens tester, nav-pilot validate og syntakssjekker.\n'
} >"$temp_dir/pr"
gh pr create --repo "$repo" --base main --head "$branch" --title "$title" --body-file "$temp_dir/pr"
