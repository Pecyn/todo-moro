import { describe, expect, it } from 'vitest'
import { store } from '../../app/store'

describe('store', () => {
  it('registers the tasksApi slice', () => {
    expect(store.getState()).toHaveProperty('tasksApi')
  })

  it('initialises tasksApi with no queries or mutations registered', () => {
    const { tasksApi } = store.getState()

    expect(tasksApi.queries).toEqual({})
    expect(tasksApi.mutations).toEqual({})
    expect(tasksApi.config.reducerPath).toBe('tasksApi')
  })
})
