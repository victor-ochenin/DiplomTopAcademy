import { useCallback, useEffect, useState } from 'react';
import type { Course, ExtensionMessage } from './types/messages';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import SplashScreen from './components/SplashScreen';
import CoursesPage from './components/Courses/CoursesPage';
import CourseTab from './components/Courses/CourseTab';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
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

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  const selectedCourse = selectedCourseId
    ? courses.find(c => c.id === selectedCourseId) ?? null
    : null;

  if (selectedCourse) {
    return (
      <CourseTab
        course={selectedCourse}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  return (
    <CoursesPage
      courses={courses}
      onSelectCourse={setSelectedCourseId}
    />
  );
}
