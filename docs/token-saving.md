# Token saving

Source: [Claude Code cost documentation](https://code.claude.com/docs/en/costs). The short rules are in `AGENTS.md`, loaded in every session; this file is for the rationale and setup.

## Rules (apply in order)

1. **Narrow the target.** If the file path is known, go straight to it. First `rg`, then `Read` only the range you need.
2. **Do not re-read.** Do not reopen a file or information already in the conversation, do not re-debate a decision.
3. **Trim the output.** Filter long commands with `| tail -n 20` or `rg`. Do not bring raw logs, file dumps and JSON into context.
4. **Choose the cheapest method.** Local tools and CLI (`gh`, `curl`, `vercel`) come before MCP. On the web use a targeted query instead of a full page.
5. **Limit research.** If the document is at a known address, one query is enough; do not do a broad search.
6. **Small test, then big test.** First `test:hizli`, then a single browser test. The full suite only at the end of the work; if it is long it runs in the background without monitoring.
7. **Batch calls.** Send tool calls that do not depend on each other in a single response.
8. **Subagents sparingly.** Open them only for independent, multi-file work. Use `model: haiku` for pure search and logs. Do not use Haiku for verifying historical text.
9. **Short replies.** Do not retell what was done, do not paste code; write the result and the decision.
10. **Clear the context.** `/clear` when the topic changes; `/compact` when it grows long. What to keep is in the `Compact instructions` section of `CLAUDE.md`.
11. **Plan first for big work.** Use plan mode for multi-file work, cut a wrong direction early with `Esc` or `/rewind`.

**Limit:** Saving cannot be a reason to skip tests, source checks or the `AGENTS.md` rules.

## Applied settings

| Setting | Where | Scope |
|---|---|---|
| Read block for `node_modules`, `dist`, `package-lock.json` | `.claude/settings.json` | Team |
| `model: sonnet`, `effortLevel: medium` | `.claude/settings.local.json` | This machine only |
| Unnecessary plugins disabled in this project | `.claude/settings.local.json` | This machine only |

The settings take effect in a new session; verify with `/context`. For a hard task, `/model opus`.

## Not chosen

- **`MAX_THINKING_TOKENS`:** Valid only for models with a fixed thinking budget; `effortLevel` was used instead.
- **Output-filtering hook:** `test:tarayici` already gives a short summary, not worth maintaining.
- **TypeScript code intelligence plugin:** Requires installation; not added before the final.
- **Agent teams:** Increases cost.
