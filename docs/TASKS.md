# Tasks

## Phase 1 — Core functionality ✅

- [x] Redux store + RTK Query API slice covering all endpoints from `docs/openapi.json`
- [x] Task list UI (add, rename, delete, toggle complete) with loading state for the slow `GET /tasks`
- [x] Optimistic updates on all single-item mutations, with revert on failure

## Phase 2 — Filtering, bulk actions, UI polish

- [x] Filtering (all / active / done) and completed count
- [x] Bulk actions — complete all visible, clear completed
      (loading state + Promise.allSettled, not optimistic — conscious trade-off)
- [ ] Bulk action error feedback — toast when any bulk operation fails
- [x] Tailwind styling per approved design, mobile responsive
- [x] Framer Motion animations + checkmark draw animation
- [x] Error handling — toast on single-item mutation failure
- [ ] Empty state UI — when task list is empty
- [ ] Error state UI — when GET /tasks fails (currently renders but unstyled)

## Phase 3 — Quality & delivery

- [ ] Test coverage audit — fill gaps (empty states, error states)
- [ ] README (setup, architecture decisions, trade-offs)
- [ ] Verify CI passes on main after final merge
