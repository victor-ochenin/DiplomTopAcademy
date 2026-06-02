import whatIsReact from '../lessons/react-basics/what-is-react.md';
import type { Course } from '../types';

export const reactBasicsCourse: Course = {
  id: 'react-basics',
  title: 'React Basics',
  description: 'Основы React',
  lessons: [{
    id: 'what-is-react',
    title: 'What is React?',
    content: whatIsReact,
    // tasks: [{
    //   id: 'task-1',
    //   type: 'choice',
    //   question: 'Что такое React?',
    //   options: [
    //     'Фреймворк для серверных приложений',
    //     'Библиотека для построения UI',
    //     'Язык программирования',
    //     'База данных'
    //   ],
    //   correctAnswer: 'Библиотека для построения UI'
    // }],
    resources: [
      { title: 'Официальная документация React', url: 'https://react.dev' }
    ]
  }]
};
