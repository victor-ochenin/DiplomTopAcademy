import type { Task } from '../../types/messages'
import TaskRenderer from './TaskRenderer'

interface TaskViewProps {
  task: Task
}

export default function TaskView({ task }: TaskViewProps) {
  return <TaskRenderer task={task} />
}
