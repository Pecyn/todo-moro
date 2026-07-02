import { configureStore } from '@reduxjs/toolkit'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import toastSlice from '../../app/toastSlice'
import { tasksApi } from './tasksApi'

// ─── mutation helpers ─────────────────────────────────────────────────────────

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const initialTasks = [
  { id: '1', text: 'Buy milk', completed: false, createdDate: 1000 },
  { id: '2', text: 'Walk dog', completed: false, createdDate: 2000 },
]

function makeStore() {
  return configureStore({
    reducer: {
      [tasksApi.reducerPath]: tasksApi.reducer,
      toast: toastSlice.reducer,
    },
    middleware: (gDM) => gDM().concat(tasksApi.middleware),
  })
}

function getCachedTasks(s: ReturnType<typeof makeStore>) {
  return tasksApi.endpoints.getTasks.select(undefined)(s.getState()).data ?? []
}

async function storeWithTasks() {
  server.use(http.get('http://localhost/tasks', () => HttpResponse.json(initialTasks)))
  const s = makeStore()
  await s.dispatch(tasksApi.endpoints.getTasks.initiate())
  return s
}

// ─── store shape ──────────────────────────────────────────────────────────────

describe('store', () => {
  it('registers the tasksApi slice', () => {
    const s = makeStore()
    expect(s.getState()).toHaveProperty('tasksApi')
  })

  it('initialises tasksApi with no queries or mutations registered', () => {
    const s = makeStore()
    const { tasksApi: api } = s.getState()

    expect(api.queries).toEqual({})
    expect(api.mutations).toEqual({})
    expect(api.config.reducerPath).toBe('tasksApi')
  })
})

// ─── addTask ──────────────────────────────────────────────────────────────────

describe('addTask', () => {
  it('adds a temp entry to the cache optimistically', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks', () => new Promise(() => {})))

    s.dispatch(tasksApi.endpoints.addTask.initiate({ text: 'New task' }))

    const tasks = getCachedTasks(s)
    expect(tasks).toHaveLength(3)
    expect(tasks.at(-1)).toMatchObject({ text: 'New task', completed: false, createdDate: 0 })
  })

  it('replaces the temp entry with the real task on success', async () => {
    const s = await storeWithTasks()
    const realTask = { id: 'real-id', text: 'New task', completed: false, createdDate: 9999 }
    server.use(http.post('http://localhost/tasks', () => HttpResponse.json(realTask)))

    await s.dispatch(tasksApi.endpoints.addTask.initiate({ text: 'New task' }))
    await waitFor(() => {
      const tasks = getCachedTasks(s)
      expect(tasks.find((t) => t.id === 'real-id')).toEqual(realTask)
    })

    const tasks = getCachedTasks(s)
    expect(tasks).toHaveLength(3)
    expect(tasks.find((t) => t.createdDate === 0)).toBeUndefined()
  })

  it('reverts the cache when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.addTask.initiate({ text: 'New task' }))

    expect(getCachedTasks(s)).toHaveLength(3)
    await waitFor(() => expect(getCachedTasks(s)).toHaveLength(2))
  })
})

// ─── updateTaskText ───────────────────────────────────────────────────────────

describe('updateTaskText', () => {
  it('patches task text in the cache optimistically', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1', () => new Promise(() => {})))

    s.dispatch(tasksApi.endpoints.updateTaskText.initiate({ id: '1', text: 'Updated' }))

    expect(getCachedTasks(s).find((t) => t.id === '1')?.text).toBe('Updated')
  })

  it('reverts the cache when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.updateTaskText.initiate({ id: '1', text: 'Updated' }))

    await waitFor(() =>
      expect(getCachedTasks(s).find((t) => t.id === '1')?.text).toBe('Buy milk')
    )
  })
})

// ─── completeTask ─────────────────────────────────────────────────────────────

