import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'

const task: Task = { id: '1', text: 'Buy milk', completed: false, createdDate: 1000 }

const noop = {
  onToggle: () => {},
  onDelete: () => {},
  onRename: () => {},
}

describe('TaskItem', () => {
  it('renders the task text', () => {
    render(<TaskItem task={task} {...noop} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('applies strikethrough and reduced opacity when completed', () => {
    render(<TaskItem task={{ ...task, completed: true }} {...noop} />)
    const text = screen.getByText('Buy milk')
    expect(text).toHaveClass('line-through')
    expect(text.closest('.opacity-50')).toBeInTheDocument()
  })

  it('shows input with task text when edit icon is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={task} {...noop} />)
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('textbox')).toHaveValue('Buy milk')
  })

  it('cancels edit on Escape and restores original text', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={task} {...noop} />)
    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Changed')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('calls onRename with new text on Enter', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<TaskItem task={task} {...noop} onRename={onRename} />)
    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'New text')
    await user.keyboard('{Enter}')
    expect(onRename).toHaveBeenCalledWith('1', 'New text')
  })

  it('focuses the input when entering edit mode', async () => {
    const user = userEvent.setup()
    render(<TaskItem task={task} {...noop} />)
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('textbox')).toHaveFocus()
  })
})
