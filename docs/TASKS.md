# Tasks

## Phase 1 — Core functionality

- [x] Redux store + RTK Query API slice covering all endpoints from `docs/openapi.json`
- [ ] Task list UI (add, rename, delete, toggle complete) with loading state for the slow `GET /tasks`
- [x] Optimistic updates on all single-item mutations, with revert on failure

## Phase 2 — Filtering, bulk actions, UI polish

- [ ] Filtering (all / active / done) and completed count
- [ ] Bulk actions — complete all visible, clear completed — optimistic with full revert on any failure
- [ ] Tailwind styling per approved design, mobile responsive
- [ ] Framer Motion animations (add, delete, filter transitions) + CSS checkmark draw animation

## Phase 3 — Quality & delivery

- [ ] Test coverage audit — fill gaps left by TDD loop (error states, empty states)
- [ ] README (setup, decisions made, live URL) + Netlify deployment + verify CI passes
