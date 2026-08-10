import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateData(basePath) {
  const errors = [];
  const coursesDir = join(basePath, 'src', 'data', 'courses');

  if (!existsSync(coursesDir)) {
    return [{ file: coursesDir, message: 'courses dir not found' }];
  }

  const courseFiles = readdirSync(coursesDir).filter((f) => f.endsWith('.json'));
  const seenCourseIds = new Set();

  for (const file of courseFiles) {
    const coursePath = join(coursesDir, file);
    let course;
    try {
      course = JSON.parse(readFileSync(coursePath, 'utf-8'));
    } catch (err) {
      errors.push({ file, message: `invalid JSON: ${err.message}` });
      continue;
    }

    if (!course.id || !course.title) {
      errors.push({ file, message: 'missing id/title' });
    }
    if (seenCourseIds.has(course.id)) {
      errors.push({ file, message: `duplicate course id: ${course.id}` });
    }
    seenCourseIds.add(course.id);

    const lessons = Array.isArray(course.lessons) ? course.lessons : [];
    if (lessons.length === 0) {
      errors.push({ file, message: 'empty lessons array' });
    }

    for (const ref of lessons) {
      if (typeof ref !== 'string' || ref.length === 0) {
        errors.push({ file, message: 'invalid lesson reference' });
        continue;
      }
      const lessonPath = join(basePath, ref);
      if (!existsSync(lessonPath)) {
        errors.push({ file, message: `lesson file not found: ${ref}` });
        continue;
      }
      validateLesson(readJson(lessonPath, errors), lessonPath, basePath, errors);
    }
  }
  return errors;
}

function readJson(filePath, errors) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    errors.push({ file: filePath, message: `invalid JSON: ${err.message}` });
    return null;
  }
}

function validateLesson(lesson, lessonPath, basePath, errors) {
  if (!lesson) {
    return;
  }
  const file = lessonPath;

  const folderName = basename(dirname(lessonPath));
  if (lesson.id !== folderName) {
    errors.push({ file, message: `lesson id "${lesson.id}" != folder name "${folderName}"` });
  }

  const docs = Array.isArray(lesson.documents) ? lesson.documents : [];
  if (docs.length === 0) {
    errors.push({ file, message: 'empty documents array' });
  }

  for (const doc of docs) {
    if (
      !doc ||
      typeof doc !== 'object' ||
      typeof doc.id !== 'string' ||
      typeof doc.title !== 'string' ||
      typeof doc.contentFile !== 'string'
    ) {
      errors.push({ file, message: 'document missing id/title/contentFile' });
      continue;
    }
    const mdPath = join(basePath, doc.contentFile);
    if (!existsSync(mdPath)) {
      errors.push({ file, message: `md not found: ${doc.contentFile}` });
    }
  }

  validateTasks(lesson, errors);
}

function validateTasks(lesson, errors) {
  const tasks = Array.isArray(lesson.tasks) ? lesson.tasks : [];
  const seen = new Set();
  const file = `lesson ${lesson.id}`;

  for (const task of tasks) {
    if (!task?.id || !task?.question) {
      errors.push({ file, message: 'task missing id/question' });
      continue;
    }
    if (seen.has(task.id)) {
      errors.push({ file, message: `duplicate task id: ${task.id}` });
    }
    seen.add(task.id);

    if (task.type === 'choice') {
      if (!Array.isArray(task.options) || task.options.length < 2) {
        errors.push({ file, message: `task ${task.id}: need >= 2 options` });
      } else if (!task.options.includes(task.correctAnswer)) {
        errors.push({ file, message: `task ${task.id}: correctAnswer not in options` });
      }
    } else if (task.type === 'open') {
      if (!Array.isArray(task.acceptableAnswers) || task.acceptableAnswers.length === 0) {
        errors.push({ file, message: `task ${task.id}: empty acceptableAnswers` });
      }
    } else if (task.type === 'coding') {
      if (!Array.isArray(task.criteria) || task.criteria.length === 0) {
        errors.push({ file, message: `task ${task.id}: empty criteria` });
      }
      if (!Array.isArray(task.expectedFiles) || task.expectedFiles.length === 0) {
        errors.push({ file, message: `task ${task.id}: empty expectedFiles` });
      }
    } else {
      errors.push({ file, message: `task ${task.id}: unknown type "${task.type}"` });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.argv[2] ?? process.cwd();
  const errors = validateData(base);
  if (errors.length) {
    for (const e of errors) {
      console.error(`✖ ${e.file}: ${e.message}`);
    }
    process.exit(1);
  }
  console.log('✓ course data is valid');
}