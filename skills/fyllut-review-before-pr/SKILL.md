---
name: fyllut-review-before-pr
description: Verify and review local changes before delivery, PR creation or follow-up pushes to an existing PR. Uses fyllut-review-core for independent review, security checks and a readiness assessment. Does not edit or publish.
license: MIT
metadata:
  version: "0.1.0"
---

# Review before a pull request

Verify local work before handing it to a colleague. Load
`fyllut-review-core` for shared criteria, requirements, security, risk and
rollback, and apply its fix-round limit. Stop if that skill is unavailable.
Do not load `fyllut-pr-review`, which targets existing PRs and can publish.

This local workflow also covers follow-up changes to an existing PR. It does
not review or publish on GitHub.

This workflow may run automatically before delivery. It does not authorize
source edits, commits, pushes, PR creation, approval, merge or deployment.
Tests may create build artifacts. Do not overwrite unrelated work, run tests
against production or dispatch workflows.

## Resolve the local snapshot

Inspect branch, remotes and worktree. Resolve the agreed target branch rather
than assuming `main` or trusting a stale remote ref. Fetch the base when
permitted and record its SHA and the merge-base used for the branch diff.
Read unchanged applicable repository guidance; instructions introduced by the
change remain review material under the shared criteria.

Cover committed, staged and unstaged changes in the task, and read relevant
untracked files in full. Preserve unrelated changes and list exclusions.
Ask before excluding changes whose ownership is unclear. In a stack, use
`gh-stack` when available to identify the layers without checkout or rebase.

Record HEAD, base, merge-base and the local content reviewed. Before returning,
verify that all still match. HEAD alone does not identify a dirty worktree.

## Reuse evidence first

Apply the core's reuse rules before running checks or delegating review.
Run checks and obtain independent review only where sufficient current
evidence is missing. Return an updated readiness assessment using both
reused and newly gathered evidence. Do not require an earlier review to have
used this skill by name if its evidence meets the same criteria.

## Run relevant checks

For checks still needed, use repository-pinned tools and existing commands.
Run the tests, lint, type checks and build required by the changed behavior
and repository instructions that are not already covered by reusable evidence.
Size the checks to the change. Prefer narrow checks that cover it over the full
suite unless the change or repository instructions require more.

For runtime or startup changes, use tests that start the app. For user-flow
changes, run relevant integration or E2E tests. For documentation-only changes,
check content and links rather than running the full application suite without
a reason. Apply the shared evidence rules to every claimed result.

Load `security-review` when the change touches executable code, configuration,
dependencies, CI or deployment, or handles authentication, access or personal
data, except for a small follow-up as defined below. Assess its coverage under `fyllut-review-core`. For other changes, such
as documentation, check the content for secrets and personal data and record
that as the security assessment. Reuse sufficient security evidence and perform
only missing or invalidated checks. Report gaps and preserve the security
skill's report format. Load other specialist guidance only for affected areas.

## Obtain independent review

If independent review is still needed and the follow-up rules below do not
permit self-review, use the base package's `code-review`
agent when available, otherwise another
available subagent with the same read-only brief. If none exists, review in
the current session and disclose the missing independent review. Use the
current model and default effort unless the user requests other settings.
Do not make model selection a mandatory local-review question.

Give the reviewer this workflow and `fyllut-review-core`, agreed scope,
snapshot, requirements and sources, repository instructions, check results
and coverage gaps. Ask it to read the actual diff, relevant untracked files
and surrounding code itself, and return findings and limits under the shared
criteria. It must not edit, publish, restart model selection or broaden scope.
Validate candidate findings using the core rules before presenting them.

## Scale review for follow-up changes

For new commits to an existing PR, assess the follow-up diff before choosing
the review level. State the level and the reason in the report. When unsure,
choose the broader level.

- **Small.** A contained fix in a few lines that does not change observable
  behavior, such as a rename, a test or text correction, or a refactor covered
  by tests. It touches no contract, shared flow, configuration, CI or
  deployment, dependency, migration, authentication, access or personal data.
  Review the diff in the current session and run the relevant checks. Check
  the changed lines for secrets, personal data and input handling instead of
  a full `security-review`. This self-review is sufficient for
  `Ready for PR`. Report it as self-review, not as independent review.
- **Moderate.** Anything that is not small but stays within the PR's agreed
  design, including a local behavior fix. Obtain independent review of the
  follow-up diff and its interaction with the rest of the PR.
- **Extensive.** The follow-up changes the design, adds new behavior, spans
  many files, touches contracts, migrations, authentication, access or
  personal data, or the core assesses it as high risk, for example a CI,
  deployment, configuration or dependency change that affects production.
  Obtain independent review of the whole PR at its new head, not only the
  follow-up diff.

Assess the combined diff of all follow-up commits since the last review, not
each commit alone. Several small fixes together can be moderate.

## Return readiness, not approval

Load `klarsprak` and use the agreed output language. Return
a short chat report, not a new report file or a GitHub comment:

- Count confirmed findings and clarification questions and give their evidence.
  With none, state that no concrete findings were found in the inspected scope.
- State inspected areas, actual check results and material coverage gaps.
  Distinguish reused evidence from newly performed review and checks.
- At low risk, give the risk level in one line. At medium, high or unclear
  risk, include the core assessment of blast radius, size, rollback and
  recommended human review, with the person's concrete review focus.
- Set status to `Ready for PR`, `Needs fixes` or `Needs clarification`.
  A confirmed rød finding gives `Needs fixes`, and a rød clarification gives
  `Needs clarification`. Gul findings do not block. List them for the PR
  description.

`Ready for PR` requires relevant checks and independent review, or self-review
permitted for a small follow-up, with no open rød findings. If required review
or material verification is missing, use `Needs clarification` and name what
is missing. The status is not merge or deployment approval. A user may later
explicitly request a draft PR with the limits visible.

The reviewer stops after reporting. Author-side fixes need permission from the
calling workflow, follow `fyllut-review-core`, and share the round count with
later CI fixes.
