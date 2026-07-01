import type { Course, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, Lesson, Document, Task, Resource };

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
  | { type: 'loadProgress' }
  | { type: 'saveProgress'; payload: UserProgress }
  | { type: 'askQuestion'; payload: { question: string; history: ChatMessage[] } }
  | { type: 'checkCode'; payload: { taskId: string; lessonId: string; filePath: string; kind?: string; expectedFiles?: string[] } }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
  | { type: 'progress'; payload: UserProgress }
  | { type: 'answer'; payload: string }
  | { type: 'ragError'; payload: string }
  | { type: 'checkResult'; payload: CheckResult }
