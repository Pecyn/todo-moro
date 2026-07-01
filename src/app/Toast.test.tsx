import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { tasksApi } from '../tasks/api/tasksApi'
import { showToast } from './toastSlice'
import toastSlice from './toastSlice'
import { Toast } from './Toast'

function makeStore() {
  return configureStore({
    reducer: {
      [tasksApi.reducerPath]: tasksApi.reducer,
      toast: toastSlice.reducer,
    },
    middleware: (gDM) => gDM().concat(tasksApi.middleware),
  })
}

afterEach(() => vi.useRealTimers())

describe('Toast', () => {
  it('renders nothing when there is no toast message', () => {
    render(<Provider store={makeStore()}><Toast /></Provider>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders the toast message', () => {
    const store = makeStore()
    store.dispatch(showToast('Something went wrong.'))
    render(<Provider store={store}><Toast /></Provider>)
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong.')
  })

  it('dismisses the toast after 3000ms', () => {
    vi.useFakeTimers()
    const store = makeStore()
    store.dispatch(showToast('Oops'))
    render(<Provider store={store}><Toast /></Provider>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
