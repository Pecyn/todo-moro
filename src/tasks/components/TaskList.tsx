import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useAppDispatch } from '../../app/store'
import { showToast } from '../../app/toastSlice'
import {
  useCompleteTaskMutation,
  useDeleteTaskMutation,
  useGetTasksQuery,
  useIncompleteTaskMutation,
  useUpdateTaskTextMutation,
} from '../api/tasksApi'
import type { Filter } from '../types'
import { AddTaskForm } from './AddTaskForm'
import { Footer } from './Footer'
import { TaskItem } from './TaskItem'
import { TaskListEmptyState } from './TaskListEmptyState'
import { TaskListErrorState } from './TaskListErrorState'

function buildBulkErrorMessage(
  action: 'complete' | 'delete',
  failed: number,
  total: number
): string {
  if (failed === total) {
    return action === 'complete'
      ? 'Failed to complete all tasks.'
      : 'Failed to delete all tasks.'
  }
  return action === 'complete'
    ? `Failed to complete ${failed} of ${total} tasks.`
    : `Failed to delete ${failed} of ${total} tasks.`
}

export function TaskList() {
  const dispatch = useAppDispatch()
  const { data, isLoading, isFetching, isError, refetch } = useGetTasksQuery()
  const [completeTask] = useCompleteTaskMutation()
  const [incompleteTask] = useIncompleteTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [updateTaskText] = useUpdateTaskTextMutation()
  const [filter, setFilter] = useState<Filter>('all')
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  // isLoading is only true for the very first fetch (no cached data yet); it stays
  // false on a refetch() call, so isFetching is needed too to cover the retry window.
  if (isLoading || isFetching) {
    return (
      <div className="flex flex-col gap-2">
        <span className="sr-only">Loading tasks…</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-testid="task-skeleton"
            className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-100 p-4"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return <TaskListErrorState onRetry={refetch} />
  }

  const allTasks = data ?? []
  const filteredTasks = allTasks.filter((t) =>
    filter === 'active' ? !t.completed : filter === 'done' ? t.completed : true
  )

  async function handleCompleteAllVisible() {
    const active = filteredTasks.filter((t) => !t.completed)
    setIsBulkLoading(true)
    try {
      const results = await Promise.allSettled(
        active.map((t) => completeTask({ id: t.id, silent: true }).unwrap())
      )
      const failedCount = results.filter((r) => r.status === 'rejected').length
      if (failedCount > 0) {
        dispatch(
          showToast(
            buildBulkErrorMessage('complete', failedCount, active.length)
          )
        )
      }
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function handleClearDone() {
    const done = allTasks.filter((t) => t.completed)
    setIsBulkLoading(true)
    try {
      const results = await Promise.allSettled(
        done.map((t) => deleteTask({ id: t.id, silent: true }).unwrap())
      )
      const failedCount = results.filter((r) => r.status === 'rejected').length
      if (failedCount > 0) {
        dispatch(
          showToast(buildBulkErrorMessage('delete', failedCount, done.length))
        )
      }
    } finally {
      setIsBulkLoading(false)
    }
  }

  return (
    <>
      <AddTaskForm />
      {allTasks.length === 0 ? (
        <TaskListEmptyState variant="no-tasks" />
      ) : filteredTasks.length === 0 ? (
        <TaskListEmptyState variant="no-filtered-tasks" filter={filter} />
      ) : (
        <ul className="flex flex-col gap-2 mt-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 48 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                layout
              >
                <TaskItem
                  task={task}
                  onToggle={(id) =>
                    task.completed ? incompleteTask(id) : completeTask({ id })
                  }
                  onDelete={(id) => deleteTask({ id })}
                  onRename={(id, text) => updateTaskText({ id, text })}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <motion.div layout>
        <Footer
          tasks={allTasks}
          filter={filter}
          onFilterChange={setFilter}
          onClearDone={handleClearDone}
          onCompleteAllVisible={handleCompleteAllVisible}
          isBulkLoading={isBulkLoading}
        />
      </motion.div>
    </>
  )
}
