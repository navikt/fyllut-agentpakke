---
name: fyllut-pr-review
description: Review one GitHub pull request, several pull requests, or every layer of a stacked PR without changing code, and post one Norwegian review comment per PR with findings sorted into rød, gul and grønn sone. Use when the user pastes a PR link, PR number, owner/repo#number, branch, or asks to review a stack.
license: MIT
metadata:
  version: "0.1.0"
---

# Review pull requests with zones

Review pull requests and report findings as one comment per PR. Sort every
finding into a zone so the author sees at once what needs a decision before
merge and what can wait.

This skill only reads code and writes comments. Never edit files, commit,
push, check out the PR branch in the user's worktree, approve, request
changes, merge, or enqueue. Use `fyllut-approve-github-stack` when the user
wants approvals, and `fyllut-pr-review-follow-up` when the author wants to
work through the comments.

## Zones

| Zone | Meaning | Typical findings |
| --- | --- | --- |
| 🔴 **Rød sone** | Må vurderes før merge. Forfatteren må enten rette det eller bevisst godta risikoen og skrive hvorfor. | Mulig feil i kjerneflyt, datatap, dobbel behandling, sikkerhet, auth, persondata, migreringer, endret kontrakt uten test, endring som går rett til prod uten verifisering. |
| 🟡 **Gul sone** | Bør vurderes, men blokkerer ikke. Kan tas i PR-en eller i en oppfølging. | Mangler i testdekning med lav risiko, vedlikeholdsgjeld, uklar dokumentasjon, ting som bør bekreftes i preprod, lokal utviklingsflyt. |
| 🟢 **Grønn sone** | Gjennomgått, ingen merknader. | Endringer som er korrekte og begrunnet. List kort hva som ble sjekket, så leseren ser dekningen. |

Rules for zoning:

- Rød sone is about consequence, not certainty. Use it when a plausible failure
  would be costly or silent, even if CI is green.
- Every rød and gul finding states the concrete file, symbol or config key,
  what can go wrong, and a suggested action or a question that resolves it.
- Never use a zone for style preferences the repository has no rule for. Drop
  those findings.
- Use existing evidence from the PR, such as preprod test comments or CI runs,
  to lower or raise a zone. Say which evidence you used.

## Identify what to review

Accept any of these, alone or mixed in one message:

| Input | Example | Resolution |
| --- | --- | --- |
| PR URL | `https://github.com/navikt/repo/pull/305` | Owner, repo and number from the path. Ignore suffixes such as `/files`, `/commits`, `/changes`, query strings and `#discussion_r…` anchors. |
| Short reference | `navikt/repo#305` | Owner, repo and number. |
| Number | `305`, `#305` | Current repository from `gh repo view --json nameWithOwner`. |
| Several PRs | Several URLs or numbers | Review each PR. Ask whether they are a stack only if their bases chain. |
| Branch | `deps/upgrade-maven-majors-2026-10` | `gh pr list -R <owner>/<repo> --head <branch> --state open`. |
| Nothing | "review min PR" | The open PR for the current branch: `gh pr view --json number,url`. |
| Stack | "review stacken", or a PR whose base or head is part of a chain | See below. |

If the reference cannot be resolved to exactly one open PR, list the
candidates and ask. Do not guess.

### Stacks

A PR is part of a stack when its base is another open PR's head, or another
open PR uses its head as base.

1. Walk down: find the PR whose head is the current base, until the base is
   the trunk. Walk up: find open PRs whose base is the current head.
   ```sh
   gh pr list -R <owner>/<repo> --head <base-branch> --state open --json number,url,baseRefName,headRefName
   gh pr list -R <owner>/<repo> --base <head-branch> --state open --json number,url,baseRefName,headRefName
   ```
   `gh stack view --json` may be used when the extension is installed, but
   only if it does not require checking out another branch.
2. If the user said "stack", review every layer. If the user gave one PR
   that turns out to be in a stack, ask whether to review the whole stack
   or only that PR. Recommend the whole stack.
3. Order the layers bottom to top. Report merged layers and branches without
   PR, but do not review them.

## Choose model and effort

Ask which model and effort to review with before gathering context. Ask in
the same question round as the stack question when there is one.

