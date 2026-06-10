import * as fs from 'fs';
import * as path from 'path';
import type { Course, Lesson, Task, Resource } from '../types';

let basePath = '';

export function initCourses(base: string) {
  if (!base || typeof base !== 'string') {
    console.error('Nodomia: initCourses requires a valid base path');
    return;
  }
  basePath = base;
}

let cached: Course[] | null = null;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isValidLevel(v: unknown): v is 'beginner' | 'intermediate' | 'advanced' {
  return v === 'beginner' || v === 'intermediate' || v === 'advanced';
}

function parseJsonSafe(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Nodomia: failed to parse JSON (${label})`, err);
    return null;
  }
}

async function loadFileAsync(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      console.warn(`Nodomia: file not found: ${filePath}`);
    } else {
      console.error(`Nodomia: failed to read ${filePath}`, err);
    }
    return null;
  }
}

async function parseLessonAsync(ref: string): Promise<Lesson | null> {
  if (!isNonEmptyString(ref)) {
    console.warn('Nodomia: parseLessonAsync received empty ref');
    return null;
  }

  const lessonRaw = await loadFileAsync(path.join(basePath, ref));
  if (!lessonRaw) { return null; }

  const lessonData = parseJsonSafe(lessonRaw, `lesson ${ref}`);
  if (!lessonData || typeof lessonData !== 'object') { return null; }

  const data = lessonData as Record<string, unknown>;
  const id = data.id;
  const title = data.title;

  if (!isNonEmptyString(id) || !isNonEmptyString(title)) {
    console.warn(`Nodomia: lesson ${ref} missing required fields (id, title)`);
    return null;
  }

  const docArray = Array.isArray(data.documents) ? data.documents : [];
  const docs = await Promise.all(
    docArray.map(async (doc: unknown) => {
      if (!doc || typeof doc !== 'object') {
        return { id: '', title: '', content: '' };
      }
      const d = doc as Record<string, unknown>;
      const contentFile = isNonEmptyString(d.contentFile) ? d.contentFile : '';
      const content = contentFile
        ? (await loadFileAsync(path.join(basePath, contentFile))) ?? ''
        : '';
      return {
        id: isNonEmptyString(d.id) ? d.id : '',
        title: isNonEmptyString(d.title) ? d.title : '',
        content,
      };
    })
  );

  return {
    id,
    title,
    documents: docs.filter(d => d.id),
    tasks: Array.isArray(data.tasks) ? data.tasks as Task[] : [],
    resources: Array.isArray(data.resources) ? data.resources as Resource[] : [],
  };
}

async function parseCourseAsync(filePath: string): Promise<Course | null> {
  const raw = await loadFileAsync(filePath);
  if (!raw) { return null; }

  const courseData = parseJsonSafe(raw, `course ${filePath}`);
  if (!courseData || typeof courseData !== 'object') { return null; }

  const data = courseData as Record<string, unknown>;
  const id = data.id;
  const title = data.title;
  const description = data.description;
  const level = isValidLevel(data.level) ? data.level : 'beginner';

  if (!isNonEmptyString(id) || !isNonEmptyString(title)) {
    console.warn(`Nodomia: course ${filePath} missing required fields (id, title)`);
    return null;
  }

  const lessonRefs = Array.isArray(data.lessons) ? data.lessons : [];

  const lessons = (await Promise.all(
    lessonRefs.map((ref: unknown) =>
      isNonEmptyString(ref) ? parseLessonAsync(ref) : Promise.resolve(null)
    )
  )).filter((l: Lesson | null): l is Lesson => l !== null);

  return {
    id,
    title,
    description: isNonEmptyString(description) ? description : '',
    level,
    lessons,
  };
}

export async function loadCoursesAsync(): Promise<Course[]> {
  if (cached) { return cached; }
  if (!basePath) {
    console.error('Nodomia: CourseLoader not initialized');
    return [];
  }

  const coursesDir = path.join(basePath, 'src', 'data', 'courses');

  let files: string[];
  try {
    files = await fs.promises.readdir(coursesDir);
  } catch (err) {
    console.error(`Nodomia: failed to read courses directory ${coursesDir}`, err);
    return [];
  }

  const jsonFiles = files.filter(f => f.endsWith('.json') && f.length > 5);

  const courses = (await Promise.all(
    jsonFiles.map(file => parseCourseAsync(path.join(coursesDir, file)))
  )).filter((c: Course | null): c is Course => c !== null);

  const levelOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  courses.sort((a, b) => {
    const ao = levelOrder[a.level] ?? 0;
    const bo = levelOrder[b.level] ?? 0;
    return ao - bo;
  });

  cached = courses;
  return courses;
}
