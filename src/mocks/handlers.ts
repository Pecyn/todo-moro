import { http, HttpResponse, passthrough } from 'msw'

const BASE_URL = 'http://localhost:8080'

// Task IDs listed here will fail on complete/delete, for manually
// testing bulk action error feedback in the browser
// Change these IDs to match your local data if you want to test this feature via pnpm dev:mocks
const FAILING_TASK_IDS = new Set([
  'SIZPgZhgYBL_8LOFAY1Ce',
  '26cRJz8ffyuMDUm17OuhI',
])

export const handlers = [
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
