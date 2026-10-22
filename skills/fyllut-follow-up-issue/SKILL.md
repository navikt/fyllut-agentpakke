---
name: fyllut-follow-up-issue
description: Create a GitHub follow-up issue for work discovered during another task or incident. Use only when a human explicitly invokes this skill.
disable-model-invocation: true
license: MIT
metadata:
  version: "0.1.0"
---

# Create a follow-up issue

Use this skill only when a human explicitly invokes it. Create an issue only
when they ask for one. Do not implement it or create additional issues
without permission.

## Check the repository

1. Read workspace and repository guidance. Find local repositories in the
   workspace and verify their GitHub remotes. Choose the repository that owns
   the behavior, not necessarily where an error was logged.
2. Search open and closed issues for the behavior and affected component.
   Include relevant sibling repositories for cross-service work. If an issue
   already covers the work, link it and ask before updating or reopening it.
3. Check issue templates and label descriptions. Follow the repository's language
   conventions, or use the user's language if none exist. Load `klarsprak` before
   writing. Ask if ownership or scope is unclear. Do not postpone work the
   current task needs unless the user agrees.

## Write the issue

Name the affected behavior and desired outcome in the title. Use the repository
template if available. Keep the following information, adding missing sections.

```markdown
## Problem and impact
What happens, who or what is affected, and what should improve?

## Origin
Link the original issue, PR, or incident. In one or two sentences at most,
explain where the finding came from and why it is a separate task.

## Evidence and uncertainty
State confirmed observations, source/test links, and known reproduction steps.
Separate facts from hypotheses and open questions.

## Scope
What this issue covers, what it excludes, and known dependencies.

## Acceptance criteria
- [ ] An observable outcome and how to verify it.
- [ ] Regression coverage, or expected findings for an investigation.
```

- Use full URLs for cross-repository links. If no source link exists, say so
  within the one- or two-sentence Origin section. Do not invent a parent issue
  or rely on a private agent conversation for context.
- For incidents, include the date, timezone, environment, and time window.
  Missing evidence does not prove that nothing happened. An investigation
  does not require a confirmed root cause. State what it should establish.
- Include only what someone needs to resume the work. Remove empty headings and
  placeholders. Do not invent reproduction steps, effort estimates, or deadlines.
- Do not include secrets, personal data, whole conversations, or raw logs/traces.
  Sanitize excerpts and check linked material against repository visibility.
  For sensitive security findings, ask about the approved reporting channel
  instead of publishing an issue.

## Choose labels independently

| Label | Apply when |
| --- | --- |
| `follow-up` | The work was discovered during another task or incident. |
| `quick-win` | The change is small, understood, independently deliverable, low risk, and easy to verify. All conditions must hold. |

An issue can have both labels, either, or neither. They do not indicate priority
or who wrote the issue. Unknown root cause, unresolved business behavior,
security-sensitive changes, uncertain publication outcomes, or cross-service
coordination rule out `quick-win`.

Reuse existing labels with matching meanings. Ask before creating, renaming, or
redefining labels. Permission applies only to the agreed repository. If a label
is missing, create the authorized issue without it and report the missing label.
`ready-for-agent` requires the repository's own readiness criteria, regardless
of these labels.

## Publish and verify

1. Check permission, repository, duplicates, content, and labels. If creation was
   requested and scope is clear, do not ask for approval again.
2. Use a GitHub tool or `gh issue create` with an explicit repository. Pass the
   body as data, such as `--body-file` with a quoted heredoc. Do not interpolate
   issue text into shell commands or bypass sandbox guards.
3. If the result is uncertain, check whether the issue exists before retrying.
   Report blocked operations without claiming that publication succeeded.
4. Read the created issue back and verify its body, links, and labels. Report the
   URL, applied labels, and pending decisions. Do not change parent issues,
   assignments, projects, or priorities without permission.
