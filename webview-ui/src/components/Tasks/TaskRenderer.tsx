import type { Task } from '../../types/messages'
import ChoiceTask from './ChoiceTask'
import OpenTask from './OpenTask'

interface TaskRendererProps {
  task: Task
}

export default function TaskRenderer({ task }: TaskRendererProps) {
  switch (task.type) {
    case 'choice':
      return <ChoiceTask task={task} />
    case 'open':
      return <OpenTask task={task} />
    case 'coding':
      return null
    default: {
      //Сообщаем компилятору что task имеет тип, который мы не обработали, присваивая тип never переменной
      const _exhaustive: never = task
      return null
    }
  }
}
