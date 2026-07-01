import { describe, expect, it } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import toastSlice, { showToast, clearToast } from './toastSlice'

function makeStore() {
  return configureStore({ reducer: { toast: toastSlice.reducer } })
}

describe('toastSlice', () => {
  it('showToast sets the message', () => {
    const store = makeStore()
    store.dispatch(showToast('Something went wrong.'))
    expect(store.getState().toast.message).toBe('Something went wrong.')
  })

  it('clearToast clears the message', () => {
    const store = makeStore()
    store.dispatch(showToast('oops'))
    store.dispatch(clearToast())
    expect(store.getState().toast.message).toBeNull()
  })
})
