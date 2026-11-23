---
name: fyllut-sendinn-specification
description: Use when a human explicitly invokes /fyllut-sendinn-specification to specify the behavior of a change, an epic or one slice of an epic before it is built.
disable-model-invocation: true
license: MIT
metadata:
  version: "1.0.0"
---

# Fyllut-Sendinn specification

Write a functional specification together with the user, usually published
as one GitHub issue. The specification says what the product must do and why. It does
not say how to build it.

Write for developers, designers and functional architects. The issue must work
whether a person or an agent implements it, in a frontend or a backend
repository.

## Choose the kind of specification

Infer the kind from the prompt. Ask only when it is unclear. If the prompt
does not say what to specify, ask only: "What do you want to specify?" Never
tell the user which skills or files you loaded.

- **Change.** The default. One issue that specifies the whole change.
- **Epic.** The prompt asks for an epic. Specify the background, goal, scope
  and delivery plan. Give each slice a short title and leave its detailed
  behavior to a later slice specification.
- **Slice.** The prompt names a parent issue and one of its slices. Read the
  parent issue and treat its background, scope and decisions as settled. Do
  not ask about them again. Specify only the named slice. If the slice
  conflicts with the parent issue, ask before you continue.

Create epics only when the user asks for one. When you publish a slice
specification, link it to its parent issue as described under "Approve and
create issue".

## Before you ask

- Follow the repository instructions and load the repository skills that apply
  to the change. Treat their defaults as settled, for example accessibility,
  validation, error handling, security and testing. Do not ask about them and
  do not repeat them in the specification.
- Find facts yourself in code, tests, documentation and issues. Do not ask the
  user for facts the tools can find.
- Search open and closed issues for the same behavior. If an issue already
  covers it, link it and ask whether to continue.
- Use the research to ask better questions. Do not copy it into the
  specification.

## Interview

1. Summarize the problem, the affected users, the outcome and the boundary.
   Ask the user to correct the summary.
2. Ask the remaining questions in rounds. A round holds every open decision
   that does not depend on another open decision. When the user has answered
   the whole round, ask the questions those answers unlocked.
3. In the first question of each round, list the facts your research settled,
   so the user can correct a wrong finding before it becomes a decision.

Each question holds one decision. Explain in one sentence why it matters and
give a recommendation with a short reason. Use the client's question tool,
with one question and one field per call. Without a question tool, ask one
question in the conversation and wait for the answer.

```md
**Round <n> · Q<n>: <title>**

<Why this decision matters, in one sentence.>
*Recommendation: <choice and reason>*
```

Number the questions continuously across rounds.

Show the context and recommendation once and the question once. When the
question tool has a separate question text, put the question only there and
not in the context as well. When it has a short header or label, use it only
for `Round <n> · Q<n>`.

Keep confirmation questions short, such as "Anything to correct?" or
"Anything missing?". Do not tell the user what to type. A blank answer means
the user confirms and has nothing to add. So does a declined question.

Ask about behavior the user, a caseworker or a receiving system can observe.
Do not ask the user to choose components, APIs, schemas, storage or other
implementation details. When the prompt proposes a solution, first establish
who needs it, what they cannot do today and what success looks like. Treat the
proposed solution as context, not as a requirement.

Look for decisions and risks the user may not have thought of, even when they
are hard to answer this early. Every decision question offers **Decide
later** as a choice. Record a deferred decision under "Open questions and
dependencies"
with what it affects and when it must be decided at the latest, for example
before a given slice starts. Do not ask it again in this interview. When
research, user testing, policy or another person must decide, also record who
decides.

Always consider whether the work can be split into slices that can be merged
to `main` separately. When it has natural parts, propose a delivery plan as a
question with a recommendation. When the work has more than one slice, ask
what users see between slices. Each slice is merged to `main` on its own, so
a slice is either released when it is merged or kept hidden until a later
slice is ready.

Pick questions from the [question bank](references/functional-discovery-question-bank.md)
that matter for this change.

The interview is done when every decision the implementer would otherwise have
to guess is either answered or recorded as an open question. Then ask whether
a user, rule or situation is missing.

## Write the specification

Load `fyllut-unslop` before you write. Write in English.

Keep the specification focused on this task:

- Include only what someone needs to build and verify this change.
- Describe behavior as the user, a caseworker or a receiving system observes it.
- Do not include file paths, code, architecture or general information about
  the codebase.
- Mention accessibility, security or privacy only when this change needs
  something beyond the repository defaults.
- Leave out optional sections that do not apply.
- Use one term for each thing, and keep it throughout.
- Write each acceptance criterion so a person can verify it by using the
  product or by checking what a receiving system gets.
- Do not include secrets, personal data, conversation transcripts or raw logs.

Use this structure:

