import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Task } from '../types'

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
    }),
  }),
})

export const { useGetTasksQuery } = tasksApi
