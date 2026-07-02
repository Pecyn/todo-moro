import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Provider } from 'react-redux'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Toast } from '../../app/Toast'
import toastSlice from '../../app/toastSlice'
import { tasksApi } from '../api/tasksApi'
import { TaskList } from './TaskList'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
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
      <Toast />
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

  it('shows the generic toast when a single-item complete fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: false, createdDate: 1 }])
      )
    )
    server.use(http.post('http://localhost/tasks/1/complete', () => HttpResponse.error()))

    renderWithStore()

    await user.click(await screen.findByRole('button', { name: /mark complete/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Something went wrong.')
  })

  it('shows the generic toast when a single-item delete fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: false, createdDate: 1 }])
      )
    )
    server.use(http.delete('http://localhost/tasks/1', () => HttpResponse.error()))

    renderWithStore()

    await user.click(await screen.findByRole('button', { name: /delete/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Something went wrong.')
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

describe('bulk action error feedback', () => {
  it('shows no toast when Complete all succeeds for every task', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: false, createdDate: 2 },
        ])
      )
    )
    server.use(
      http.post('http://localhost/tasks/:id/complete', ({ params }) =>
        HttpResponse.json({ id: params.id, text: 'x', completed: true, createdDate: 1, completedDate: 2 })
      )
    )

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /complete all/i }))

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /mark incomplete/i })).toHaveLength(2)
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a toast and reverts only the failed task when Complete all partially fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: false, createdDate: 2 },
        ])
      )
    )
    server.use(
      http.post('http://localhost/tasks/:id/complete', ({ params }) => {
        if (params.id === '2') return HttpResponse.error()
        return HttpResponse.json({ id: params.id, text: 'x', completed: true, createdDate: 1, completedDate: 2 })
      })
    )

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /complete all/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to complete 1 of 2 tasks.')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark incomplete' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument()
    })
  })

  it('re-enables the bulk action buttons after Complete all partially fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: false, createdDate: 2 },
        ])
      )
    )
    server.use(
      http.post('http://localhost/tasks/:id/complete', ({ params }) => {
        if (params.id === '2') return HttpResponse.error()
        return HttpResponse.json({ id: params.id, text: 'x', completed: true, createdDate: 1, completedDate: 2 })
      })
    )

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /complete all/i }))

    await screen.findByRole('status')
    expect(screen.getByRole('button', { name: /complete all/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /clear done/i })).toBeEnabled()
  })

  it('shows "Failed to complete all tasks." when every task in Complete all fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
          { id: '2', text: 'Walk dog', completed: false, createdDate: 2 },
        ])
      )
    )
    server.use(http.post('http://localhost/tasks/:id/complete', () => HttpResponse.error()))

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /complete all/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to complete all tasks.')
  })

  it('does not duplicate tasks when Complete all partially fails across several concurrent completions', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Task 1', completed: false, createdDate: 1 },
          { id: '2', text: 'Task 2', completed: false, createdDate: 2 },
          { id: '3', text: 'Task 3', completed: false, createdDate: 3 },
          { id: '4', text: 'Task 4', completed: false, createdDate: 4 },
        ])
      )
    )
    server.use(
      http.post('http://localhost/tasks/:id/complete', ({ params }) => {
        if (params.id === '2' || params.id === '3') return HttpResponse.error()
        return HttpResponse.json({ id: params.id, text: 'x', completed: true, createdDate: 1, completedDate: 2 })
      })
    )

    renderWithStore()
    await screen.findByText('Task 1')

    await user.click(screen.getByRole('button', { name: /complete all/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to complete 2 of 4 tasks.')
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /mark incomplete/i })).toHaveLength(2)
    })
    expect(screen.getAllByText('Task 1')).toHaveLength(1)
    expect(screen.getAllByText('Task 2')).toHaveLength(1)
    expect(screen.getAllByText('Task 3')).toHaveLength(1)
    expect(screen.getAllByText('Task 4')).toHaveLength(1)
  })

  it('shows a toast and restores only the failed task when Clear done partially fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 },
          { id: '2', text: 'Walk dog', completed: true, createdDate: 3, completedDate: 4 },
        ])
      )
    )
    server.use(
      http.delete('http://localhost/tasks/:id', ({ params }) => {
        if (params.id === '2') return HttpResponse.error()
        return HttpResponse.json('deleted')
      })
    )

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /clear done/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to delete 1 of 2 tasks.')
    await waitFor(() => expect(screen.getByText('Walk dog')).toBeInTheDocument())
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
  })

  it('does not duplicate tasks when Clear done partially fails across several concurrent deletes', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([
          { id: '1', text: 'Task 1', completed: true, createdDate: 1, completedDate: 2 },
          { id: '2', text: 'Task 2', completed: true, createdDate: 3, completedDate: 4 },
          { id: '3', text: 'Task 3', completed: true, createdDate: 5, completedDate: 6 },
          { id: '4', text: 'Task 4', completed: true, createdDate: 7, completedDate: 8 },
        ])
      )
    )
    server.use(
      http.delete('http://localhost/tasks/:id', ({ params }) => {
        if (params.id === '2' || params.id === '3') return HttpResponse.error()
        return HttpResponse.json('deleted')
      })
    )

    renderWithStore()
    await screen.findByText('Task 1')

    await user.click(screen.getByRole('button', { name: /clear done/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to delete 2 of 4 tasks.')
    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Task 4')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Task 2')).toHaveLength(1)
    expect(screen.getAllByText('Task 3')).toHaveLength(1)
  })

  it('shows "Failed to delete all tasks." when every task in Clear done fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 }])
      )
    )
    server.use(http.delete('http://localhost/tasks/:id', () => HttpResponse.error()))

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /clear done/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to delete all tasks.')
  })

  it('shows no toast when Clear done succeeds for every task', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost/tasks', () =>
        HttpResponse.json([{ id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 }])
      )
    )
    server.use(http.delete('http://localhost/tasks/:id', () => HttpResponse.json('deleted')))

    renderWithStore()
    await screen.findByText('Buy milk')

    await user.click(screen.getByRole('button', { name: /clear done/i }))

    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
