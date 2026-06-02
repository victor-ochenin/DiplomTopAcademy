import Markdown from 'react-markdown'
import type { Lesson } from '../../types/messages'

interface LessonViewProps {
  lesson: Lesson
}

export default function LessonView({ lesson }: LessonViewProps) {
  return (
    <div>
      {/* <h2>{lesson.title}</h2> */}
      <Markdown>{lesson.content}</Markdown>

      {/* {lesson.tasks.map(task => (
        <div key={task.id}>
          <p><strong>{task.question}</strong></p>
          {task.options && (
            <ul>
              {task.options.map((option, i) => (
                <li key={i}>{option}</li>
              ))}
            </ul>
          )}
          {task.correctAnswer && (
            <details>
              <summary>Показать ответ</summary>
              <p>
                {Array.isArray(task.correctAnswer)
                  ? task.correctAnswer.join(', ')
                  : task.correctAnswer}
              </p>
            </details>
          )}
        </div>
      ))} */}
    </div>
  )
}
