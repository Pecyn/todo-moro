import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Task } from '../types'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, text: string) => void
}

export function TaskItem({ task, onToggle, onDelete, onRename }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  function startEdit() {
    cancelledRef.current = false
    setDraft(task.text)
    setIsEditing(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onRename(task.id, draft)
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      cancelledRef.current = true
      setIsEditing(false)
    }
  }

  function handleBlur() {
    if (!cancelledRef.current) {
      onRename(task.id, draft)
    }
    setIsEditing(false)
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-gray-400 ${task.completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <motion.circle
            cx="12"
            cy="12"
            r="11"
            stroke="#D1D5DB"
            strokeWidth="2"
            animate={{ fill: task.completed ? '#1D9E75' : 'rgba(0,0,0,0)' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
          <motion.path
            d="M6 12l4 4 8-8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="20"
            animate={{ strokeDashoffset: task.completed ? 0 : 20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </svg>
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 rounded border border-gray-300 px-2 py-1 outline-none focus:border-blue-500"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>
          {task.text}
        </span>
      )}

      <div className="ml-auto flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <button
          onClick={startEdit}
          aria-label="Edit task"
          className="text-gray-400 hover:text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="text-gray-400 hover:text-red-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M5 4V2h6v2M6 7v6M10 7v6M4 4l1 10h6l1-10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
