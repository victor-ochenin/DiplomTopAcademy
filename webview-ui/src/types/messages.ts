import type { Course, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, Lesson, Document, Task, Resource };

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getCourses' }
  | { type: 'askQuestion'; payload: string }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
  | { type: 'answer'; payload: string }
  | { type: 'ragError'; payload: string }
