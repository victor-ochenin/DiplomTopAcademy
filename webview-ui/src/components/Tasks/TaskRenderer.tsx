import type { Task } from '../../types/messages'
import ChoiceTask from './ChoiceTask'
import OpenTask from './OpenTask'
import CodingTask from './CodingTask'

interface TaskRendererProps {
  task: Task
  lessonId?: string
}

export default function TaskRenderer({ task, lessonId }: TaskRendererProps) {
  switch (task.type) {
    case 'choice':
      return <ChoiceTask task={task} />
    case 'open':
      return <OpenTask task={task} />
    case 'coding':
      return <CodingTask task={task} lessonId={lessonId ?? ''} />
    default: {
      const _exhaustive: never = task
      return null
    }
  }
}
