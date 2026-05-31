import { useCallback, useEffect, useState } from 'react';
import type { ExtensionMessage } from './types/messages';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import CourseTab from './components/SidePanel/CourseTab';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  const handleMessage = useCallback((message: ExtensionMessage) => {
    if (message.type === 'workspaceState') {
      setLoaded(true);
    }
  }, []);

  const { postMessage } = useVsCodeApi(handleMessage);

  useEffect(() => {
    postMessage({ type: 'ready' });
    postMessage({ type: 'getWorkspaceState' });
  }, []);

  if (!loaded) {
    return <div>Nodomia</div>;
  }

  return <CourseTab />;
}
