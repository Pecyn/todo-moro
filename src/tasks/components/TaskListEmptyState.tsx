import type { Filter } from '../types'

type Props =
  | { variant: 'no-tasks' }
  | { variant: 'no-filtered-tasks'; filter: Filter }

export function TaskListEmptyState(props: Props) {
  if (props.variant === 'no-tasks') {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          data-testid="empty-state-icon"
          className="text-gray-300"
        >
          <rect x="8" y="6" width="32" height="38" rx="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 18h16M16 24h16M16 30h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-gray-400">No tasks yet. Add your first task above.</p>
      </div>
    )
  }

  const message = props.filter === 'done' ? 'No completed tasks yet.' : 'No active tasks.'
  return <p className="py-8 text-center text-sm text-gray-400">{message}</p>
}
