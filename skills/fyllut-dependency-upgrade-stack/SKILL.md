---
name: fyllut-dependency-upgrade-stack
description: Replace open dependency update PRs with a tested GitHub stack. Use for periodic repository-wide Maven, Gradle, npm, Docker image, or GitHub Actions upgrades when minor and patch updates should land before researched major updates.
disable-model-invocation: true
---

# Build a dependency upgrade stack

Create manual dependency upgrade PRs instead of merging bot PRs. Work in one repository unless a dependency contract crosses repository boundaries.

Invoke `fyllut-dependency-upgrade` before proceeding. That skill owns version eligibility, authoritative research, ecosystem-specific checks, migration work, validation, PR descriptions, and troubleshooting. This skill adds repository-wide inventory, grouping, commit structure, stack orchestration, and replacement of bot PRs. When the skills conflict, this skill controls dependency grouping, commit structure, branch creation, PR bases, and stack submission.

## Stack rules

- Run `gh stack --help` to check whether the extension is available. Use it when available; otherwise, create the stack manually with Git and the standard `gh pr` commands below. Do not install the extension unless the user asks.
- Fetch `origin/main` and create the first stack branch directly from that remote-tracking branch. Never base the stack on local `main`, the current branch, or another remote. If `origin/main` does not exist, stop and notify the user.
- In both modes, the first PR must target `main`. Each later branch must start from the previous layer's branch, and its PR must target that previous branch, not `main`. Record each layer's branch, base branch, and PR URL.
- Treat bot PRs as leads, not as sources of truth for target versions.
- Put dependencies that must remain compatible in the same PR.
- Put major application and build dependency updates in one PR. Commit each dependency separately when the upgrades do not require a shared change.
- Give a major update its own PR at the top of the stack only when it has very high concrete risk or requires changes across many parts of the codebase.
- Put all GitHub Actions updates in one PR at the bottom of the stack.
- Put all Docker image updates in one separate major-change PR.
- Put compatible application, build, and transitive-only dependency patch and minor updates in one PR unless a meaningful breaking change makes that unsafe to review or validate.
- Complete the `fyllut-dependency-upgrade` workflow for each layer, including required checks, before adding the next layer.
- Do not merge the stack unless the user asks.

## Inventory the repository

Start from the target repository and:

1. Follow `fyllut-dependency-upgrade` repository inspection rules across every dependency source in the repository.
2. Query open Dependabot or Renovate PRs and inspect their diffs.
3. Build a current-version inventory from manifests, lockfiles, Docker files, Compose files, and workflow action references.
4. Re-query registries and upstream releases to find eligible targets.
5. Record the package family, update type, expected risk, and bot PR coverage for every direct update and every eligible transitive-only update found in a bot PR.

Do not copy stale bot targets. Include eligible direct updates even when no bot PR exists.

Eligible transitive-only bot updates are part of the stack scope. A targeted
direct dependency upgrade may leave an older transitive version in the lockfile
when the ancestor still declares the same compatible range. Do not assume the
package manager refreshed that path just because its ancestor was upgraded.
Explicitly update the transitive package through the package manager, then
include any sibling or child lockfile changes required by that exact dependency
path.

## Decide the stack

Use this order, omitting empty groups:

1. GitHub Actions
2. Compatible application, build, and transitive-only dependency patch and minor updates
3. Docker images and runtimes
4. Major application and build dependency updates
5. Any exceptional major update that needs its own PR

The major layer may exceed the three-direct-dependency limit in `fyllut-dependency-upgrade`. Keep dependencies that require each other in one commit. Otherwise, commit each dependency separately so reviewers can inspect and revert it without splitting the PR.

In the compatible patch and minor layer, commit independent transitive-only
updates separately from direct dependency updates. Group a transitive package
with its required sibling or child lockfile changes, and name the transitive
package in the commit. This makes lockfile-only bot replacements visible and
revertible.

Do not split a major update merely because it can upgrade independently. Split it only when the risk assessment identifies a very high-risk failure mode or the migration touches many different parts of the code. Put each exception above the grouped major layer and explain the decision in both PR descriptions.

Write the proposed order and a concrete risk assessment before editing. Name likely failures rather than assigning generic risk labels.

## Create the first layer

Confirm that `fyllut-dependency-upgrade` has completed its clean-worktree check, then verify the required base:

```bash
git fetch origin main
git rev-parse --verify origin/main
```

