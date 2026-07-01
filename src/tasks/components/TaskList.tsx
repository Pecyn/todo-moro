import { useGetTasksQuery } from '../api/tasksApi'

export function TaskList() {
  const { data, isLoading, isError } = useGetTasksQuery()

  if (isLoading) {
    return <p>Loading tasks…</p>
  }

  if (isError) {
    return <p>Something went wrong while loading tasks.</p>
  }

  return (
    <ul>
      {data?.map((task) => <li key={task.id}>{task.text}</li>)}
    </ul>
  )
}
