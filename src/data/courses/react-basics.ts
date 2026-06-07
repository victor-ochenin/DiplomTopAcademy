import { whatIsReactLesson } from '../lessons/react-basics/what-is-react/lesson';
import { jsxSyntaxLesson } from '../lessons/react-basics/jsx/lesson';
import type { Course } from '../types';

export const reactBasicsCourse: Course = {
  id: 'react-basics',
  title: 'Основы React',
  description: 'Основы React',
  lessons: [whatIsReactLesson, jsxSyntaxLesson],
};
