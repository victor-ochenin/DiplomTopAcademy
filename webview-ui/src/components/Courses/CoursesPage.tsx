import type { Course } from '../../types/messages'
import CourseCard from './CourseCard'
import '../../styles/courses.css'

interface CoursesPageProps {
  courses: Course[]
  onSelectCourse: (id: string) => void
}

function pluralCourses(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'курс'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'курса'
  return 'курсов'
}

export default function CoursesPage({ courses, onSelectCourse }: CoursesPageProps) {
  const count = courses.length

  return (
    <div className="courses-page">
      <h1 className="courses-title">
        Обзор курсов{' '}
        <span className="courses-count">{count} {pluralCourses(count)}</span>
      </h1>

      <div className="courses-icon-row">
        <div className="courses-icon">
          <svg viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(0 50 50)" fill="none"/>
            <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(60 50 50)" fill="none"/>
            <ellipse cx="50" cy="50" rx="42" ry="16" stroke="#61dafb" strokeWidth="2.5" transform="rotate(120 50 50)" fill="none"/>
            <circle cx="50" cy="50" r="5" fill="#61dafb"/>
          </svg>
        </div>
        <span className="courses-icon-label">React</span>
        <span className="courses-icon-count">{count} {pluralCourses(count)}</span>
      </div>

      <div className="courses-grid">
        {courses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onEnter={() => onSelectCourse(course.id)}
          />
        ))}
      </div>
    </div>
  )
}
