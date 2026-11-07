# KökXR

@AGENTS.md

## When promises and rules conflict

A promise decides what work to do; the rules above decide what the product may claim. A promise without data is not presented as if it exists, and historical information is never invented. In that case, tell the user about the missing data.

## Commands

Node.js 24+ is required (`.nvmrc`).

```bash
npm install
npm run dev
npm run test:hizli      # type check + pure tests, takes seconds
npm run test:tarayici   # build + preview + browser tests, short summary; shuts down the server itself
npm run test:e2e        # end to end; preview must be running in a separate terminal
```

Local browser tests run slowly with software rendering; wait on a condition, not on a duration. FPS is measured only on a real device.

## Working rules

- Talk to the user in Turkish.
- Ask before adding a `package.json` dependency.
- The repo stays private; photos whose permission is unclear are not published publicly.
- Ask before merging into `master`.

# Compact instructions

Keep: open tasks and decisions, changed file paths, test results, user corrections, unverified historical information. Drop: file dumps, raw logs, details of resolved errors.
