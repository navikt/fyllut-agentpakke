---
name: fyllut-create-pr
description: Draft a concise PR description or create a PR with local verification and review. Use for PR requests, push-and-PR requests or PR-text drafts. Reuses existing review evidence and publishes only when requested.
license: MIT
metadata:
  version: "0.1.0"
---

# Create a pull request

## Choose review mode first

Decide this before anything else.

- **Explicit invocation.** The user's current message starts this skill with
  `/fyllut-create-pr` or by name, for example «bruk fyllut-create-pr». Ask
  once whether to run agent review, and recommend review. Use the client's
  question tool if it has one. Skip the question if the user already chose,
  if current review evidence covers the change, or if a required delivery
  review is outstanding, as the exception below describes.
- **Any other start.** Always review. This covers PR requests that do not name
  the skill, loading by another skill or a subagent, and a skill name the user
  mentioned earlier in the conversation. If the user asks to skip review, say
  that the choice is offered only when the skill is invoked explicitly.

If unsure which case applies, always review.

## Purpose

Describe the actual change and the review evidence so a colleague can see
what still needs attention. Reuse the local review, not its entire report.

This workflow supports human-written, agent-written and mixed changes.
It does not require a preceding agent implementation session. Apply the
same readiness requirements regardless of who wrote the code.

## Permission and target

- A request for a draft or PR text does not authorize commits, pushes or
  GitHub writes. An explicit request to create a PR permits necessary commits
  and pushes of agreed changes. Invoking a task skill whose stated result is a
  PR counts as that request. Respect any prohibition on commit or push.
- Resolve repository, target branch and included changes. Read repository
  guidance and PR templates, including `.github/PULL_REQUEST_TEMPLATE/` when
  present. This skill's format does not override required fields.
- Inspect worktree, remotes and branch. Preserve unrelated changes. Do not use
  `git add .`, stash, reset or force push to clean up. Stop on unclear scope or
  the wrong branch instead of publishing trunk.
- Check whether push or PR creation triggers automatic production deployment
  or package publication. Explain that effect and obtain explicit permission
  for it before proceeding. A PR request alone does not permit production deploy.
- For stacks, load `gh-stack` when available and preserve the layer's agreed
  base. Permission for one layer does not cover publishing others. Do not use
  a command that pushes or submits the whole stack without that permission.

Never approve, enable auto-merge, merge, release, deploy, dispatch workflows or
close other PRs under this skill. Follow stricter caller and repository rules.

## Review by default

Use `fyllut-review-before-pr`, which loads `fyllut-review-core`, unless the user
chose to skip review under the exception below. In default mode, stop before
publication if either dependency is unavailable. First inspect existing review
evidence under the core's reuse rules. Reuse sufficient current evidence;
otherwise use the local workflow to perform only missing or invalidated review
and checks. Invoking the workflow does not require a new reviewer or test run
when coverage is already sufficient.

A request to create a PR does not authorize source-code fixes. Report findings
and ask before editing unless an existing implementation agreement already
authorizes those changes.

For any status other than `Ready for PR`, fix only within an approved
implementation task or ask the user how to proceed. Regardless of review mode,
do not publish a ready PR with known blockers or material test gaps. The user
may explicitly request a draft PR with those limits visible.

Reuse the review's check results, security report and core assessment of risk,
blast radius, rollback and human review. In default mode, if material evidence
is missing, return to local review rather than inventing it or running a second
review just to write the description.

## Explicit exception for agent review

The exception applies only when the user invoked this skill explicitly and
chose to skip review, either in answer to the question above or in the
invocation itself, for example «/fyllut-create-pr uten review». Never infer it
from urgency or treat missing review tools as an opt-out. The exception
applies only to the requested scope.

This skips new systematic agent-based code and security review for PR creation.
Do not invoke `fyllut-review-before-pr` or launch review subagents for an extra
PR-creation review, directly or indirectly. An outstanding required delivery
review is handled separately as described below. Load `fyllut-review-core`
for evidence and privacy rules, not to perform its review. Stop if that core
guidance is unavailable. Reuse available review and test evidence honestly.

The exception does not waive mandatory repository or caller checks, tests,
security scans, human approvals or requirements for delivering new source-code
changes. Explain any conflict and do not bypass the required control. It does
not authorize source fixes, waive known blockers or skip CI. Keep publication
and production-deployment permission gates unchanged.

Creating a PR from existing changes does not itself count as delivering a new
implementation. If you wrote or changed source code in an implementation task
and its required delivery review is still outstanding, complete that review
or stop and explain the unmet gate before publication. "Create the PR without
review" skips an additional PR-creation review, not that delivery requirement.
Reuse the completed implementation review instead of repeating it.