With the extension:

```bash
git switch --detach origin/main
gh stack init --base main <first-branch>
```

Without the extension:

```bash
git switch --create <first-branch> origin/main
```

Apply the first group's upgrade by following `fyllut-dependency-upgrade`. Stay on the branch created above instead of creating a standalone branch.

With the extension, submit with:

```bash
gh stack submit --auto --open
```

Replace the generated PR body with the description required by `fyllut-dependency-upgrade`.

Without the extension, push the branch and create the PR with an explicit base and head. Use the title and body required by `fyllut-dependency-upgrade`:

```bash
git push --set-upstream origin <first-branch>
gh pr create --base main --head <first-branch> --title <title> --body-file <pr-body-file>
```

In either mode, verify the PR's `baseRefName` and `headRefName` with `gh pr view <pr-url> --json baseRefName,headRefName,url`. Do not add another layer until that skill's validation and check-watching steps are complete.

## Add each remaining layer

For every remaining group:

1. Add a branch from the current stack top. With the extension:

   ```bash
   gh stack add <next-branch>
   ```

   Without the extension, use the recorded branch of the previous layer:

   ```bash
   git switch --create <next-branch> <previous-branch>
   ```

2. Follow the full `fyllut-dependency-upgrade` workflow for that group. Use the stack branch instead of creating a standalone branch.
3. In the grouped major layer, commit each independent dependency separately when possible. Keep required migration changes in the commit for the dependency that caused them.
4. With the extension, submit with `gh stack submit --auto --open` and replace the generated PR body. Without it, push and create the PR targeting the previous layer's branch, using the required title and body:

   ```bash
   git push --set-upstream origin <next-branch>
   gh pr create --base <previous-branch> --head <next-branch> --title <title> --body-file <pr-body-file>
   ```

5. Verify the PR's base and head with `gh pr view <pr-url> --json baseRefName,headRefName,url`. Record the new layer and, in manual mode, add links to the preceding and following PRs in their descriptions as the stack grows. Preserve the required upgrade descriptions.
6. Finish validation and required checks before adding another layer.

The stack inventory may contain many updates. The grouped major layer, patch and minor layer, and GitHub Actions layer are review categories for a periodic repository-wide upgrade, so they may contain more than three direct dependency updates.

## Replace bot PRs

Close a bot PR only after the passing replacement stack covers its complete dependency group. Leave a short comment linking the replacement PR or stack.

Never close an unrelated or partly superseded bot PR. A grouped bot PR remains useful when the stack upgrades only some of its dependencies.

Perform the final bot PR assessment against the lockfile and manifests at the
top of the passing stack, not against `main` or an earlier stack layer.

For every open bot PR:

1. Inspect its manifest and lockfile diff. Record every direct dependency,
   transitive dependency, action, image, runtime, and ancestor dependency that
   it changes.
2. Trace lockfile updates by dependency path and ancestry, not by package name
   alone. The same package may remain at an older version under an unrelated
   dependency tree.
3. Mark a changed item as covered when the top stack has an equal or newer
   eligible version at the corresponding path, or when an ancestor upgrade
   removes that dependency path entirely.
4. Mark the PR as partly superseded when any changed item remains below its
   requested version or was intentionally deferred. Keep that PR open.
5. After all stack checks pass, re-query open bot PRs and close every PR whose
   complete set of changed items is covered. Include transitive-only and
   security update PRs; do not limit cleanup to direct dependencies.

Do not treat a lower version elsewhere in the lockfile as evidence that the bot
PR is still needed when the exact dependency path it targeted no longer exists.
Conversely, do not close a grouped PR merely because its direct ancestor was
upgraded if one of its requested transitive updates is still missing.

## Finish

With the extension, inspect stack order with `gh stack view`. In both modes, verify every layer against the recorded order using `gh pr view <pr-url> --json baseRefName,headRefName,url`. The first base must be `main`; every later base must equal the preceding PR's head branch. Correct any mismatch before finishing. Confirm every required check passes.

Report:

- stack order with PR links
- one direct GitHub link to the stack
- versions covered by each PR
- migration risks and decisions from each PR
- local and GitHub check results
- bot PRs closed as superseded
- dependencies left unchanged and why
- versions deferred by the eligibility rules in `fyllut-dependency-upgrade`

End with the canonical stack URL when GitHub exposes one. Otherwise, use the top PR as the stack entry point.
