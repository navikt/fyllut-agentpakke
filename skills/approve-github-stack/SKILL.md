---
name: approve-github-stack
description: Review and approve every eligible pull request in a GitHub stacked PR stack. Use when the user asks to approve a whole stack identified by a stack number, pull request number or URL, or branch.
---

# Approve a GitHub stack

Approve all reviewable pull requests in one GitHub stack without making the
user approve each layer separately.

## Preconditions

- Require the GitHub CLI and the `github/gh-stack` extension. If
  `gh stack --help` fails, stop and report that the extension is not installed.
  Do not install it unless the user asks.
- Run `gh auth status` and verify the repository with
  `gh repo view --json nameWithOwner,url`.
- Accept a stack number, pull request number or URL, or branch as the stack
  identifier. If the user did not provide one, use the stack containing the
  current branch. If there is no unambiguous current stack, ask for an
  identifier.

## Resolve the stack

1. Record the current branch.
2. When an identifier was supplied, run `gh stack checkout <identifier>`.
   Before checking out another stack, require a clean worktree. Never discard,
   stash, or overwrite local changes.
3. Run `gh stack view --json`. Use its `branches` array as the authoritative
   stack membership and preserve its bottom-to-top order.
4. Select entries with a PR whose state is `OPEN`. Report branches with no PR
   and PRs that are merged or queued, but do not review them.
5. Verify each selected PR belongs to the current repository and that its base
   follows the preceding stack branch, with the bottom PR based on the stack
   trunk. Stop before approving anything if membership or ordering is
   inconsistent.

## Review

For every selected PR, from bottom to top:

1. Read its title, body, author, draft state, base and head branches, checks,
   existing reviews, and mergeability with `gh pr view`.
2. Inspect the layer's own diff with `gh pr diff`. Judge it relative to its PR
   base, not relative to the repository trunk, so changes from lower layers are
   not reviewed repeatedly.
3. Do not approve a draft, a PR authored by the authenticated user, a PR with
   unresolved review threads, or a PR with a correctness, security, or
   merge-blocking problem. Report the blocker precisely.
4. If the authenticated user's latest review is already `APPROVED`, mark the
   PR as already approved and do not submit a duplicate review.

Approval is authorization to submit reviews, not permission to merge. Never
merge or enqueue any PR as part of this skill.

## Approve

If every selected PR is reviewable and no blocking issue was found, approve
each one from bottom to top:

```sh
gh pr review <pr-url> --approve
```

Do not request confirmation for each PR: the user's request to approve the
stack authorizes one approval review per eligible layer. Continue after an
individual command failure so the remaining independent approvals are
attempted, but never describe a failed approval as successful.

Afterward, query every selected PR again and verify that the authenticated
user's latest review is `APPROVED`. Restore the original branch if stack
resolution changed it. Report:

- the repository and resolved stack
- each PR URL and whether it was approved, already approved, skipped, blocked,
  or failed
- any branch that could not be restored

Never claim that the whole stack was approved unless every eligible open PR
has a verified approval from the authenticated user.
