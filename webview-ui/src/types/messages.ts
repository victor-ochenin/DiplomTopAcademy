export interface Course {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
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
      question: string
    }

export interface Resource {
  title: string
  url: string
}

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getCourses' }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
