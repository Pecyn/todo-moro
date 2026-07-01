import {
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  useGetTasksQuery,
  useIncompleteTaskMutation,
  useUpdateTaskTextMutation,
} from '../api/tasksApi'
import { AddTaskForm } from './AddTaskForm'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const { data, isLoading, isError } = useGetTasksQuery()
  const [completeTask] = useCompleteTaskMutation()
  const [incompleteTask] = useIncompleteTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [updateTaskText] = useUpdateTaskTextMutation()

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
    <>
      <AddTaskForm />
      <ul className="flex flex-col gap-2">
        {data?.map((task) => (
          <li key={task.id}>
            <TaskItem
              task={task}
              onToggle={(id) => task.completed ? incompleteTask(id) : completeTask(id)}
              onDelete={(id) => deleteTask(id)}
              onRename={(id, text) => updateTaskText({ id, text })}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
