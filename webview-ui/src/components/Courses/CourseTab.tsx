import { useEffect, useMemo, useState } from 'react'
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

interface ActiveItem {
  lessonId: string
  itemIndex: number
}

export default function CourseTab({ course, onBack }: CourseTabProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)

  const lessonItemsMap = useMemo(() => {
    const map = new Map<string, NavItem[]>()
    course.lessons.forEach((lesson, li) => {
      const items: NavItem[] = []
      for (const doc of lesson.documents ?? []) {
        items.push({ id: doc.id, type: 'document', title: doc.title, lessonIndex: li })
      }
      for (const task of lesson.tasks ?? []) {
        items.push({ id: task.id, type: 'task', title: task.question, lessonIndex: li })
      }
      map.set(lesson.id, items)
    })
    return map
  }, [course])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeItem])

  if (activeItem !== null) {
    const lesson = course.lessons.find(l => l.id === activeItem.lessonId)
    const lessonItems = lessonItemsMap.get(activeItem.lessonId) ?? []
    const item = lessonItems[activeItem.itemIndex]

    //setState внутри рендера допустим — React 18+ батчит его,
    //условие !lesson || !item гарантирует единственный вызов без цикла
    if (!lesson || !item) {
      setActiveItem(null)
      return null
    }

    return (
      <div>
        <button className="lesson-page__back" onClick={() => setActiveItem(null)}>
          ← Назад
        </button>

        {item.type === 'document' && (() => {
          const doc = lesson.documents?.find(d => d.id === item.id)
          if (!doc) return <p>Document not found</p>
          return <LessonView key={item.id} document={doc} resources={lesson.resources} />
        })()}
        {item.type === 'task' && (() => {
          const task = lesson.tasks?.find(t => t.id === item.id)
          if (!task) return <p>Task not found</p>
          return <TaskView key={item.id} task={task} />
        })()}

        <div className="lesson-nav" style={{ marginTop: 20 }}>
          <button
            onClick={() => setActiveItem({ lessonId: activeItem.lessonId, itemIndex: activeItem.itemIndex - 1 })}
            disabled={activeItem.itemIndex === 0}
          >
            ←
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {activeItem.itemIndex + 1} / {lessonItems.length}
          </span>
          <button
            onClick={() => setActiveItem({ lessonId: activeItem.lessonId, itemIndex: activeItem.itemIndex + 1 })}
            disabled={activeItem.itemIndex === lessonItems.length - 1}
          >
            →
          </button>
        </div>
      </div>
    )
  }

  //Если activeItem === null, отображаем список уроков (аккордеон)
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
          //Получаем элементы (документы и задания) только текущего урока
          const items = lessonItemsMap.get(lesson.id) ?? []

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
                    // Возвращаем JSX для одного элемента списка (документ или задача)
                    return (
                      <div
                        key={item.id}
                        className="lesson-item"
                        onClick={() => setActiveItem({ lessonId: lesson.id, itemIndex: idx })}
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
