import type { Course, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, Lesson, Document, Task, Resource };

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
  | { type: 'askQuestion'; payload: { question: string; history: ChatMessage[] } }
  | { type: 'checkCode'; payload: { taskId: string; lessonId: string; filePath: string } }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
  | { type: 'answer'; payload: string }
  | { type: 'ragError'; payload: string }
  | { type: 'checkResult'; payload: CheckResult }