```md
# <Outcome-oriented title>

## Background
<Who is affected, what happens today and why it is a problem.>

## Goal
<What must be possible afterwards.>

## Scope
### Changes
- <What this issue changes.>

### Does not change
- <What is left out or must stay as it is.>

## Behavior
1. <One rule or step in plain language.>

## Special cases
| Situation | What should happen |
| --- | --- |
| <situation> | <behavior> |

## Open questions and dependencies
- <Question or dependency, what it affects, who decides and when it must be
  decided.>

## Acceptance criteria
- <Observable outcome>

## Delivery plan
**Phase 1**
- [ ] <What the slice makes possible>

**Phase 2: in parallel, after phase 1**
- [ ] <What the slice makes possible>
- [ ] <What the slice makes possible>

**Phase 3: after phase 2**
- [ ] <What the slice makes possible>

<What users see between slices, and which slices stay hidden until a later
slice is ready.>
```

"Does not change", "Special cases" and "Open questions and dependencies" are
optional. Include "Delivery plan" only when the work has more than one slice.

Write each behavior rule as a plain sentence that a designer can check against
a sketch and a developer can test. For example: "When the user answers No, the
question about income is hidden." Number the rules 1, 2, 3, without prefixes
such as FR-1.

"Special cases" covers situations that break the normal flow, described as the
user or a caseworker experiences them. For example: the user uploads a file
that is too large, the address lookup finds no address, or the receiving
system is unavailable when the user submits.

### Delivery plan and slices

- Prefer slices that change behavior someone can observe, such as "the field
  is shown as read-only".
- A slice can also be technical preparation, such as setting up a new package.
  Find out from your research whether it is needed, and propose it yourself
  instead of asking. Describe what it makes possible.
- Each slice can be merged to `main` on its own without breaking existing
  behavior.
- Split only where it lets the work reach `main` earlier or lets people work
  in parallel.
- The delivery plan is a checklist for working through the issue, and it
  shows where to start. Write each slice as a checkbox item with a short
  title that also works as an issue title. The user may convert a slice to a
  sub-issue, but does not have to.
- Group slices into phases. Slices in the same phase can run in parallel.
  Each phase starts when the phase before it is merged. Use a single slice in
  a phase when nothing can run beside it.
- Only slices are checkbox items. Always write the acceptance criteria as
  plain bullets, so they cannot be confused with slices.
- Keep the full acceptance criteria in the issue, even when it has a delivery
  plan. Name the slice in a criterion when that helps the reader. A slice that
  later gets its own slice specification gets its own criteria there.

### Epics and slices of an epic

- An **epic** has Background, Goal, Scope, Open questions and dependencies and
  Delivery plan. Leave out Behavior and Special cases. Acceptance criteria are
  optional and cover only the overall outcome.
- A **slice** starts its body with `Part of <link to the parent issue>.`
  Summarize the parent's background in one sentence instead of repeating it.

## Approve and publish

Before you show the draft, check that every behavior rule has an acceptance
criterion, that every open question says when it must be decided, and that
facts, decisions and open questions are kept apart.

Show the complete draft and offer four choices in one question:

- **Approve and create issue**
- **Revise**
- **Discard**
- **Other**, where the user describes what to do instead, for example
  "replace the body of #123" or "save it as a Markdown file".

**Approve and create issue** approves the draft. So does **Other** when the
user asks to publish it some other way. If **Other** changes the content,
treat it as a revision. After a revision, show the complete draft and the
same four choices again.

### Approve and create issue

1. Find the target repository in the workspace and verify its GitHub remote.
   Ask when more than one repository fits.
2. If the repository requires an issue template, add the fields it requires.
   Add labels only when the user asks for them or a label's description
   clearly matches.
3. Use the draft's `#` heading as the issue title and leave it out of the
   body. Write the rest of the approved draft to a temporary file and run
   `gh issue create --repo <owner>/<repo> --title <title> --body-file <file>`.
4. Remove the temporary file.
5. Read the issue back and return its URL.

For a slice, also link the new issue to its parent issue:

1. Add it as a sub-issue of the parent:
   `gh api -X POST repos/<parent-owner>/<parent-repo>/issues/<parent>/sub_issues -F sub_issue_id=<id>`.
   `<id>` is the new issue's `id` from `gh api repos/<owner>/<repo>/issues/<number>`,
   not its number.
2. In the parent's delivery plan, replace the text of the slice's checkbox
   with a reference to the new issue, such as `- [ ] #123`. Use
   `<owner>/<repo>#123` when the issues are in different repositories. Change
   nothing else in the parent issue. GitHub then shows the issue title and
   ticks the checkbox when the issue is closed.
3. Read both issues back. If you cannot find the slice's checkbox, say so and
   leave the delivery plan as it is.

Create at most one issue.

### Discard

Do not create or change anything. Say that the draft was discarded.

### Other

Do what the user describes and nothing more. To replace an existing issue,
read it first, then run `gh issue edit <number> --repo <owner>/<repo>
--body-file <file>` with the draft minus its `#` heading. Change the title
only when the user asks. Read the issue back and return its URL. For a file,
write it where the user says and return the path.
