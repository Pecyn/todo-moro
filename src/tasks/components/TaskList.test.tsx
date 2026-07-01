import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Provider } from 'react-redux'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { tasksApi } from '../api/tasksApi'
import { TaskList } from './TaskList'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderWithStore() {
  const store = configureStore({
    reducer: { [tasksApi.reducerPath]: tasksApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(tasksApi.middleware),
  })

  return render(
    <Provider store={store}>
      <TaskList />
    </Provider>
  )
}

describe('TaskList', () => {
  it('shows a loading state while GET /tasks is pending', () => {
    server.use(http.get('http://localhost/tasks', () => new Promise(() => {})))

    renderWithStore()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the task list when GET /tasks resolves successfully', async () => {
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk the dog', completed: true, createdDate: 2, completedDate: 3 },
        ])
      )
    )

    renderWithStore()

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('renders an error state when GET /tasks returns a network error', async () => {
    server.use(http.get('http://localhost/tasks', () => HttpResponse.error()))

    renderWithStore()

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
  })
})
