# Agent guidance

- This is a Tier 1 nav-pilot package for user-scope installation, not an app.
- `.nav-pilot/agentpakke.json` declares the `fyllut` persona and content layout.
  `.nav-pilot/agentpakke.lock.json` pins the reused `navikt/copilot` base.
- Keep complete `skills/<name>/` directories, including scripts and references.
  Resolve scripts through `NAV_PILOT_SKILLS_DIR`; never hardcode plugin paths.
- Prefix team skill names with `fyllut-`. Use `fyllut-release` for the release
  skill, but keep the upstream workflow name `release-fyllut.yaml`.
  `conventional-commit` comes from the base; do not add a local copy.
- Skills originated in `navikt/fyllut-sendinn-local-dev-env`; README records
  the import revision. Preserve local adaptations when refreshing them.
- Support Copilot and OpenCode. Preserve explicit user approvals; use the
  client's question/plan equivalents rather than inventing unavailable tools.
- Validate with `nav-pilot validate --source "$PWD"`,
  `mise run test`, `mise exec -- node --check
  skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs`, and
  `bash -n skills/fyllut-release/scripts/list-releasable-fyllut-commits.sh`.
- Never install into the developer's real profile just to test this package.
  Use an isolated HOME/config. Do not dispatch releases during validation.
