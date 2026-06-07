import { useMemo, useState } from 'react'
import type { Course } from '../../types/messages'
import LessonView from '../LessonView'
import TaskView from '../Tasks/TaskView'
import '../../styles/accordion.css'
import '../../styles/lesson.css'
import '../../styles/lesson-page.css'

interface CourseTabProps {
  course: Course
  onBack: () => void
}

interface NavItem {
  id: string
  type: 'document' | 'task'
  title: string
  lessonIndex: number
}

export default function CourseTab({ course, onBack }: CourseTabProps) {
  const allItems = useMemo<NavItem[]>(() => {
    const result: NavItem[] = []
    course.lessons.forEach((lesson, li) => {
      for (const doc of lesson.documents ?? []) {
        result.push({ id: doc.id, type: 'document', title: doc.title, lessonIndex: li })
      }
      for (const task of lesson.tasks ?? []) {
        result.push({ id: task.id, type: 'task', title: task.question, lessonIndex: li })
      }
    })
    return result
  }, [course])

  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (activeIndex !== null) {
    const item = allItems[activeIndex]
    const lesson = course.lessons[item.lessonIndex]

    return (
      <div>
        <button className="lesson-page__back" onClick={() => setActiveIndex(null)}>
          ← Назад
        </button>

        {item.type === 'document' && (() => {
          const doc = lesson.documents?.find(d => d.id === item.id)
          if (!doc) return <p>Document not found</p>
          return <LessonView document={doc} resources={lesson.resources} />
        })()}
        {item.type === 'task' && (() => {
          const task = lesson.tasks?.find(t => t.id === item.id)
          if (!task) return <p>Task not found</p>
          return <TaskView task={task} />
        })()}

        <div className="lesson-nav" style={{ marginTop: 20 }}>
          <button
            onClick={() => setActiveIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            ←
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {activeIndex + 1} / {allItems.length}
          </span>
          <button
            onClick={() => setActiveIndex(activeIndex + 1)}
            disabled={activeIndex === allItems.length - 1}
          >
            →
          </button>
        </div>
      </div>
    )
  }

  //Если activeIndex === null, возвращаем JSX для режима просмотра списка уроков (аккордеон)
  ///https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
  return (
    <div>
      <div style={{ padding: '12px 12px 0' }}>
        <button className="lesson-page__back" onClick={onBack}>
          ← Назад к курсам
        </button>
        <h2 className="lesson-title" style={{ margin: '8px 0 12px' }}>{course.title}</h2>
      </div>

      <div className="accordion" style={{ paddingTop: 0 }}>
        {course.lessons.map(lesson => {
          const isOpen = openLessonId === lesson.id
          //Фильтруем allItems, оставляя только элементы, принадлежащие текущему уроку
          //indexOf находит индекс урока в массиве lessons
          const items: NavItem[] = allItems.filter(i => i.lessonIndex === course.lessons.indexOf(lesson))

          return (
            <div key={lesson.id} className="accordion-item">
              <div
                className="accordion-header"
                onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
              >
                <span className="accordion-title">{lesson.title}</span>
                <svg
                  className={`chevron${isOpen ? ' open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              <div className={`accordion-body${isOpen ? ' open' : ''}`}>
                <div className="accordion-content">
                  {items.map((item, idx) => {
                    const globalIdx = allItems.indexOf(item)
                    // Возвращаем JSX для одного элемента списка (документ или задача)
                    return (
                      <div
                        key={item.id}
                        className="lesson-item"
                        onClick={() => setActiveIndex(globalIdx)}
                      >
                        <div className={`lesson-type-icon ${item.type === 'task' ? 'challenge' : 'lesson'}`}>
                          {item.type === 'task' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1"/>
                              <rect x="14" y="3" width="7" height="7" rx="1"/>
                              <rect x="3" y="14" width="7" height="7" rx="1"/>
                              <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                          )}
                        </div>
                        <span className="lesson-name">{item.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
