# Project context

## Conventions

- All code (variables, functions, comments, everything) in English
- Single quotes, no semicolons
- pnpm as package manager

## Non-discoverable API constraints

- `POST /tasks/{id}` updates task text — not PATCH or PUT
- `GET /tasks` is intentionally slow (~3s) — relevant for loading states
- No backend batch endpoints — bulk operations are client-side parallel calls

## React conventions

- Never use array index as a React `key` — use the task's stable `id`

## Reference

API contract: `docs/openapi.json`
Implementation plan and progress tracking lives in `docs/TASKS.md`. Update it as tasks complete.
