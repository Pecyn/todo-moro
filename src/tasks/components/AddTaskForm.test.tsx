import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Provider } from 'react-redux'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import toastSlice from '../../app/toastSlice'
import { tasksApi } from '../api/tasksApi'
import { AddTaskForm } from './AddTaskForm'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeStore() {
  return configureStore({
    reducer: {
      [tasksApi.reducerPath]: tasksApi.reducer,
      toast: toastSlice.reducer,
    },
    middleware: (gDM) => gDM().concat(tasksApi.middleware),
  })
}

describe('AddTaskForm', () => {
  it('disables Add button when input is empty', () => {
    render(<Provider store={makeStore()}><AddTaskForm /></Provider>)
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })

  it('enables Add button when input has text', async () => {
    const user = userEvent.setup()
    render(<Provider store={makeStore()}><AddTaskForm /></Provider>)
    await user.type(screen.getByRole('textbox'), 'Buy milk')
    expect(screen.getByRole('button', { name: /add/i })).toBeEnabled()
  })

  it('calls POST /tasks with the input text on submit', async () => {
    let requestBody: unknown
    server.use(
      http.post('http://localhost/tasks', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1', text: 'Buy milk', completed: false, createdDate: 1 })
      })
    )
    const user = userEvent.setup()
    render(<Provider store={makeStore()}><AddTaskForm /></Provider>)
    await user.type(screen.getByRole('textbox'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(requestBody).toEqual({ text: 'Buy milk' }))
  })

  it('clears input after successful add', async () => {
    server.use(
      http.post('http://localhost/tasks', () =>
        HttpResponse.json({ id: '1', text: 'Buy milk', completed: false, createdDate: 1 })
      )
    )
    const user = userEvent.setup()
    render(<Provider store={makeStore()}><AddTaskForm /></Provider>)
    await user.type(screen.getByRole('textbox'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''))
  })

  it('sends trimmed text to the API', async () => {
    let requestBody: unknown
    server.use(
      http.post('http://localhost/tasks', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1', text: 'Buy milk', completed: false, createdDate: 1 })
      })
    )
    const user = userEvent.setup()
    render(<Provider store={makeStore()}><AddTaskForm /></Provider>)
    await user.type(screen.getByRole('textbox'), '  Buy milk  ')
    await user.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => expect(requestBody).toEqual({ text: 'Buy milk' }))
  })
})
