---
name: fyllut-follow-up-issue
description: Draft or create a scoped GitHub follow-up issue for work discovered during another issue, incident, review, or investigation. Use when the user wants to track deferred work, record a quick win, or turn a finding into a follow-up ticket without implementing it.
license: MIT
metadata:
  version: "0.1.0"
---

# Draft: create a follow-up issue

Record deferred work so another developer can pick it up without the original
agent conversation. This skill is a draft for team review. It does not authorize
implementation, a release, or changes to the work that revealed the finding.

## Confirm intent and ownership

1. Distinguish drafting from publishing. Create an issue only when the user
   explicitly asks to create one. If they ask for suggestions or a draft, keep
   it in the conversation. Approval for one issue does not authorize additional
   issues, parent comments, assignments, or project/priority changes.
2. Read workspace and repository guidance. Find local repositories from the
   workspace and verify their GitHub remotes. Put the issue in the repository
   that owns the behavior, not necessarily where an error was logged.
3. State the finding and why it belongs outside the current task. Do not defer a
   prerequisite for the current task without agreement. Ask a focused question
   if ownership or scope cannot be established from the available context.
4. Search open and closed issues by behavior, affected component, and relevant
   error terms. Include likely sibling repositories when the finding crosses
   service boundaries. Read likely matches. If an existing issue covers the
   work, link it and ask before updating or reopening it instead of creating a
   duplicate. Keep distinct work in separate, cross-linked issues when needed.
5. Check the target repository's issue templates and labels. Use its language
   conventions; otherwise use the user's language. Load `klarsprak` before
   writing the title and body. Keep this workflow separate from implementing a
   bugfix or writing a full specification.

## Write the issue

Use a short, action-oriented title that names the affected behavior. Describe
the problem and desired outcome without prescribing an unverified solution.
Use the repository template when one exists; otherwise start with this outline.
Always retain origin, confirmed facts, hypotheses, open questions, scope, and
acceptance criteria. Map them into the template or add missing sections.

```markdown
## Problem and impact
What happens, who or what is affected, and what should improve?

## Origin
Discovered while working on <issue, PR, or incident link>.
Explain why this work is separate from the original task.

## Evidence and uncertainty
Confirmed observations, relevant source/test links, and reproduction steps
when available. Separate hypotheses and open questions from facts.

## Scope
What this issue covers, what it excludes, and known dependencies.

## Acceptance criteria
- [ ] An observable outcome and how to verify it.
- [ ] Relevant regression coverage, or investigation outputs for a research task.
```

- Link the originating issue or PR with a full URL for cross-repository work.
  If there is no durable source link, summarize the original task or incident
  and say that no linked parent issue exists. Never invent a parent or rely on
  a private agent-session link as the only context.
- Include dates, timezone, environment, and a bounded time window for incident
  evidence. Link source at a verified commit when possible. Record unavailable
  evidence as a limitation, not proof that nothing happened.
- Include only the evidence needed to resume the work. Do not paste entire
  conversations, raw logs/traces, full source files, secrets, or personal data.
  Sanitize diagnostic excerpts and check that linked material is appropriate
  for the target repository's visibility. Do not publish sensitive security
  findings through this workflow; ask about the approved reporting channel.
- A confirmed root cause is not required for an investigation issue. In that
  case, make the expected investigation outputs explicit instead of promising
  a fix based on a hypothesis. Do not invent reproduction steps, effort
  estimates, or deadlines.
- Keep the body proportional to the task. A small refactor needs less context
  than an incident follow-up. Remove empty headings and unresolved placeholders.

## Choose labels independently

| Label | Apply when |
| --- | --- |
| `follow-up` | The work was discovered during another task, incident, review, or investigation. Include its origin in the body. |
| `quick-win` | The change is small, understood, independently deliverable, low risk, and easy to verify. All conditions must hold. |

These labels describe origin and suitability, not priority or who wrote the
issue. An issue can have both, either, or neither. Use `follow-up` for an incident
follow-up with unknown root cause; do not call it a `quick-win`.

Unresolved business behavior, security-sensitive changes, uncertain publication
outcomes, or cross-service coordination disqualify `quick-win`. Do not infer it
from a short description or a guessed implementation time. Use `ready-for-agent`
only if it exists and its repository-specific readiness criteria are met; it is
not implied by either label. Do not introduce an `agent-created` label.

Read label descriptions and reuse exact existing names when their meaning
matches. Do not silently create, rename, or redefine labels. If a suitable label
is missing, propose its name and description and ask permission to create it.
If issue creation is already authorized, the issue may be created without the
missing label; report the pending label choice. Label creation permission applies
only to the agreed repository and labels, not to other team repositories.

## Publish and verify

1. Before publishing, check authorization, target repository, duplicates, scope,
   source links, acceptance criteria, labels, and sensitive content. If creation
   was explicitly requested and scope is clear, do not ask for approval again.
2. Use an available GitHub tool or `gh issue create` with an explicit repository.
   Pass the body as data, such as `--body-file` with a quoted heredoc, rather than
   interpolating issue text into shell commands. Do not bypass sandbox guards.
3. If publishing fails or its result is uncertain, look up whether the issue
   exists before retrying. Report blocked operations and keep the draft in the
   conversation when publication is not possible.
4. Read the created issue back. Verify the repository, rendered body, links, and
   applied labels. Report its URL, actual labels, and any pending decisions.
   Do not report a draft as published or start implementing the issue.
