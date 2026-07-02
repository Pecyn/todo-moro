# todo-moro

A simple todo app for managing a list of tasks.

## Tech stack

|                       |                                    |
| --------------------- | ---------------------------------- |
| Language              | TypeScript                         |
| UI                    | React                              |
| State / data fetching | Redux Toolkit + RTK Query          |
| Styling               | Tailwind v4                        |
| Animation             | Framer Motion                      |
| Testing               | Vitest, React Testing Library, MSW |
| Package manager       | pnpm                               |

## Getting started

Prerequisites: Node >=22.13 (see `engines` in `package.json`), pnpm.

```
pnpm install
```

This app is a client for the [todo-be](https://github.com/morosystems/todo-be)
backend from the assignment brief — start that separately. Then create
`.env.local`:

```
VITE_API_BASE_URL=http://localhost:8080
```

```
pnpm dev            # start the app
pnpm test -- --run  # run the test suite once
pnpm lint           # lint
pnpm run build      # typecheck + build
```

## Testing error scenarios manually

`pnpm dev:mocks` starts the app against MSW instead of the real backend, with:

- `GET /tasks` failing on the first request and succeeding on the second, to
  exercise the error state's retry button
- specific task IDs (`FAILING_TASK_IDS` in `src/mocks/handlers.ts`) forced to
  fail on complete/delete, to exercise the bulk action error toast

`FAILING_TASK_IDS` needs updating to match whatever IDs exist in your local
seed data. Normal `pnpm dev` is unaffected and always talks to the real
backend.

## Architecture & key decisions

- Single-item mutations (add, rename, complete, incomplete, delete) are
  purely optimistic, with no `invalidatesTags` refetch, and revert with an
  error toast on failure. `GET /tasks` is deliberately slow (~3s), so
  refetching after every mutation would hurt the UX; the risk of cache drift
  is negligible for a simple CRUD API like this.
- Bulk actions (complete all visible, clear done) are **not** optimistic.
  There's no batch endpoint on the backend, so a bulk action is N parallel
  requests via `Promise.allSettled`, with a loading state on the triggering
  button instead of an instant UI update.
  - `completeTask` and `deleteTask` revert on failure by patching the cache
    by task ID, rather than using RTK Query's built-in `patchResult.undo()`.
    Under concurrent mutations on the same array (several parallel bulk
    requests touching the same `getTasks` cache entry), blindly undoing to a
    snapshot can overwrite changes made by other in-flight requests; patching
    by ID only touches the one task each request is responsible for.
  - Bulk mutations pass a `silent` flag to suppress the per-item error toast,
    in favor of one aggregate toast summarizing how many of N operations
    failed.
- Flat `src/tasks/` structure, no `features/` wrapper — deliberate choice for
  a single-domain app this size.
- Empty and error states for the task list, with retry wired to RTK Query's
  `refetch`.
- MSW is used two ways that intentionally don't share handlers: `msw/node`
  with inline per-test handlers (`server.use(...)`) for the automated test
  suite, and a separate `msw/browser` setup (`src/mocks/`, gated behind
  `pnpm dev:mocks`) for manual QA.
- `GET /tasks/completed` exists in the API but is intentionally unused — all
  data lives in the single `GET /tasks` cache entry, and client-side
  filtering is sufficient at this scale.

## Testing

Vitest + React Testing Library, with MSW mocking at the network level rather
than mocking RTK Query hooks — tests exercise the real component → hook →
cache → render flow. 77 tests across 7 files as of this writing.
