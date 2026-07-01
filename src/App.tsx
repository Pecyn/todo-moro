import { Toast } from './app/Toast'
import { TaskList } from './tasks/components/TaskList'

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-[480px]">
        <h1 className="mb-6 text-2xl font-bold">My tasks</h1>
        <TaskList />
      </div>
      <Toast />
    </main>
  )
}

export default App
