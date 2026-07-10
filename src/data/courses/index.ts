import * as fs from 'fs';
import * as path from 'path';
import type { Course, Lesson, Task, Resource, CourseListItem } from '../../types';

let basePath = '';

export function initCourses(base: string) {
  if (!base || typeof base !== 'string') {
    console.error('Nodomia: initCourses requires a valid base path');
    return;
  }
  basePath = base;
}

let listCache: CourseListItem[] | null = null;
let detailsCache = new Map<string, Course>();

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
  const icon = isNonEmptyString(data.icon) ? data.icon : undefined;

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
    icon,
    lessons,
  };
}

async function readLessonMetaAsync(ref: string): Promise<{ id: string; docCount: number; taskCount: number }> {
  const raw = await loadFileAsync(path.join(basePath, ref));
  if (!raw) { return { id: '', docCount: 0, taskCount: 0 }; }
  const data = parseJsonSafe(raw, `lesson meta ${ref}`);
  if (!data || typeof data !== 'object') { return { id: '', docCount: 0, taskCount: 0 }; }
  const d = data as Record<string, unknown>;
  return {
    id: isNonEmptyString(d.id) ? d.id : '',
    docCount: Array.isArray(d.documents) ? (d.documents as any[]).length : 0,
    taskCount: Array.isArray(d.tasks) ? d.tasks.length : 0,
  };
}

async function getJsonFiles(): Promise<string[]> {
  const coursesDir = path.join(basePath, 'src', 'data', 'courses');
  let files: string[];
  try {
    files = await fs.promises.readdir(coursesDir);
  } catch (err) {
    console.error(`Nodomia: failed to read courses directory ${coursesDir}`, err);
    return [];
  }
  return files.filter(f => f.endsWith('.json') && f.length > 5).map(f => path.join(coursesDir, f));
}

export async function loadCourseListAsync(): Promise<CourseListItem[]> {
  if (listCache) { return listCache; }
  if (!basePath) {
    console.error('Nodomia: CourseLoader not initialized');
    return [];
  }

  const files = await getJsonFiles();

  const rawCourses = await Promise.all(files.map(f => loadFileAsync(f)));

  const results = await Promise.all(
    rawCourses.map(async (raw, i) => {
      if (!raw) { return null; }
      const data = parseJsonSafe(raw, `course ${files[i]}`);
      if (!data || typeof data !== 'object') { return null; }
      const d = data as Record<string, unknown>;
      const id = d.id;
      const title = d.title;
      const description = d.description;
      const level = isValidLevel(d.level) ? d.level : 'beginner';
      const icon = isNonEmptyString(d.icon) ? d.icon : undefined;
      if (!isNonEmptyString(id) || !isNonEmptyString(title)) { return null; }

      const lessonRefs = Array.isArray(d.lessons) ? d.lessons : [];
      const lessonCount = lessonRefs.length;

      const metas = await Promise.all(
        lessonRefs
          .filter((r): r is string => isNonEmptyString(r))
          .map(r => readLessonMetaAsync(r))
      );

      let taskCount = 0;
      let itemsCount = 0;
      const lessonIds: string[] = [];
      for (const meta of metas) {
        if (meta.id) { lessonIds.push(meta.id); }
        taskCount += meta.taskCount;
        itemsCount += meta.docCount + meta.taskCount;
      }

      return { id, title, description: isNonEmptyString(description) ? description : '', level, icon, lessonCount, taskCount, itemsCount, lessonIds } as CourseListItem;
    })
  );

  const items = results.filter((r): r is CourseListItem => r !== null);

  const levelOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  items.sort((a, b) => (levelOrder[a.level] ?? 0) - (levelOrder[b.level] ?? 0));

  listCache = items;
  return items;
}

export async function loadCourseDetailsAsync(id: string): Promise<Course | null> {
  if (detailsCache.has(id)) { return detailsCache.get(id) ?? null; }
  if (!basePath) {
    console.error('Nodomia: CourseLoader not initialized');
    return null;
  }

  const files = await getJsonFiles();

  const rawCourses = await Promise.all(files.map(f => loadFileAsync(f)));

  for (let i = 0; i < files.length; i++) {
    const raw = rawCourses[i];
    if (!raw) { continue; }
    const data = parseJsonSafe(raw, `course ${files[i]}`);
    if (!data || typeof data !== 'object') { continue; }
    if ((data as Record<string, unknown>).id === id) {
      const course = await parseCourseAsync(files[i]);
      if (course) { detailsCache.set(id, course); }
      return course;
    }
  }

  return null;
}


