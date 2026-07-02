import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store'
import { clearToast } from './toastSlice'

export function Toast() {
  const message = useAppSelector((s) => s.toast.message)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => dispatch(clearToast()), 3000)
    return () => clearTimeout(t)
  }, [message, dispatch])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
    >
      {message}
    </div>
  )
}
