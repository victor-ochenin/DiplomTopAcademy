import { initCourses, loadCoursesAsync } from './courses';
import type { Course } from './types';

let initialized = false;

export function initCourseLoader(basePath: string) {
  if (!initialized) {
    initCourses(basePath);
    initialized = true;
  }
}

export async function getAllCoursesAsync(): Promise<Course[]> {
  return loadCoursesAsync();
}
