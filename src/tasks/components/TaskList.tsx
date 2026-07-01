import { useGetTasksQuery } from '../api/tasksApi'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const { data, isLoading, isError } = useGetTasksQuery()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <span className="sr-only">Loading tasks…</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-testid="task-skeleton"
            className="h-14 animate-pulse rounded-lg border border-gray-200 p-4"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p>Something went wrong while loading tasks.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {data?.map((task) => (
        <li key={task.id}>
          <TaskItem
            task={task}
            onToggle={() => {}}
            onDelete={() => {}}
            onRename={() => {}}
          />
        </li>
      ))}
    </ul>
  )
}
