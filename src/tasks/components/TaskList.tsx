import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
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

export function TaskList() {
  const { data, isLoading, isError } = useGetTasksQuery()
  const [completeTask] = useCompleteTaskMutation()
  const [incompleteTask] = useIncompleteTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [updateTaskText] = useUpdateTaskTextMutation()
  const [filter, setFilter] = useState<Filter>('all')
  const [isBulkLoading, setIsBulkLoading] = useState(false)

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

  const allTasks = data ?? []
  const filteredTasks = allTasks.filter((t) =>
    filter === 'active' ? !t.completed : filter === 'done' ? t.completed : true
  )

  async function handleCompleteAllVisible() {
    const active = filteredTasks.filter((t) => !t.completed)
    setIsBulkLoading(true)
    try {
      await Promise.allSettled(active.map((t) => completeTask(t.id)))
    } finally {
      setIsBulkLoading(false)
    }
  }

  async function handleClearDone() {
    const done = allTasks.filter((t) => t.completed)
    setIsBulkLoading(true)
    try {
      await Promise.allSettled(done.map((t) => deleteTask(t.id)))
    } finally {
      setIsBulkLoading(false)
    }
  }

  return (
    <>
      <AddTaskForm />
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
                  task.completed ? incompleteTask(id) : completeTask(id)
                }
                onDelete={(id) => deleteTask(id)}
                onRename={(id, text) => updateTaskText({ id, text })}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
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
