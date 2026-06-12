import { useCallback, useEffect, useState } from 'react';
import type { Course, ExtensionMessage } from './types/messages';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import CoursesPage from './components/Courses/CoursesPage';
import CourseTab from './components/Courses/CourseTab';
import RagAssistant from './components/RagAssistant/RagAssistant';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleMessage = useCallback((message: ExtensionMessage) => {
    if (message.type === 'courses') {
      setCourses(message.payload);
    }
  }, []);

  const { postMessage } = useVsCodeApi(handleMessage);

  useEffect(() => {
    postMessage({ type: 'getCourses' });
  }, [postMessage]);

  const selectedCourse = selectedCourseId
    ? courses.find(c => c.id === selectedCourseId) ?? null
    : null;

  return (
    <>
      {selectedCourse ? (
        <CourseTab
          course={selectedCourse}
          onBack={() => {
            setSelectedCourseId(null);
          }}
        />
      ) : (
        <CoursesPage
          courses={courses}
          onSelectCourse={setSelectedCourseId}
        />
      )}

      <RagAssistant />
    </>
  );
}
