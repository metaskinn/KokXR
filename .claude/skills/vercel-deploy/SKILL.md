---
name: vercel-deploy
description: Deploys KökXR to Vercel and checks the deployment status. Use when the user says update Vercel, publish, or deploy, or asks whether kokxr.vercel.app is current.
---

# Vercel deploy

The project is `meltems-projects-7264ee27/kokxr`, main URL `https://kokxr.vercel.app`. It is not connected to GitHub; deployments are made with the CLI. The Vercel MCP connection may not have access to this team, so use the CLI: `npx --yes vercel ...` (no install needed).

## Rule

A deploy updates a public URL. **Ask for approval every time.** The repo stays private; never publish a build that includes photos with unclear licenses.

## Steps

1. Confirm login with `npx --yes vercel whoami`. If not logged in, ask the user to run `! npx vercel login`.
2. Show the branch and working tree: `git branch --show-current`, `git status --short`. Have the user confirm which branch to publish.
3. Run `npx --yes vercel --prod --yes` in the background (it can exceed 10 minutes). Take the `Production` URL from its output.
4. Wait for the result: check the `status` and `reason` lines of `npx --yes vercel inspect <url>`. Wait with an `until` loop in the background; do not chain `sleep`.
5. On **Ready**, confirm `kokxr.vercel.app` appears under `Aliases` and that the URL returns `200`.

## Known blocker

`Blocked — the commit author doesn't have permission...` means the commit author is not authorized on the project. A clean working tree did not fix it. The fix is in the dashboard (Settings → Members/Git): set up the authorized account. Never bypass the permission check (hiding git identity, committing under someone else's name) unless the user explicitly asks.

A blocked deploy does not break the site: the alias stays on the last **Ready** deployment.

## Reporting

State which branch/commit is live, the status, and the URL, one line each. Remind the user that `main` has no PWA manifest, so the branch matters.
