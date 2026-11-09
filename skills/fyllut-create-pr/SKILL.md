---
name: fyllut-create-pr
description: Draft PR text or create a PR with local verification and review. Reuses existing review evidence. Publishes only when requested.
license: MIT
metadata:
  version: "0.1.0"
---

# Create a pull request

## Choose review mode first

Choose whether to review and fix before proceeding.

- **Explicit invocation.** The current message calls `/fyllut-create-pr` or
  names it, for example "bruk fyllut-create-pr". Ask one
  question with these choices, and recommend the first. Use an available
  question tool.

  1. Review and report findings. Do not edit code.
  2. Review and fix findings.
  3. No review, under the exception below.

  Skip if already chosen. Omit choice 3 if required delivery review is
  outstanding. Earlier mentions do not count as invocation.
- **Part of a task.** You changed the code in this conversation because the
  user asked you to, and the PR completes that work. Includes
  «implement X, commit, push and create a PR», later PR requests for that work,
  and task skills loading this one. Fix verified
  findings within the task's scope without asking. Ask before out-of-scope fixes,
  or before editing changes you did not make in this conversation.
- **Any other start.** Report findings and do not edit code.

Outside explicit invocation, always review. Explain this restriction if asked
to skip. Pass the mode to subagents. Without a
mode, the subagent reports findings without editing.

If unsure which case applies, review and report findings without editing.

Apply the same readiness criteria to human-written, agent-written and mixed changes,
without requiring a preceding agent implementation session.

## Permission and target

- Draft-text requests permit no commits, pushes or GitHub writes. PR creation
  requests permit necessary commits and pushes of agreed changes, including
  invocation of task skills that deliver PRs. Respect no-commit or no-push limits.
- Resolve repo, base and included changes. Read repo guidance and PR templates,
  including `.github/PULL_REQUEST_TEMPLATE/`. Required fields override this format.
- Inspect worktree, remotes and branch. Preserve unrelated work. Never clean up
  with `git add .`, stash, reset or force push. Stop for unclear scope or wrong
  branch; never publish trunk.
- Check automatic production deploy or package publication on push or PR creation.
  Explain and obtain explicit permission for those effects. A PR request alone
  does not permit production deploy.
- For stacks, load available `gh-stack`, preserve the agreed base and publish
  only approved layers. Whole-stack push or submit needs whole-stack permission.

Never approve, auto-merge, merge, release, deploy, dispatch workflows or close
other PRs. Stricter caller and repo rules apply.

## Review by default

Use `fyllut-review-before-pr`, which loads `fyllut-review-core`, unless the user
chose the exception below. In default mode, stop publication if either dependency
is unavailable.
Reuse sufficient current evidence under core rules, including checks, security,
risk, blast radius, rollback and human-review recommendations. Run local review
only for missing or invalidated coverage, not to rewrite its report as PR text.

## Handle findings

A PR request alone never permits code changes. Fix findings only when the
review mode permits it. Continuation prompts, tool approvals and silence are
not approval. Separate auth and personal-data approval gates still apply.

Without fix permission, show findings and ask to fix, publish a draft showing
them, or stop. Approval covers listed findings only; ask again for new ones.

Rød findings block a ready PR. Gul findings do not block. Fix when permitted
or list under Verification. Known blockers and material test gaps require an
explicitly requested draft showing those limits.

## Explicit exception for agent review

The exception applies only when the user invoked this skill explicitly and
chose no review, in the question or invocation. Never infer it from urgency or
missing tools, or extend it beyond requested scope.

Skip new systematic agent code and security review for PR creation.
Do not invoke `fyllut-review-before-pr` or launch review subagents for that
purpose, directly or indirectly. Load `fyllut-review-core` only for evidence
and privacy rules; stop if unavailable. Reuse available evidence honestly.

The exception does not waive mandatory repository or caller checks, tests,
security scans, human approvals or implementation-delivery requirements.
Explain conflicts and stop rather than bypass controls. It permits no source
fixes and waives neither blockers, CI nor publication or production-deploy gates.

