import { useState } from 'react'
import type { Task } from '../../types/messages'
import '../../styles/task.css'

interface OpenTaskProps {
  task: Extract<Task, { type: 'open' }>
}

export default function OpenTask({ task }: OpenTaskProps) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleCheck = () => {
    const normalized = answer.trim().toLowerCase()
    const match = task.acceptableAnswers.some(
      (a) => a.trim().toLowerCase() === normalized
    )
    setIsCorrect(!!match)
    setChecked(true)
  }

  return (
    <div className="task">
      <p className="task__question">{task.question}</p>
      <textarea
        className="task__textarea"
        value={answer}
        onChange={(e) => { if (!checked) setAnswer(e.target.value) }}
        placeholder="Введите ответ..."
        disabled={checked}
      />
      <div>
        {!checked && (
          <button className="task__button" onClick={handleCheck} disabled={!answer.trim()}>
            Проверить
          </button>
        )}
      </div>
      {checked && (
        <p className={`task__result task__result--${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? 'Верно' : 'Неверно'}
        </p>
      )}
    </div>
  )
}
