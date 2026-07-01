import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../types'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders "X of Y completed" with correct counts', () => {
    const tasks: Task[] = [
      { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
      { id: '2', text: 'Walk dog', completed: true, createdDate: 2, completedDate: 3 },
      { id: '3', text: 'Read book', completed: true, createdDate: 4, completedDate: 5 },
    ]
    render(
      <Footer
        tasks={tasks}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    expect(screen.getByText('2 of 3 completed')).toBeInTheDocument()
  })

  it('All pill has dark background class by default', () => {
    render(
      <Footer
        tasks={[]}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    expect(screen.getByRole('button', { name: /^all$/i })).toHaveClass('bg-gray-900')
  })

  it('clicking Active pill calls onFilterChange("active")', async () => {
    const onFilterChange = vi.fn()
    render(
      <Footer
        tasks={[]}
        filter="all"
        onFilterChange={onFilterChange}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^active$/i }))
    expect(onFilterChange).toHaveBeenCalledWith('active')
  })

  it('clicking Done pill calls onFilterChange("done")', async () => {
    const onFilterChange = vi.fn()
    render(
      <Footer
        tasks={[]}
        filter="all"
        onFilterChange={onFilterChange}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onFilterChange).toHaveBeenCalledWith('done')
  })

  it('"Clear done" is not rendered when no completed tasks', () => {
    const tasks: Task[] = [
      { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
    ]
    render(
      <Footer
        tasks={tasks}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    expect(screen.queryByRole('button', { name: /clear done/i })).not.toBeInTheDocument()
  })

  it('"Clear done" is rendered when at least one completed task exists', () => {
    const tasks: Task[] = [
      { id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 },
    ]
    render(
      <Footer
        tasks={tasks}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={vi.fn()}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    expect(screen.getByRole('button', { name: /clear done/i })).toBeInTheDocument()
  })

  it('clicking "Clear done" calls onClearDone', async () => {
    const onClearDone = vi.fn()
    const tasks: Task[] = [
      { id: '1', text: 'Buy milk', completed: true, createdDate: 1, completedDate: 2 },
    ]
    render(
      <Footer
        tasks={tasks}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={onClearDone}
        onCompleteAllVisible={vi.fn()}
        isBulkLoading={false}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /clear done/i }))
    expect(onClearDone).toHaveBeenCalledOnce()
  })

  it('clicking "Complete all" calls onCompleteAllVisible', async () => {
    const onCompleteAllVisible = vi.fn()
    const activeTasks: Task[] = [
      { id: '1', text: 'Buy milk', completed: false, createdDate: 1 },
    ]
    render(
      <Footer
        tasks={activeTasks}
        filter="all"
        onFilterChange={vi.fn()}
        onClearDone={vi.fn()}
        onCompleteAllVisible={onCompleteAllVisible}
        isBulkLoading={false}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /complete all/i }))
    expect(onCompleteAllVisible).toHaveBeenCalledOnce()
  })
})
