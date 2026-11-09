---
name: fyllut-review-before-pr
description: Use when local changes need verification and review before delivery, PR creation or a follow-up push to an existing PR.
license: MIT
metadata:
  version: "0.1.0"
---

# Review before a pull request

Load `fyllut-review-core` for criteria and fix-round limits. Stop if unavailable.
Do not load the publishing workflow `fyllut-pr-review`.
This workflow may run automatically, including for follow-ups to existing PRs.
It authorizes no source edits, commits, pushes, GitHub writes, approvals,
merges or deployments. Tests may create build artifacts, but must not overwrite
unrelated work, target production or dispatch workflows.

## Resolve the local snapshot

Inspect branch, remotes and worktree. Resolve the agreed target, not assumed
`main` or a stale ref. Fetch when permitted. Record HEAD, base SHA, merge-base
and reviewed local content; recheck all before returning. Read unchanged
applicable guidance; changed instructions remain review material.

Include task commits, staged and unstaged changes, and full relevant untracked
files. Preserve unrelated work and list exclusions. Ask about unclear ownership
before excluding changes. For stacks, use `gh-stack` when available to identify
layers without checkout or rebase.

## Reuse evidence first

Apply core reuse rules before checks or delegation. Fill only evidence gaps,
then update readiness. Earlier reviews need not name this skill if they meet
the same criteria.

## Run relevant checks

Run the tests, lint, type checks and build still required by changed behavior
and repository rules, using pinned tools and existing commands. Prefer narrow
coverage unless broader checks are required. Startup or runtime changes need
app-starting tests; user flows need relevant integration or E2E tests.
Documentation needs content and link checks, not an unjustified full app suite.

Load `security-review` for executable code, configuration, dependencies, CI,
deployment, auth, access or personal data, except small follow-ups below.
For other changes, record a secrets and personal-data content check. Reuse
sufficient evidence under the core rules. Report gaps, preserve the security
report format and load specialists only for affected areas.

## Obtain independent review

If independent review is still needed and self-review is not permitted below,
use the base `code-review` agent or another available subagent. If none exists,
self-review and disclose that limit. Use current model and default effort
unless requested otherwise; do not require a model-selection question.

Supply this workflow, `fyllut-review-core`, scope, snapshot, requirements and
sources, repo instructions, check results and gaps. Require the reviewer to
read the diff, relevant untracked files and surrounding code, then return
findings and limits. Forbid edits, publishing, model reselection and scope
expansion. Validate findings under core rules before presenting them.

## Scale review for follow-up changes

Assess all follow-up commits since the last review together, not individually.
State review level and reason. When unsure,
choose the broader level.

- **Small.** A few-line fix that does not change observable
  behavior, such as a rename, test or text correction, or tested refactor.
  Excludes contracts, shared flows, configuration, CI, deployment, dependencies,
  migrations, auth, access and personal data. Self-review and relevant checks
  suffice for `Ready for PR`. Check secrets, personal data and input handling
  instead of full `security-review`. Report self-review honestly.
- **Moderate.** Not small, but within the agreed design, including local behavior
  fixes. Independently review the follow-up and its interaction with the PR.
- **Extensive.** Changes design, adds behavior, spans many files, touches
  contracts, migrations, auth, access or personal data, or is high risk under
  core criteria, such as a CI,
  deployment, configuration or dependency change that affects production.
  Obtain independent review of the whole PR at its new head.

## Return readiness, not approval

Load `klarsprak`. Report briefly in chat in the agreed language, not in a file
or GitHub comment:

- Count confirmed findings and questions with evidence, or state no concrete
  findings in inspected scope. Name inspected areas, results and material gaps.
  Separate reused evidence from new checks and review.
- At low risk, give the risk level in one line. At medium, high or unclear
  risk, include core blast radius, size, rollback and recommended human review
  with concrete focus.
- Set status to `Ready for PR`, `Needs fixes` or `Needs clarification`.
  Confirmed rød findings mean `Needs fixes`; rød questions mean
  `Needs clarification`. Gul findings do not block; list them for the PR body.

`Ready for PR` requires checks, independent review or permitted small-follow-up
self-review, and no open rød findings. Missing required review or material
verification means `Needs clarification`; name the gaps. Readiness is not merge
or deploy approval. Users may explicitly request a draft PR showing the limits.

Stop after reporting. Author-side fixes need permission from the
calling workflow and follow core rules, sharing the round count with CI fixes.
