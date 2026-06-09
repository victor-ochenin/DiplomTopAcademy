import type { Course } from '../../types/messages'
import '../../styles/card.css'

interface CourseCardProps {
  course: Course
  onEnter: () => void
}

function plural(n: number, one: string, few: string, many: string) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few
  return many
}

export default function CourseCard({ course, onEnter }: CourseCardProps) {
  const lessonCount = course.lessons.length
  const taskCount = course.lessons.reduce((s, l) => s + (l.tasks?.length ?? 0), 0)

  return (
    <div className="card-wrapper">
      <div className="card" onClick={onEnter}>
        <div className="card-header">
          <div className="card-header-left">
            <div className="react-icon">
              <svg viewBox="0 0 100 100" fill="none">
                <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(0 50 50)" fill="none"/>
                <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(60 50 50)" fill="none"/>
                <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(120 50 50)" fill="none"/>
                <circle cx="50" cy="50" r="5" fill="#61dafb"/>
              </svg>
            </div>
            <div className="card-title-group">
              <div className="card-title-row">
                <span className="card-title">{course.title}</span>
              </div>
              <span className="card-subtitle">React 19</span>
            </div>
          </div>
        </div>

        <span className={`level-badge level-${course.level}`}>
          {course.level === 'beginner' ? 'НОВИЧОК' : course.level === 'intermediate' ? 'СРЕДНИЙ' : 'ПРОДВИНУТЫЙ'}
        </span>

        <p className="card-description">{course.description}</p>

        <div className="card-footer">
          <div className="footer-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>{lessonCount} {plural(lessonCount, 'урок', 'урока', 'уроков')}</span>
          </div>
          <div className="footer-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>{taskCount} {plural(taskCount, 'задание', 'задания', 'заданий')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
