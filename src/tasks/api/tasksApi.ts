import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Task } from '../types'
import { showToast } from '../../app/toastSlice'

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
    }),

    addTask: builder.mutation<Task, { text: string }>({
      query: ({ text }) => ({ url: '/tasks', method: 'POST', body: { text } }),
      async onQueryStarted({ text }, { dispatch, queryFulfilled }) {
        const tempId = crypto.randomUUID()
        const patchResult = dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            draft.push({ id: tempId, text, completed: false, createdDate: 0 })
          })
        )
        try {
          const { data: createdTask } = await queryFulfilled
          dispatch(
            tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
              const index = draft.findIndex((t) => t.id === tempId)
              if (index !== -1) draft[index] = createdTask
            })
          )
        } catch {
          patchResult.undo()
          dispatch(showToast('Something went wrong.'))
        }
      },
    }),

    updateTaskText: builder.mutation<Task, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `/tasks/${id}`,
        method: 'POST',
        body: { text },
      }),
      async onQueryStarted({ id, text }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const task = draft.find((t) => t.id === id)
            if (task) task.text = text
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
          dispatch(showToast('Something went wrong.'))
        }
      },
    }),

    completeTask: builder.mutation<Task, { id: string; silent?: boolean }>({
      query: ({ id }) => ({ url: `/tasks/${id}/complete`, method: 'POST' }),
      async onQueryStarted({ id, silent }, { dispatch, queryFulfilled }) {
        // Captured inside the optimistic patch below, read later in the catch block for the revert
        let previous: { completed: boolean; completedDate?: number } | undefined
        dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const task = draft.find((t) => t.id === id)
            if (task) {
              previous = {
                completed: task.completed,
                completedDate: task.completedDate,
              }
              task.completed = true
              task.completedDate = Date.now()
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          const previousState = previous
          if (previousState) {
            dispatch(
              tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
                const task = draft.find((t) => t.id === id)
                if (task) {
                  task.completed = previousState.completed
                  task.completedDate = previousState.completedDate
                }
              })
            )
          }
          if (!silent) dispatch(showToast('Something went wrong.'))
        }
      },
    }),

    incompleteTask: builder.mutation<Task, string>({
      query: (id) => ({ url: `/tasks/${id}/incomplete`, method: 'POST' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const task = draft.find((t) => t.id === id)
            if (task) {
              task.completed = false
              task.completedDate = undefined
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
          dispatch(showToast('Something went wrong.'))
        }
      },
    }),

    deleteTask: builder.mutation<string, { id: string; silent?: boolean }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      async onQueryStarted({ id, silent }, { dispatch, queryFulfilled }) {
        // Captured inside the optimistic patch below, read later in the catch block for the revert
        let removedTask: Task | undefined
        dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const index = draft.findIndex((t) => t.id === id)
            if (index !== -1) {
              removedTask = { ...draft[index] }
              draft.splice(index, 1)
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          const taskToRestore = removedTask
          if (taskToRestore) {
            dispatch(
              tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
                if (!draft.some((t) => t.id === taskToRestore.id)) {
                  draft.push(taskToRestore)
                }
              })
            )
          }
          if (!silent) dispatch(showToast('Something went wrong.'))
        }
      },
    }),
  }),
})

export const {
  useGetTasksQuery,
  useAddTaskMutation,
  useUpdateTaskTextMutation,
  useCompleteTaskMutation,
  useIncompleteTaskMutation,
  useDeleteTaskMutation,
} = tasksApi
