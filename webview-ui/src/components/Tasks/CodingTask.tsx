import { useCallback, useState } from 'react'
import type { Task, CheckResult } from '../../types/messages'
import { useVsCodeApi } from '../../hooks/useVsCodeApi'
import '../../styles/components.css'

interface CodingTaskProps {
  task: Extract<Task, { type: 'coding' }>
  lessonId: string
}

export default function CodingTask({ task, lessonId }: CodingTaskProps) {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const { postMessage } = useVsCodeApi(
    useCallback((msg) => {
      if (msg.type === 'checkResult') {
        setResult(msg.payload)
        setIsChecking(false)
      }
    }, [])
  )

  const handleCheck = () => {
    setIsChecking(true)
    setResult(null)
    postMessage({
      type: 'checkCode',
      payload: { taskId: task.id, lessonId, filePath: task.expectedFiles[0] },
    })
  }

  return (
    <div className="task">
      <p className="task__question">{task.question}</p>

      {task.instructions && (
        <p className="coding-task__instructions">{task.instructions}</p>
      )}

      {task.starterCode && (
        <pre className="coding-task__starter"><code>{task.starterCode}</code></pre>
      )}

      <ul className="coding-task__criteria">
        {task.criteria.map((c, i) => (
          <li key={i}>
            <span className="coding-task__bullet" />{c}
          </li>
        ))}
      </ul>

      {!result && (
        <button
          className="task__button"
          onClick={handleCheck}
          disabled={isChecking}
        >
          {isChecking ? 'Проверяю...' : 'Проверить'}
        </button>
      )}

      {result && (
        <p className={`task__result task__result--${result.passed ? 'correct' : 'incorrect'}`}>
          {result.feedback}
        </p>
      )}
    </div>
  )
}
