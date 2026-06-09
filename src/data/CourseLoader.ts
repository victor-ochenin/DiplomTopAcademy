import { initCourses, loadCourses, loadCoursesAsync } from './courses';
import type { Course } from './types';

let initialized = false;

export function initCourseLoader(basePath: string) {
  if (!initialized) {
    initCourses(basePath);
    initialized = true;
  }
}

export function getAllCourses(): Course[] {
  return loadCourses();
}

export function getCourse(id: string): Course | undefined {
  return loadCourses().find(c => c.id === id);
}

export async function getAllCoursesAsync(): Promise<Course[]> {
  return loadCoursesAsync();
}
