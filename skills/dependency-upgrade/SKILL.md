---
name: dependency-upgrade
description: Upgrade one dependency or a small group of two or three tightly related dependencies in one pull request. Use for targeted Maven, Gradle, npm, Docker image, runtime, or GitHub Actions upgrades without inspecting or managing Dependabot or Renovate pull requests.
---

# Upgrade a dependency in one pull request

Upgrade one named dependency, or two or three dependencies that must move together. Finish with one branch and one pull request. Do not create a PR stack.

This skill may also be called by `dependency-upgrade-stack` for one layer of a larger stack. In that case, use the branch and base supplied by the stack skill, but keep all selected dependencies in one PR layer.

If the `unslop` skill is available, invoke it before writing branch names, commits, PR text, risk notes, or the final report. Do not assume every machine has it installed.

## Keep the scope narrow

- Treat the dependencies named by the user as the complete scope.
- Include a second or third dependency only when compatibility requires them to move together. Common examples are React and its types, Spring Boot and a matching springdoc major, an SDK and its plugins, or a framework and its test tools.
- Do not scan for unrelated available updates.
- Do not inspect, modify, comment on, or close Dependabot or Renovate PRs.
- If the requested dependencies can upgrade independently and would make the PR harder to review, ask the user to choose one group before editing.
- Work in one repository unless the dependency contract crosses repository boundaries.

## Rules

- Read the repository's `AGENTS.md`, contribution guide, manifests, lockfiles, workflows, and validation commands first.
- Require a clean worktree before doing anything else. If `git status --porcelain` returns any entry, stop and report the changed files. Do not stash, commit, discard, or work around local changes.
- Use the tool versions pinned in the repository's `mise.toml`.
- Query the package registry or upstream releases for the latest stable version available now. Do not rely on a version suggested in an issue, chat message, or bot PR.
- Exclude snapshots, release candidates, milestones, betas, and alphas unless the user asks for them.
- Only select a version whose release timestamp is more than seven full days old. Record the timestamp and source. If the newest stable release is too recent, use the newest eligible stable release.
- Exempt a stable release from the seven-day wait when it fixes a published CVE. Verify that the release fixes the CVE from an authoritative release note or security advisory, then record the CVE, release timestamp, and source.
- Do not upgrade to a Node.js major until it has entered Long-Term Support according to the official Node.js release schedule. Exclude majors whose status is `Current`, even when they pass the seven-day rule. Record the status and source.
- Keep lockfiles, generated files, checksums, and dependency metadata in sync.
- Use package manager commands when they produce reliable edits. Review every resulting diff.
- Do not hide migration failures with exclusions, broad version overrides, skipped tests, or compatibility shims that bypass the new version.
- Read authoritative release notes and migration guides for every major update. Research a large minor update when code generation, serialization, persistence, authentication, or deployment behavior may change.
- Delegate substantial changelog and migration research to one focused subagent for the selected dependency group. Ask for authoritative source links, compatibility constraints, concrete risks, and required migration work.
- Do not merge the PR unless the user asks.

## Inspect the target

Confirm:

1. Git status, current branch, remotes, and the remote default branch.
2. Every declaration of the selected dependencies.
3. The effective or resolved version, including dependency management and transitive constraints.
4. Existing build, test, lint, generated-code, and integration commands.
5. Runtime, plugin, peer dependency, and platform compatibility for the requested target.

Record each selected dependency's current version, newest eligible stable version, release timestamp, timestamp source, update type, and expected risk. Also record newer versions excluded by the seven-day wait period and any CVE-fixing versions exempted from it.

## Find the target version

For Maven, use the Versions plugin to inspect the relevant parent, property, dependency, plugin, or BOM. Check effective dependency management before changing an explicit override. A framework BOM may already manage the compatible version.

For Gradle, use the repository's dependency update task or version catalog tooling. Review rejected versions and resolution rules.

For npm, query the registry and use the repository's pinned package manager. Respect workspaces. Inspect peer dependency ranges before grouping framework majors.

For Docker images, check publisher tags and release notes. Preserve digest pinning when the repository uses it. Confirm architecture support and migration notes for stateful services.

For GitHub Actions, check the latest eligible release and find every reference to the selected action so the repository does not run mixed majors by accident. Write major-only references such as `actions/checkout@v7`, even when research uses a specific release to assess age and risk.

## Plan the change

Before editing a major upgrade:

