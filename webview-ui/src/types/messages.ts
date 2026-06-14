import type { Course, Lesson, Document, Task, Resource } from '../../../src/types';
export type { Course, Lesson, Document, Task, Resource };

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'getCourses' }

export type ExtensionMessage =
  | { type: 'courses'; payload: Course[] }
