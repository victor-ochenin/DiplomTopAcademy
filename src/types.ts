export interface CourseListItem {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  icon?: string
  lessonCount: number
  taskCount: number
  itemsCount: number
  lessonIds: string[]
}

export interface Course extends Omit<CourseListItem, 'lessonCount' | 'taskCount' | 'itemsCount' | 'lessonIds'> {
  lessons: Lesson[]
}

export interface Document {
  id: string
  title: string
  content: string
}

export interface Lesson {
  id: string
  title: string
  documents: Document[]
  tasks: Task[]
  resources: Resource[]
}

export type Task = 
  | {
      id: string
      type: 'choice'
      question: string
      options: string[]
      correctAnswer: string
    }
  | {
      id: string
      type: 'open'
      question: string
      acceptableAnswers: string[]
    }
  | {
      id: string
      type: 'coding'
      kind: 'file' | 'project'
      question: string
      instructions: string
      criteria: string[]
      starterCode?: string
      expectedFiles: string[]
    }

export interface Resource {
  title: string
  url: string
}