describe('completeTask', () => {
  it('patches completed: true in the cache optimistically', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1/complete', () => new Promise(() => {})))

    s.dispatch(tasksApi.endpoints.completeTask.initiate({ id: '1' }))

    const task = getCachedTasks(s).find((t) => t.id === '1')
    expect(task?.completed).toBe(true)
    expect(typeof task?.completedDate).toBe('number')
  })

  it('reverts the cache when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1/complete', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.completeTask.initiate({ id: '1' }))

    await waitFor(() =>
      expect(getCachedTasks(s).find((t) => t.id === '1')?.completed).toBe(false)
    )
  })

  it('dispatches showToast with the generic message when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1/complete', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.completeTask.initiate({ id: '1' }))

    await waitFor(() => expect(s.getState().toast.message).toBe('Something went wrong.'))
  })

  it('does not dispatch a toast when silent is true, even on error', async () => {
    const s = await storeWithTasks()
    server.use(http.post('http://localhost/tasks/1/complete', () => HttpResponse.error()))

    await s.dispatch(tasksApi.endpoints.completeTask.initiate({ id: '1', silent: true }))

    await waitFor(() =>
      expect(getCachedTasks(s).find((t) => t.id === '1')?.completed).toBe(false)
    )
    expect(s.getState().toast.message).toBeNull()
  })
})

// ─── incompleteTask ───────────────────────────────────────────────────────────

describe('incompleteTask', () => {
  it('patches completed: false and clears completedDate optimistically', async () => {
    const completedTasks = [
      { id: '1', text: 'Buy milk', completed: true, createdDate: 1000, completedDate: 5000 },
      { id: '2', text: 'Walk dog', completed: false, createdDate: 2000 },
    ]
    server.use(http.get('http://localhost/tasks', () => HttpResponse.json(completedTasks)))
    const s = makeStore()
    await s.dispatch(tasksApi.endpoints.getTasks.initiate())

    server.use(http.post('http://localhost/tasks/1/incomplete', () => new Promise(() => {})))
    s.dispatch(tasksApi.endpoints.incompleteTask.initiate('1'))

    const task = getCachedTasks(s).find((t) => t.id === '1')
    expect(task?.completed).toBe(false)
    expect(task?.completedDate).toBeUndefined()
  })

  it('reverts the cache when the server returns an error', async () => {
    const completedTasks = [
      { id: '1', text: 'Buy milk', completed: true, createdDate: 1000, completedDate: 5000 },
    ]
    server.use(http.get('http://localhost/tasks', () => HttpResponse.json(completedTasks)))
    const s = makeStore()
    await s.dispatch(tasksApi.endpoints.getTasks.initiate())

    server.use(http.post('http://localhost/tasks/1/incomplete', () => HttpResponse.error()))
    s.dispatch(tasksApi.endpoints.incompleteTask.initiate('1'))

    await waitFor(() =>
      expect(getCachedTasks(s).find((t) => t.id === '1')?.completed).toBe(true)
    )
  })
})

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('removes the task from the cache optimistically', async () => {
    const s = await storeWithTasks()
    server.use(http.delete('http://localhost/tasks/1', () => new Promise(() => {})))

    s.dispatch(tasksApi.endpoints.deleteTask.initiate({ id: '1' }))

    const tasks = getCachedTasks(s)
    expect(tasks).toHaveLength(1)
    expect(tasks.find((t) => t.id === '1')).toBeUndefined()
  })

  it('reverts the cache when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.delete('http://localhost/tasks/1', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.deleteTask.initiate({ id: '1' }))

    await waitFor(() => expect(getCachedTasks(s)).toHaveLength(2))
  })

  it('dispatches showToast with the generic message when the server returns an error', async () => {
    const s = await storeWithTasks()
    server.use(http.delete('http://localhost/tasks/1', () => HttpResponse.error()))

    s.dispatch(tasksApi.endpoints.deleteTask.initiate({ id: '1' }))

    await waitFor(() => expect(s.getState().toast.message).toBe('Something went wrong.'))
  })

  it('does not dispatch a toast when silent is true, even on error', async () => {
    const s = await storeWithTasks()
    server.use(http.delete('http://localhost/tasks/1', () => HttpResponse.error()))

    await s.dispatch(tasksApi.endpoints.deleteTask.initiate({ id: '1', silent: true }))

    await waitFor(() => expect(getCachedTasks(s)).toHaveLength(2))
    expect(s.getState().toast.message).toBeNull()
  })
})