Read the diff to describe the change and verify publication scope. This
descriptive inspection is not a bug or security review. Describe decisions
only from known intent. Report tests actually run, with their source and limits.
Use known affected flows and rollback information; mark unreviewed risk and
blast-radius assessments as preliminary and unknown parts as unassessed.
Do not infer low risk or production readiness from the lack of findings.

Under the exception, always state the agent-review status under Verification
in the PR description. In default mode, follow the ordinary description format.
Translate these statements into the description's language without changing
their meaning:

- If no agent review covers the change: "Agent-based code and security review
  was not performed, at the user's request."
- If earlier agent review is reused: "No new agent review was run, at the user's
  request. Earlier review of <scope and content> was reused."
- If earlier review covers only part of the current change, state that scope
  and identify the changes that have not been agent-reviewed. Distinguish any
  documented human review from agent review.

Skipping agent review alone does not force draft status. A PR may be opened
for human review if no other gate prevents it. Do not assign the local
`Ready for PR` assessment when required review evidence is missing, and do not
present human review recommendations as completed approvals.

## Write a short description

Load `klarsprak` for the text. `fyllut-unslop` can only be invoked by the
user; follow it as well when it is already loaded. Follow the agreed output
language. Aim for 150 to 250 words for an ordinary PR, fewer for a simple
change. Necessary security warnings, migration order, test gaps and content
required by a task skill have no word limit.

Start with one or two sentences naming the change and its effect. Add detail
only when those sentences are not enough. Link the issue or prerequisite;
use `Closes` only when the PR completes the issue, not for a partial stack layer.

Include important decisions and why, leaving routine choices out. Group actual
verification commands with their results and covered behavior. For a bugfix,
include available red-before-green evidence briefly. Use the core risk and
rollback assessment from the review, including recommended human review and
its concrete focus. Under the explicit exception, use the limited assessment
and mandatory review-status statement described above. This recommendation
does not satisfy required approvals.

Use this format if the repository has no required alternative. Translate
headings and placeholders into the agreed output language:

```markdown
<Short description of the change and its effect.>

<Relevant issue or prerequisite, if any.>

## Decisions

<Important choice and reason. Omit this section if unnecessary.>

## Verification

- `<command>` passed and covers <behavior>.
- <Material limit or remaining test, if any.>
- <Agent-review status. Required when the exception is used.>

## Risk and rollback

<Risk level, concrete reason and blast radius from the review.>
<Rollback and limits.>
<Recommended human review and focus.>
```

For a simple change, the final assessment can be a few sentences. Omit empty
sections, unchanged-code checklists, long logs, full incident histories and
repeated caveats. Link existing details. Retain content required by a task
skill, such as version tables, sources or red-before-green proof, without
repeating it in prose.

Follow the core's evidence and privacy rules. PR-triggered CI may still be
pending before creation; say so when material. Do not add requirements for
eval sets, feature flags or image/video evidence in this workflow.

## Publish and verify

Show the title and description before publication. Do not ask again for
permission already given for this scope. For a draft-text request, stop here
without commits or GitHub writes.

When PR publication is requested:

1. Use the base package's `conventional-commit` when available and follow
   repository commit requirements. Stage only agreed files. Read the staged
   diff and check whether commit hooks changed reviewed content.
2. Check that committed content matches the agreed scope and description and
   no intended files were left behind. In default mode, also verify the match
   with reviewed content. New code or a changed base requires affected checks
   and an updated description; follow the selected review mode without silently
   starting a review the user declined. Mandatory controls still apply.
3. Push with explicit remote and target branch. Follow sandbox rules without
   bypassing blocked Git configuration or publication.
4. Check for an existing PR with the resolved repo, head and base. Avoid
   duplicates. Ask before editing an existing PR unless the request covers it.
5. Use an available GitHub tool or repository-scoped `gh pr create` with
   explicit base, head, title and a body file in the session's temporary
   directory. For an approved whole stack, follow `gh-stack` and check each
   generated description against this format. Use draft status when agreed.
6. Read the PR back and verify URL, repository, base, head SHA, draft status and
   body. After an uncertain write, read actual state before retrying.
7. Follow required CI on the published head. Check the workflows that actually
   run for that base and trigger. Missing, pending and skipped checks are not
   passing checks. If waiting is unavailable, report status and what remains.

On CI failure, read the job error and establish whether it concerns the change.
Fix only in approved scope and follow `fyllut-review-core` for evidence and the
shared fix-round limit, including rounds before publication. New code needs
local verification and review required by the implementation agreement before
another push. The PR exception does not waive those requirements. Update the
description to actual head and results when that follow-up is requested,
preserving accurate review-status wording. Do not dispatch a workflow to fill
a coverage gap without permission.

Finish with the PR link, current CI status and remaining human review or
verification. Do not repeat the description or call the code production-ready
because CI is green.
