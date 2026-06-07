import whatIsReact from '../lessons/react-basics/what-is-react.md';
import type { Course } from '../types';

export const reactBasicsCourse: Course = {
  id: 'react-basics',
  title: 'Основы React',
  description: 'Основы React',
  lessons: [{
    id: 'what-is-react',
    title: 'Что такое React?',
    documents: [{
      id: 'intro',
      title: 'Введение в React',
      content: whatIsReact,
    }],
    tasks: [{
      id: 'task-1',
      type: 'choice',
      question: 'Что такое React?',
      options: [
        'Фреймворк для серверных приложений',
        'Библиотека для построения UI',
        'Язык программирования',
        'База данных'
      ],
      correctAnswer: 'Библиотека для построения UI'
    },
    {
      id: 'task-2',
      type: 'open',
      question: 'Какая основная задача React?',
      acceptableAnswers: [
        'построение пользовательских интерфейсов',
        'создание ui',
        'построение ui'
      ]
    }],
    resources: [
      { title: 'Официальная документация React', url: 'https://react.dev' }
    ]
  }]
};
