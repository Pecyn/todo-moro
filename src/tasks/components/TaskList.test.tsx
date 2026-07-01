import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Provider } from 'react-redux'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import toastSlice from '../../app/toastSlice'
import { tasksApi } from '../api/tasksApi'
import { TaskList } from './TaskList'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    li: (props: React.HTMLAttributes<HTMLLIElement>) => <li {...props} />,
    circle: (props: React.SVGProps<SVGCircleElement>) => <circle {...props} />,
    path: (props: React.SVGProps<SVGPathElement>) => <path {...props} />,
  },
}))

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderWithStore() {
  const store = configureStore({
    reducer: {
      [tasksApi.reducerPath]: tasksApi.reducer,
      toast: toastSlice.reducer,
    },
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

  it('renders an edit button for each task returned by GET /tasks', async () => {
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk the dog', completed: false, createdDate: 2 },
        ])
      )
    )

    renderWithStore()

    expect(await screen.findAllByRole('button', { name: /edit/i })).toHaveLength(2)
  })

  it('renders 3 skeleton cards while GET /tasks is pending', () => {
    server.use(http.get('http://localhost/tasks', () => new Promise(() => {})))

    renderWithStore()

    expect(screen.getAllByTestId('task-skeleton')).toHaveLength(3)
  })

  it('clicking checkbox on an active task calls POST /tasks/{id}/complete', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: false, createdDate: 1 }])
      )
    )
    let completeCalled = false
    server.use(
      http.post('http://localhost/tasks/1/complete', () => {
        completeCalled = true
        return HttpResponse.json({ id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 })
      })
    )

    renderWithStore()

    await user.click(await screen.findByRole('button', { name: /mark complete/i }))
    await waitFor(() => expect(completeCalled).toBe(true))
  })

  it('clicking checkbox on a completed task calls POST /tasks/{id}/incomplete', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '2', text: 'Walk dog', completed: true, createdDate: 1, completedDate: 2 }])
      )
    )
    let incompleteCalled = false
    server.use(
      http.post('http://localhost/tasks/2/incomplete', () => {
        incompleteCalled = true
        return HttpResponse.json({ id: '2', text: 'Walk dog', completed: false, createdDate: 1 })
      })
    )

    renderWithStore()

    await user.click(await screen.findByRole('button', { name: /mark incomplete/i }))
    await waitFor(() => expect(incompleteCalled).toBe(true))
  })

  it('clicking delete button calls DELETE /tasks/{id}', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: false, createdDate: 1 }])
      )
    )
    let deleteCalled = false
    server.use(
      http.delete('http://localhost/tasks/1', () => {
        deleteCalled = true
        return HttpResponse.json('deleted')
      })
    )

    renderWithStore()

    await user.click(await screen.findByRole('button', { name: /delete/i }))
    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  it('only active tasks are shown when the Active filter is selected', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: true, createdDate: 2, completedDate: 3 },
        ])
      )
    )

    renderWithStore()

    await screen.findByText('Buy milk')
    await user.click(screen.getByRole('button', { name: /^active$/i }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText('Walk dog')).not.toBeInTheDocument()
  })

  it('only completed tasks are shown when the Done filter is selected', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: true, createdDate: 2, completedDate: 3 },
        ])
      )
    )

    renderWithStore()

    await screen.findByText('Buy milk')
    await user.click(screen.getByRole('button', { name: /^done$/i }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })

  it('all tasks are shown when switching back to the All filter', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: true, createdDate: 2, completedDate: 3 },
        ])
      )
    )

    renderWithStore()

    await screen.findByText('Buy milk')
    await user.click(screen.getByRole('button', { name: /^active$/i }))
    await user.click(screen.getByRole('button', { name: /^all$/i }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })
})
