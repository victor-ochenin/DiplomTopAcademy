import { useCallback, useEffect, useState } from 'react'
import type { Course, Lesson, ExtensionMessage } from '../../types/messages'
import { useVsCodeApi } from '../../hooks/useVsCodeApi'
import LessonView from './LessonView'

export default function CourseTab() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const handleMessage = useCallback((message: ExtensionMessage) => {
    if (message.type === 'courses') {
      setCourses(message.payload)
    }
  }, [])

  const { postMessage } = useVsCodeApi(handleMessage)

  useEffect(() => {
    postMessage({ type: 'getCourses' })
  }, [postMessage])

  if (selectedLesson) {
    return (
      <div>
        <button onClick={() => setSelectedLesson(null)}>Назад</button>
        <LessonView lesson={selectedLesson} />
      </div>
    )
  }

  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <ul>
            {course.lessons.map(lesson => (
              <li
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                style={{ cursor: 'pointer' }}
              >
                {lesson.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
