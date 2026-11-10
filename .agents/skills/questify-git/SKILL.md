---
name: questify-git
description: Manage Questify branches, focused commits, merge reviews, worktrees and safe local or remote branch cleanup.
---

# Questify Git workflow

## Establish the actual state
Run git status --short --branch, git branch -vv, git worktree list and, when useful,
git log --graph --oneline --decorate --all -25. Inspect git diff and git diff --cached
before staging. Remote-tracking refs may be stale; fetch when current remote state
matters and network access is available. Label cached information otherwise.

main and dev are the integration and development branches. dev was recreated from
the latest dev_alt tip; preserve dev_alt until explicitly retired. dev contains
development work that may not be on main; verify ancestry instead of choosing a base by name.
For a new task branch use feat/<topic>, fix/<topic>, docs/<topic> or chore/<topic>.
Do not move existing dirty work to another branch without accounting for its owner.
Use an existing isolated workspace when present. Create worktrees only when needed
and authorized, with ignored project-local storage or a user-selected location.

## Review and commit
Stage explicit task-owned paths. Inspect the staged diff, run git diff --cached
--check and appropriate project verification before committing. Match the subject
to the final changes, e.g. docs: document Questify agent workflows. A local commit
does not authorize pushing, merging or changing repository settings. Follow explicit
session authorization without asking for it again.

Before integrating branches, inspect git log <target>..<source> and the diff since
their merge base. Resolve conflicts according to intended behavior, then rerun the
affected checks. Do not force a merge strategy or overwrite unrelated changes.
Avoid history rewrites of shared branches. If a requested rewrite is necessary,
inspect remote state and use force-with-lease rather than a blind force push.

## Branch cleanup
For every candidate check git log <kept-branch>..<candidate> and
git merge-base --is-ancestor <candidate> <kept-branch>. An empty unique-commit list
and successful ancestry check establish that its commits remain reachable.
Also check worktree use and preserve main, dev, dev_alt, and any branch with unique work.
Equal tip hashes establish duplicates, but still retain a deliberate canonical name.
Prefer git branch -d for local cleanup. If it refuses, investigate the reason;
do not switch reflexively to -D. Local and remote deletions are separate operations.
Delete remote branches only within explicit authorization and after checking current
remote state. Never reset, clean, stash-drop or delete a branch to hide a dirty tree.

After a mutation verify branch/status state and report exactly what changed,
including whether changes were local, committed or published. Do not imply a fetch,
push, test run or remote deletion occurred when it did not.

For the requested integration workflow, branch from current dev, implement and verify
on the task branch, commit focused changes, then merge into dev when authorized.
Keep dev at the latest integrated commit. Do not update main or push without scope.
