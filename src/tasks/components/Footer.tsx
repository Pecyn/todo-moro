import type { Filter, Task } from '../types'

interface Props {
  tasks: Task[]
  filter: Filter
  onFilterChange: (filter: Filter) => void
  onClearDone: () => void
  onCompleteAllVisible: () => void
  bulkAction: 'complete' | 'clear' | null
}

const PILLS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Done', value: 'done' },
]

export function Footer({
  tasks,
  filter,
  onFilterChange,
  onClearDone,
  onCompleteAllVisible,
  bulkAction,
}: Props) {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  const filteredVisible = tasks.filter((t) =>
    filter === 'active' ? !t.completed : filter === 'done' ? t.completed : true
  )
  const activeVisible = filteredVisible.filter((t) => !t.completed)

  const isBulkLoading = bulkAction !== null
  const canCompleteAll = activeVisible.length > 0
  const canClearDone = completedCount > 0

  return (
    <div className="flex items-center justify-between gap-4 mt-4 text-sm">
      <span className="shrink-0 text-gray-500">
        {completedCount} of {totalCount} completed
      </span>

      <div className="flex items-center gap-2">
        {PILLS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            disabled={isBulkLoading}
            className={
              (filter === value
                ? 'rounded-full bg-gray-900 px-3 py-1 text-white'
                : 'rounded-full border border-gray-200 px-3 py-1 text-gray-900') +
              ' disabled:opacity-40 disabled:cursor-not-allowed'
            }
          >
            {label}
          </button>
        ))}
        <button
          onClick={onCompleteAllVisible}
          disabled={isBulkLoading || !canCompleteAll}
          className="ml-2 underline text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {bulkAction === 'complete' ? 'Completing…' : 'Complete all'}
        </button>
      </div>

      <button
        onClick={onClearDone}
        disabled={isBulkLoading || !canClearDone}
        className="shrink-0 underline text-gray-500 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {bulkAction === 'clear' ? 'Clearing…' : 'Clear done'}
      </button>
    </div>
  )
}
