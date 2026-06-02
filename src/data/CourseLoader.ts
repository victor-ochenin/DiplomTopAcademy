import { courses } from './courses';
import type { Course } from './types';

export function getAllCourses(): Course[] {
  return courses;
}

export function getCourse(id: string): Course | undefined {
  return courses.find(c => c.id === id);
}
