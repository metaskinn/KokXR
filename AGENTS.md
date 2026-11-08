# KökXR Development Rules

KökXR is a hackathon prototype for digitally exploring the
foundation (vakıf) works in Bursa.

Technologies: React, TypeScript, Vite.

First goal:
- Home page
- Historical artifact selection
- Photo gallery
- Information panel
- Three-question quiz

Rules:
- The UI will be in Turkish.
- Build the simple working version first.
- Do not present 3D or VR features that have no data as if they exist.
- Do not invent historical information.
- Do not publish sensitive files or images with unclear licenses.
- Test the app at every stage.
- Do not make changes outside the task scope.

## Where things are

Read only the row the task needs.

| Topic | Location |
|---|---|
| Admin panel plan | `docs/admin-panel-plan.md` |
| Competition rules, scoring | `docs/specification.md` (section 5) |
| **Plan and status (start work here)** | `PLAN.md` |
| Quest status | `QUEST-HANDOFF.md` |
| Setup, architecture, data model | `HANDOFF.md` |
| Pages and routes | `src/app/App.tsx`, `src/features/*/` |
| Artifact content | `src/content/artifacts/*.json`, types in `src/domain/artifact.ts` |
| Scale model and VR | `src/features/scale-models/` (`xr*.ts`: VR), `src/shared/xr/` |
| Workshop details | `docs/sword-workshop.md`, `docs/vase-model.md` |
| Design | `docs/ui-design.md` |
| Old reports | `docs/archive/` |

## Working efficiently

- Do not read a document from start to finish: search first, then read the range you need.
- Do not open `docs/archive/`, `docs/test-screenshots/`, `public/`, `assets/`, `dist/`, `node_modules/` or `package-lock.json` unless necessary.
- Run `npm run test:hizli` after every small change; if the UI or scene changed, run `npm run test:tarayici` at the end of the task. For a single test: `node scripts/test-browser.mjs model-interior` (build first).
- Open a subagent only for independent work. Give the file path, do not copy its contents; ask for a short report. Never let two agents touch the same file.
- Move finished plans and reports to `docs/archive/`; keep only active documents at the root of `docs/`.

## Token rules

Apply these in order on every task; the rationale is in `docs/token-saving.md`. Tests and source checks are never skipped to save tokens.

1. Narrow the target: `rg` first, then only the range you need.
2. Do not re-read what is already in the conversation, and do not re-argue a decision.
3. Filter long output with `| tail -n 20` or `rg`.
4. Prefer local tools and the CLI over MCP; use targeted queries on the web.
5. Start research with a single targeted query.
6. `test:hizli` first, then a single test; the full suite at the end of the task.
7. Send independent tool calls in a single response.
8. Use subagents sparingly; `model: haiku` for pure search, never for historical verification.
9. Keep replies short: the result and the decision, no pasted code.
10. Run `/clear` when the topic changes and `/compact` when the conversation grows long.
11. For multi-file work, plan first.
