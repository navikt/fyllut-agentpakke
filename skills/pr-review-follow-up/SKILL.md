---
name: pr-review-follow-up
description: Work through recent GitHub pull request review comments with the user, decide how to handle each one, then implement, commit, push, reply, and resolve the agreed follow-ups. Use when the user provides a pull request and wants to address review feedback collaboratively.
license: MIT
metadata:
  version: "1.0.0"
---

# Follow up pull request reviews

Read every relevant review comment, discuss them with the user one at a time,
and change the pull request only after the user confirms the complete plan.

## Identify the feedback

1. Resolve the repository and pull request from the supplied number, URL, or
   current branch.
2. Fetch review comments, submitted reviews, and conversation comments. Use
   GitHub review threads when available so replies and resolution state remain
   attached to the correct comment.
3. Match the reviewer by their exact GitHub login. If the supplied name does
   not match a login, list recent comment authors and identify the intended
   reviewer without silently guessing.
4. Apply any supplied time window and expected comment count. If the count
   differs, report what was found before continuing.
5. Sort the comments chronologically. Include unresolved comments and any
   replies that affect their meaning. Do not treat a review summary as an
   inline comment.

Useful GitHub CLI endpoints:

```sh
gh api --paginate repos/OWNER/REPO/pulls/PR/comments
gh api --paginate repos/OWNER/REPO/pulls/PR/reviews
gh api --paginate repos/OWNER/REPO/issues/PR/comments
```

## Read before discussing

For every comment:

1. Read the comment body, diff hunk, file, line, and surrounding code at the
   pull request head.
2. Trace enough related code, tests, configuration, and history to understand
   the reviewer's concern. Read repository guidance and invoke required skills
   before reviewing backend, frontend, security, or other specialized code.
3. Check whether later commits already addressed the comment.
4. Separate a requested code change from a question, suggestion, scope concern,
   or misunderstanding.

Do not edit files, post replies, resolve threads, or create commits during this
phase.

## Decide one comment at a time

First give the user a short ordered list of all comments found. Then handle
them chronologically, one at a time.

For each comment:

1. Explain what the reviewer is asking.
2. State what the current code does and any consequence the comment does not
   mention.
3. Recommend one concrete response. Say plainly when no code change is the
   better choice.
4. Present the realistic alternatives when there is a tradeoff.
5. Ask the user to choose. Use a structured question tool when available.
6. Record the decision before moving to the next comment.

Do not assume that accepting feedback always means changing code. A valid
outcome can be keeping the code and replying with evidence, moving unrelated
work to another pull request, or scheduling a temporary compatibility path for
later removal.

## Confirm the complete plan

After deciding every comment, stop before implementation. Summarize:

- each comment and the agreed outcome
- files or behavior expected to change
- comments that need only a reply
- intended commit grouping
- rollout, compatibility, secret, migration, or deployment requirements

Then explicitly ask whether the agent should start implementing the decided
changes. Make clear that confirmation authorizes editing, validation, commits,
pushing to the pull request branch, replies, and resolution of the agreed
threads. Do not begin any of those actions until the user confirms.

## Implement the confirmed decisions

1. Require a clean understanding of the worktree. Preserve unrelated user
   changes and stop if they conflict with the agreed work.
2. Work on the pull request head branch. If checkout is needed, require a clean
   worktree and use `gh pr checkout`.
3. Follow repository guidance and use its pinned tools.
4. Make only the agreed changes. Preserve temporary compatibility behavior
   exactly as decided and leave a removal note when appropriate.
5. Update tests, shared contracts, configuration, deployment manifests, and
   documentation when the change crosses those boundaries.
6. Validate each logical change with the smallest relevant checks.
7. Create separate commits for independent review comments unless the user
   chose another grouping. Do not create empty commits for reply-only outcomes.
   Follow the repository's commit convention and required trailers.
8. Push the pull request branch.

## Reply and resolve

After the commits are available on GitHub:

1. Reply to every reviewed thread. Reference the commit for implemented
   changes. For no-change decisions, give the agreed technical reason.
2. Keep replies concise and use the repository's required language.
3. Resolve a thread only after its change is pushed or its explanation is
   posted. Do not resolve a thread that remains blocked, disputed, or awaiting
   reviewer input.
4. Verify the replies and resolution state against the original comment IDs.

Finish by reporting the pushed commits, the outcome for each comment, and any
required deployment action. State when pull request checks are still pending,
but do not wait for them unless the user asks.
