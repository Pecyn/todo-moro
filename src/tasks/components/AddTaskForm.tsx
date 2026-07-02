import { useState } from 'react'
import { useAddTaskMutation } from '../api/tasksApi'

export function AddTaskForm() {
  const [text, setText] = useState('')
  const [addTask] = useAddTaskMutation()

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      await addTask({ text: trimmed }).unwrap()
      setText('')
    } catch {
      // error surfaced via toast (dispatched in slice)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
        placeholder="New task…"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="w-20 rounded-lg bg-green-600 text-white py-2 hover:bg-green-700 disabled:opacity-40"
      >
        Add
      </button>
    </form>
  )
}
