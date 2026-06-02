// export type TaskType = 'choice' | 'coding' | 'open'

export interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  content: string
  // tasks: Task[]
  resources: Resource[]
}

// export interface Task {
//   id: string
//   type: TaskType
//   question: string
//   options?: string[]
//   correctAnswer?: string | string[]
// }

export interface Resource {
  title: string
  url: string
}
