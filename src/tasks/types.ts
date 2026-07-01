export interface Task {
  id: string
  text: string
  completed: boolean
  createdDate: number
  completedDate?: number
}

export type NewTask = Pick<Task, 'text'>
