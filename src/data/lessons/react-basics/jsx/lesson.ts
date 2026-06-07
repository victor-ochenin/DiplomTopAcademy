import jsxBasics from './jsx-basics.md';
import conditionalRendering from './conditional-rendering.md';
import listRendering from './list-rendering.md';
import type { Lesson } from '../../../types';

export const jsxSyntaxLesson: Lesson = {
  id: 'jsx-syntax',
  title: 'JSX синтаксис',
  documents: [
    { id: 'jsx-basics', title: 'Основы JSX', content: jsxBasics },
    { id: 'conditional-rendering', title: 'Условный рендеринг', content: conditionalRendering },
    { id: 'list-rendering', title: 'Списки рендеринга', content: listRendering },
  ],
  tasks: [
    {
      id: 'task-3',
      type: 'choice',
      question: 'Какой синтаксис используется для добавления CSS-класса в JSX?',
      options: [
        'class="name"',
        'className="name"',
        'css="name"',
        'style="name"',
      ],
      correctAnswer: 'className="name"',
    },
    {
      id: 'task-4',
      type: 'choice',
      question: 'Каким символом обозначаются JavaScript-выражения в JSX?',
      options: ['( )', '{{ }}', '{ }', '[ ]'],
      correctAnswer: '{ }',
    },
    {
      id: 'task-5',
      type: 'open',
      question: 'Какой атрибут нужно добавлять каждому элементу при рендеринге списка в React?',
      acceptableAnswers: ['key', 'ключ'],
    },
  ],
  resources: [
    { title: 'Документация JSX', url: 'https://react.dev/learn/writing-markup-with-jsx' },
  ],
};