1. List the models the client can use. In OpenCode, use the `models` tool and
   show each model's `id` and available `variants`. Elsewhere, offer the
   current session model and let the user type another.
2. Ask for the model. Recommend the current session model first.
3. Ask for the effort, using the chosen model's own variant names, for
   example `low`, `medium`, `high` or `xhigh`. If the model has no variants,
   use `standard`.
4. Run the review with the choice:
   - If the client can start a subagent with a given model, such as the
     OpenCode `subagent` tool with `model: "<provider>/<model>#<variant>"`,
     delegate the review and comment drafting to it. Give it this skill's
     rules, the resolved PR list and the stack order.
   - If it cannot, and the choice differs from the current session, tell the
     user how to restart with that model, or ask whether to continue with the
     current model and effort.
5. Record the model and effort that were actually used, not the ones that
   were requested. If the client does not expose the effort, record `ukjent`.
   Never guess.

## Gather context

For every selected PR, using `-R <owner>/<repo>` on every `gh` command:

1. `gh pr view` with title, body, author, draft state, base and head,
   files, commits, checks status and review decision.
2. `gh pr diff`. In a stack, judge each layer against its own base, so a
   change is reviewed once, in the layer that introduces it.
3. Existing reviews and comments, including the bot overview and test
   reports from the author. Do not repeat a finding someone already raised
   unless you add something; refer to it instead.
4. `gh pr checks`. Note failing or pending checks.
5. Read the surrounding code at the PR head without touching the user's
   worktree:
   ```sh
   git fetch origin <head-branch>
   git show "origin/<head-branch>:<path>"
   git grep -n "<symbol>" "origin/<head-branch>"
   ```
   In zsh, quote `"${ref}:<path>"`, because `$ref:a` is a modifier.
   If the repository is not checked out locally, clone it shallow into the
   session's temporary directory.
6. Trace callers, tests and configuration for every changed contract. Ask
   for each change: which code path uses it, which test covers it, and what
   happens if it fails silently.
7. Load relevant skills or subagents for specialised areas when available,
   for example `security-review`, `kafka`, `nais`, `nav-auth`,
   `flyway-migration` or `accessibility`.

Do not run the full build unless the user asks. Prefer CI results.

## Write the comments

Write one comment per PR in Norwegian bokmål. Load `klarsprak` or
`fyllut-unslop` before writing. Use this structure and omit empty zones,
except for grønn sone:

```markdown
## Kodegjennomgang: #<number> (nivå <n> av <total> i stacken)

_KI-gjennomgang: <model name> (`<provider>/<model>`), innsats `<effort>`, `fyllut-pr-review` <version>._

<One or two sentences: number of findings per zone and overall verdict.>

> 🔴 **Rød sone**: må vurderes før merge.
> 🟡 **Gul sone**: bør vurderes, men blokkerer ikke.
> 🟢 **Grønn sone**: gjennomgått, ingen merknader.

### 🔴 Rød sone: <short title>

<What the change does, what can go wrong, and the evidence.>

**Forslag:** <concrete action, or the question the author must answer>

### 🟡 Gul sone: <short title>

<Finding.>

**Vurder:** <action or confirmation needed>

### 🟢 Grønn sone

- <what was checked and found correct>
```

Drop "(nivå … i stacken)" for a single PR. Always include the
`KI-gjennomgang` line with the model and effort recorded above, and the
`version` from this skill's front matter, so the team can compare reviews
from different models later. Keep each finding short. Never
include secrets, tokens, fødselsnummer, names, journalpost IDs,
innsendings-IDs or raw production logs in a comment.

## Publish

1. Show the drafts in the chat, with the zone summary per PR, unless the
   user already asked for the comments to be posted.
2. Ask for confirmation before posting. A request to "review" alone is not
   permission to publish.
3. Post a plain comment per PR, bottom of the stack first. Write the body to
   a file in the session's temporary directory and use:
   ```sh
   gh pr comment <number> -R <owner>/<repo> --body-file <file>
   ```
   Never use `gh pr review --approve` or `--request-changes`.
4. If the authenticated user already posted a review comment from this skill
   on the PR, ask whether to update it or add a new one. Use `--edit-last`
   only when that review comment is the user's latest comment on the PR.
5. Report each PR URL with its comment URL and the number of rød and gul
   findings.
