import { http, HttpResponse, passthrough, delay } from 'msw'

const BASE_URL = 'http://localhost:8080'

// Task IDs listed here will fail on complete/delete, for manually
// testing bulk action error feedback in the browser
// Change these IDs to match your local data if you want to test this feature via pnpm dev:mocks
const FAILING_TASK_IDS = new Set([
  'SIZPgZhgYBL_8LOFAY1Ce',
  '26cRJz8ffyuMDUm17OuhI',
])

export const handlers = [
  // GET /tasks is mocked twice to simulate a network error on the first request,
  // then a successful response on the second request (for testing the retry button in the error state)
  http.get(`${BASE_URL}/tasks`, () => HttpResponse.error(), { once: true }),
  http.get(`${BASE_URL}/tasks`, async () => {
    await delay(1500)
    return passthrough()
  }),
  // POST /tasks/:id/complete and DELETE /tasks/:id are mocked to simulate a network error for certain task IDs,
  // for testing bulk action error feedback in the browser
  http.post(`${BASE_URL}/tasks/:id/complete`, ({ params }) => {
    if (FAILING_TASK_IDS.has(params.id as string)) {
      return HttpResponse.error()
    }
    return passthrough()
  }),
  http.post(`${BASE_URL}/tasks/:id`, () => passthrough()),
  http.delete(`${BASE_URL}/tasks/:id`, ({ params }) => {
    if (FAILING_TASK_IDS.has(params.id as string)) {
      return HttpResponse.error()
    }
    return passthrough()
  }),
]