PR creation from existing changes is not new implementation delivery. If you
changed source in an implementation task, complete its outstanding delivery
review or stop and explain. The exception skips an additional PR-creation review, not that delivery requirement.
Reuse the completed implementation review.

Read the diff for description and scope, not bug or security review. Use known
intent, test results with sources and limits, affected flows and rollback facts.
Mark unreviewed risk and blast radius as preliminary, unknown parts as unassessed.
No findings does not imply low risk or production readiness.

Under the exception, always state the agent-review status under Verification.
Translate without changing meaning:

- If no agent review covers the change: "Agent-based code and security review
  was not performed, at the user's request."
- If earlier agent review is reused: "No new agent review was run, at the user's
  request. Earlier review of <scope and content> was reused."
- For partial coverage, name reviewed and unreviewed changes. Distinguish
  documented human review from agent review.

Skipping agent review alone does not force draft status if other gates pass.
Do not assign `Ready for PR` without required review evidence or present
human-review recommendations as completed approvals.

## Write a short description

Load `klarsprak`; also follow user-only `fyllut-unslop` if already loaded.
Use the agreed language. Aim for 150 to 250 words, fewer for simple changes.
Required security warnings, migration order, test gaps and task-skill content
have no word limit.

Start with one or two sentences on change and effect. Link issues or prerequisites;
use `Closes` only for completed issues, not partial stack layers. Include important
decisions and reasons, commands with results and covered behavior, and available
bugfix red-before-green evidence. Reuse reviewed risk, rollback and concrete
human-review recommendations, or the limited assessment and review-status
statement under the exception. Recommendations do not satisfy approvals.

Unless the repo requires another format, use this template in the agreed language:

```markdown
<Short description of the change and its effect.>

<Relevant issue or prerequisite, if any.>

## Decisions

<Important choice and reason. Omit this section if unnecessary.>

## Verification

- `<command>` passed and covers <behavior>.
- <Material limit or remaining test, if any.>
- <Open gul findings from the review, if any.>
- <Agent-review status. Required when the exception is used.>

## Risk and rollback

<Risk level, concrete reason and blast radius from the review.>
<Rollback and limits.>
<Recommended human review and focus.>
```

Keep simple assessments to a few sentences. Omit empty sections, unchanged-code
checklists, long logs, incident histories and repetition. Link details; keep
required task content without repeating it. Follow core evidence and privacy
rules. Report material pending PR-triggered CI. Do not require eval sets,
feature flags or image/video evidence.

## Publish and verify

Show title and description first. Do not repeat granted permission questions.
For draft text, stop without commits or GitHub writes. Otherwise:

1. Use available base `conventional-commit` and repo commit rules. Stage only
   agreed files. Read staged diff and check for hook changes to reviewed content.
2. Verify committed scope, description and included files; in default mode,
   also match reviewed content. New code or base changes require affected checks
   and updated text under the selected mode and mandatory controls. Do not
   silently start declined review.
3. Push to explicit remote and branch. Never bypass sandbox restrictions.
4. Find existing PRs by repo, head and base to avoid duplicates. Ask before
   editing one unless already authorized.
5. Use an available GitHub tool or repo-scoped `gh pr create` with explicit base,
   head, title and a temporary body file. For approved whole stacks, use
   `gh-stack` and check every description. Use draft status when agreed.
6. Read back URL, repo, base, head SHA, draft status and body. Resolve uncertain
   writes by reading state before retrying.
7. Follow required CI for the published head, base and trigger. Missing, pending
   or skipped checks are not passes. If unable to wait, report remaining work.

On CI failure, read the error and establish relevance. Fix only as Handle findings allows.
Follow core evidence and shared fix-round limits, including pre-publication rounds.
Before pushing new code, perform implementation-required local checks and review;
the PR exception does not waive them. When follow-up is requested, update the
description to actual head and results, including review status. Never dispatch
workflows to fill gaps without permission.

Finish with PR link, CI status and remaining human review or verification.
Do not repeat the description or equate green CI with production readiness.
