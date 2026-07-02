import { http, HttpResponse, passthrough, delay } from 'msw'

const BASE_URL = 'http://localhost:8080'

// Task IDs listed here will fail on complete/delete, for manually
// testing bulk action error feedback in the browser
// Change these IDs to match your local data if you want to test this feature via pnpm dev:mocks
const FAILING_TASK_IDS = new Set(['vzgMLPq7j_xKSz7O3Jm2B'])

export const handlers = [
  // GET /tasks is mocked to simulate a network error on the first request
  http.get(
    `${BASE_URL}/tasks`,
    async () => {
      await delay(1000)
      return HttpResponse.error()
    },
    { once: true }
  ),
  // POST /tasks/:id/complete and DELETE /tasks/:id are mocked to simulate a network error for certain task IDs,
  // for testing bulk action error feedback in the browser
  http.post(`${BASE_URL}/tasks/:id/complete`, ({ params }) => {
    if (FAILING_TASK_IDS.has(params.id as string)) {
      return HttpResponse.error()
    }
    return passthrough()
  }),
  http.post(`${BASE_URL}/tasks/:id`, () => passthrough()),
  http.delete(`${BASE_URL}/tasks/:id`, async ({ params }) => {
    await delay(2000)
    if (FAILING_TASK_IDS.has(params.id as string)) {
      return HttpResponse.error()
    }
    return passthrough()
  }),
]
