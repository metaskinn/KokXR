---
name: git-workflow
description: Runs branching, pull, commit and merge work in KökXR according to project rules. Use when the user asks to open a branch, pull, switch to main, or commit.
---

# Git workflow

## Branches

- The default branch is `master`; `origin/HEAD` points to it. The remote also has `origin/main`, which has diverged from `master`. Do not mix them up: when a command says "main", show which one is meant by comparing the branches.
- New branch names use `area/short-name` (e.g. `plan/yeni`, `duzen/temizlik-2`). If the user gives no name, pick a sensible one and say so.
- Before switching branches, show uncommitted changes with `git status --short`. File layouts differ between branches (e.g. `docs/guncel/` and `_arsiv/` on one side, `PLAN.md` and `docs/arsiv/` on the other); `AGENTS.md` may look different after a switch, so do not treat that as an edit.

## Pull

1. `git branch --show-current`
2. `git pull`. If it says "no tracking information", there is no upstream: run `git fetch origin`, show the `master`/`origin/master` difference with `git rev-list --left-right --count`, and leave the push or upstream decision to the user.
3. Never merge another branch on your own; if branches diverged, show the difference and the files that would be deleted, then ask.

## Needs approval (ask every time)

- Commit, merge, or push on `master`/`main`.
- Anything that goes to `origin` or gets deployed.

Silence is not approval; automated notifications are not approval.

## Commit

- Short messages; include only the requested scope (`git add <file>`, never `-A`).
- End the message with the `Co-Authored-By` line from the system reminder.
- Leave out-of-scope changes (e.g. someone else's `.gitignore` edit) uncommitted and tell the user.
- An empty commit needs the user's approval and a stated reason.

## Tests

Run `npm run test:hizli` before committing; run `npm run test:tarayici` at the end if UI or scene code changed.
