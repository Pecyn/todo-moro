import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  endpoints: () => ({}),
})
