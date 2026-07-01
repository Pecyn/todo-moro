import { type FormEvent, useState } from 'react'
import { useAddTaskMutation } from '../api/tasksApi'

export function AddTaskForm() {
  const [text, setText] = useState('')
  const [addTask] = useAddTaskMutation()

  async function handleSubmit(e: FormEvent) {
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
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit" disabled={!text.trim()}>Add</button>
    </form>
  )
}
