type Props = {
  onRetry: () => void
}

export function TaskListErrorState({ onRetry }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 py-12 text-center"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        data-testid="error-state-icon"
        className="text-gray-400"
      >
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 16v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="32" r="1.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      </svg>
      <p className="text-gray-400">Couldn't load your tasks.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Retry
      </button>
    </div>
  )
}
