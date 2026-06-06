import { useCallback, useEffect, useState } from 'react';
import type { Course, ExtensionMessage } from './types/messages';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import SplashScreen from './components/SplashScreen';
import CourseCard from './components/CourseCard';
import CourseTab from './components/CourseTab';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [inCourse, setInCourse] = useState(false);

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

  const firstCourse = courses[0];

  if (!firstCourse) {
    return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (!inCourse) {
    return (
      <CourseCard
        course={firstCourse}
        onEnter={() => setInCourse(true)}
      />
    );
  }

  return (
    <CourseTab
      course={firstCourse}
      onBack={() => setInCourse(false)}
    />
  );
}
