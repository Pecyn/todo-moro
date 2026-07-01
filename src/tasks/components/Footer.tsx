import type { Filter, Task } from '../types'

interface Props {
  tasks: Task[]
  filter: Filter
  onFilterChange: (filter: Filter) => void
  onClearDone: () => void
  onCompleteAllVisible: () => void
  isBulkLoading: boolean
}

const PILLS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Done', value: 'done' },
]

export function Footer({ tasks, filter, onFilterChange, onClearDone, onCompleteAllVisible, isBulkLoading }: Props) {
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  const filteredVisible = tasks.filter((t) =>
    filter === 'active' ? !t.completed : filter === 'done' ? t.completed : true
  )
  const activeVisible = filteredVisible.filter((t) => !t.completed)

  return (
    <div className="flex items-center justify-between gap-4 mt-4 text-sm">
      <span className="shrink-0 text-gray-500">{completedCount} of {totalCount} completed</span>

      <div className="flex items-center gap-2">
        {PILLS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            disabled={isBulkLoading}
            className={
              filter === value
                ? 'rounded-full bg-gray-900 px-3 py-1 text-white'
                : 'rounded-full border border-gray-200 px-3 py-1 text-gray-900'
            }
          >
            {label}
          </button>
        ))}
        {activeVisible.length > 0 && (
          <button
            onClick={onCompleteAllVisible}
            disabled={isBulkLoading}
            className="ml-2 underline text-gray-500 hover:text-gray-900"
          >
            Complete all
          </button>
        )}
      </div>

      {completedCount > 0 && (
        <button
          onClick={onClearDone}
          disabled={isBulkLoading}
          className="shrink-0 underline text-gray-500 hover:text-red-500"
        >
          Clear done
        </button>
      )}
    </div>
  )
}
