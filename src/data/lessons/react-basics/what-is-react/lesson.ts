import intro from './what-is-react.md';
import setup from './setup-react.md';
import vdom from './virtual-dom.md';
import type { Lesson } from '../../../types';

export const whatIsReactLesson: Lesson = {
  id: 'what-is-react',
  title: 'Что такое React?',
  documents: [
    { id: 'intro', title: 'Введение в React', content: intro },
    { id: 'setup', title: 'Настройка проекта React', content: setup },
    { id: 'virtual-dom', title: 'Виртуальный DOM', content: vdom },
  ],
  tasks: [
    {
      id: 'task-1',
      type: 'choice',
      question: 'Что такое React?',
      options: [
        'Фреймворк для серверных приложений',
        'Библиотека для построения UI',
        'Язык программирования',
        'База данных',
      ],
      correctAnswer: 'Библиотека для построения UI',
    },
    {
      id: 'task-2',
      type: 'open',
      question: 'Какая основная задача React?',
      acceptableAnswers: [
        'построение пользовательских интерфейсов',
        'создание ui',
        'построение ui',
      ],
    },
  ],
  resources: [
    { title: 'Официальная документация React', url: 'https://react.dev' },
  ],
};
