import { useCallback, useEffect, useState } from 'react';
import type { Course, ExtensionMessage, UserProgress } from './types/messages';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import CoursesPage from './components/Courses/CoursesPage';
import CourseTab from './components/Courses/CourseTab';
import RagAssistant from './components/RagAssistant/RagAssistant';
import './styles/components.css';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({ completedTasks: {} });
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);

  const handleMessage = useCallback((message: ExtensionMessage) => {
    if (message.type === 'courses') {
      setCourses(message.payload);
      setIsLoading(false);
    } else if (message.type === 'ragError') {
      setIsLoading(false);
    } else if (message.type === 'progress') {
      setProgress(prev => ({
        completedTasks: { ...message.payload.completedTasks, ...prev.completedTasks },
      }));
      setHasHydratedProgress(true);
    }
  }, []);

  const { postMessage } = useVsCodeApi(handleMessage);

  useEffect(() => {
    postMessage({ type: 'getCourses' });
    postMessage({ type: 'loadProgress' });
  }, [postMessage]);

  // сохраняем прогресс в extension host
  useEffect(() => {
    if (!hasHydratedProgress) return
    postMessage({ type: 'saveProgress', payload: progress })
  }, [progress, hasHydratedProgress, postMessage])

  const completeItem = useCallback((lessonId: string, itemId: string) => {
    setProgress(prev => ({
      completedTasks: { ...prev.completedTasks, [`${lessonId}:${itemId}`]: true }
    }))
  }, [])

  if (isLoading) {
    return (
      <>
        <div className="loading">
          <div className="spinner" />
          <p>Загрузка курсов...</p>
        </div>
        <RagAssistant />
      </>
    )
  }

  const selectedCourse = selectedCourseId
    ? courses.find(c => c.id === selectedCourseId) ?? null
    : null;

  return (
    <>
      {selectedCourse ? (
        <CourseTab
          course={selectedCourse}
          onBack={() => setSelectedCourseId(null)}
          progress={progress}
          onCompleteItem={completeItem}
        />
      ) : (
        <CoursesPage
          courses={courses}
          onSelectCourse={setSelectedCourseId}
          progress={progress}
        />
      )}

      <RagAssistant />
    </>
  );
}
