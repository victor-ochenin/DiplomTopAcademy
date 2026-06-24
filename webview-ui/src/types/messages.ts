import type { Course, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, Lesson, Document, Task, Resource };

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getCourses' }
  | { type: 'askQuestion'; payload: { question: string; history: ChatMessage[] } }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
  | { type: 'answer'; payload: string }
  | { type: 'ragError'; payload: string }