1. Read the upstream migration guide, release notes, compatibility table, and known issues.
2. Search for removed packages, renamed configuration keys, custom serializers, persistence converters, generated code flags, test utilities, and plugin APIs used by the repository.
3. Check whether internal and third-party integrations support the target.
4. Write a short risk assessment with concrete failure modes such as JSON changes, schema output changes, authentication defaults, database migrations, runtime requirements, or CI permission changes.

Keep dependencies together only when one requires the other. The finished PR must still contain no more than three direct dependency upgrades.

## Handle runtime and image upgrades

For a Docker image or runtime target:

- Prefer major-only image tags such as `FROM node:24-alpine`. Do not introduce minor or patch precision such as `FROM node:24.14.0-alpine`.
- If the repository already pins an image to a minor or patch version, preserve that precision unless the user asks to change the pinning policy.
- Keep runtime declarations aligned. Check `mise.toml` and other mise files, `.nvmrc`, `engines.node`, workflow runtimes, Java toolchains, Maven compiler settings, and Gradle toolchains as applicable.
- When Node.js changes, update `@types/node` to the compatible major in the same PR.
- Check native module and architecture support, removed runtime features, memory defaults, TLS and certificate changes, and base distribution changes.

## Apply and validate the upgrade

1. Fetch the remote default branch and create one clearly named branch from it. When called by `dependency-upgrade-stack`, stay on the supplied stack branch instead.
2. Apply the version changes and required migration work.
3. Regenerate only the files tied to the selected dependencies.
4. Review the complete diff. Remove unrelated lockfile or generated-file churn.
5. Run the smallest complete repository-native validation. Use the same build command as CI when practical.
6. For framework or runtime majors, run tests that start the real application, not only compilation or isolated unit tests.
7. Fix root causes. If a framework split or moved a module, add the supported module instead of recreating old behavior.
8. Commit with a plain description.
9. Push the branch and create one pull request. When called by `dependency-upgrade-stack`, use its stack submission command instead.
10. Wait for required GitHub checks and fix failures before finishing.

If local tests pass but CI fails, inspect the failed job log and reproduce the same command locally before changing code.

## Write the pull request

The PR description must contain:

- an exact version-change table, including release dates
- direct links to the authoritative changelog, release notes, migration guides, compatibility tables, or registry data used
- concrete risks and behavior reviewers should check
- local validation results and GitHub check status
- a `Migration work and decisions` section

In `Migration work and decisions`, name every workaround, necessary rewrite, configuration adjustment, unexpected version pin, and judgment call. Explain why it was needed and which reasonable alternatives were considered. If no migration work was needed, say so plainly.

## Finish

Confirm that the PR contains only the selected dependency group, required migration work, and synchronized metadata. Confirm every required check passes.

Report:

- the single PR link
- versions upgraded
- authoritative research sources
- migration risks and decisions
- local and GitHub check results
- versions deferred by the seven-day rule
- CVE-fixing versions exempted from the seven-day rule, including the CVE identifiers
- a Node.js major deferred because it has not entered LTS, when applicable

End with the direct GitHub PR link.

## Troubleshooting notes

- A dependency override can silently defeat a framework BOM. Remove it when the framework now manages the compatible release.
- A framework major may compile before application contexts fail. Run tests that start the real application.
- Serialization migrations need more than import changes. Check mapper construction, custom modules, annotations, configuration keys, database converters, generated models, and response payloads.
- Modular frameworks may require explicit runtime and test starters that older versions pulled in transitively.
- Generated-code upgrades can change wire formats without changing handwritten source. Inspect generated diffs or exercise serialization in tests.
- GitHub Action majors may change security defaults only for certain triggers. Read every workflow trigger before rating the risk.
- GitHub Action majors can remove environment variables that package managers relied on indirectly. Run non-install commands after upgrading setup actions and inspect generated registry configuration.
- A broad Yarn Classic lockfile refresh can update unrelated production dependencies. Start again from the original lockfile, update the smallest dependency set possible, and audit unchanged production entries.
- Authenticate to private package registries before changing manifests or lockfiles. Never commit local `file:` references, placeholder packages, or rewritten private registry metadata.
- Minimal test environments may lack browser binaries, Xvfb, desktop libraries, or access to external resources. Separate environment failures from dependency failures before changing code.
- Mounted workspaces can cause intermittent linking and standalone-build errors during large JavaScript installs. Reproduce in a clean copy on a stable filesystem before treating those errors as repository defects.
- ESLint major compatibility requires the real lint command. Top-level peer support does not prove that bundled plugins, parsers, or transitive copies support the new APIs.
