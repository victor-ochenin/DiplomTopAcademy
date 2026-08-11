import type { Course, CourseListItem, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, CourseListItem, Lesson, Document, Task, Resource };

export interface UserProgress {
  completedTasks: Record<string, boolean>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface CheckResult {
  passed: boolean
  feedback: string
}

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getCourses' }
  | { type: 'getCourseDetails'; payload: string }
  | { type: 'loadProgress' }
  | { type: 'saveProgress'; payload: UserProgress }
  | { type: 'askQuestion'; payload: { question: string; history: ChatMessage[]; requestId: number } }
  | { type: 'checkCode'; payload: { taskId: string; lessonId: string; filePath: string; kind?: string; expectedFiles?: string[] } }

export type ExtensionMessage =
  | { type: 'courses'; payload: CourseListItem[] }
  | { type: 'courseDetails'; payload: Course }
  | { type: 'progress'; payload: UserProgress }
  | { type: 'answer'; requestId: number; payload: string }
  | { type: 'ragError'; requestId: number; payload: string }
  | { type: 'checkResult'; payload: CheckResult }
