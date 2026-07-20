import type { Task } from '@/core/entities/Task';
import { useTaskStore } from '@/store/taskStore';
import { formatDueDate, isOverdue } from '@/utils/dateHelpers';
import {
  IoCheckmarkCircle,
  IoCalendarOutline,
  IoChevronForward,
  IoRepeatOutline,
  IoFlashOutline,
  IoFolderOutline,
  IoLayersOutline,
} from 'react-icons/io5';

interface TaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'var(--priority-low)',
  medium: 'var(--priority-medium)',
  high: 'var(--priority-high)',
  urgent: 'var(--priority-urgent)',
};

const TYPE_ICONS: Record<string, typeof IoRepeatOutline> = {
  routine: IoRepeatOutline,
  single: IoFlashOutline,
  project: IoFolderOutline,
  habit_group: IoLayersOutline,
};

export function TaskItem({ task, onClick }: TaskItemProps) {
  const store = useTaskStore();
  const isCompleted = task.status === 'completed';
  const color = PRIORITY_COLORS[task.priority] ?? 'var(--text-muted)';
  const subtasks = store.getSubtasks(task.id);
  const completedSubs = subtasks.filter(s => s.status === 'completed').length;

  const TypeIcon = TYPE_ICONS[task.task_type || 'single'] ?? IoFlashOutline;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.toggleComplete(task.id);
  };

  return (
    <div className="task-item" onClick={() => onClick(task)}>
      <div className={`priority-bar ${task.priority}`} />
      <div className="task-content">
        <div className="task-top">
          <button
            className={`check-btn ${isCompleted ? 'completed' : ''}`}
            onClick={handleCheck}
            title={isCompleted ? 'Marcar como pendiente' : 'Completar'}
          >
            {isCompleted
              ? <IoCheckmarkCircle size={14} style={{ color: 'var(--bg)' }} />
              : null}
          </button>
          <span className={`task-title ${isCompleted ? 'completed' : ''}`}>
            {task.title}
          </span>
          <span className="task-type-icon" title={task.task_type || 'single'}>
            <TypeIcon size={14} />
          </span>
        </div>
        <div className="task-meta">
          <span className="priority-badge" style={{ color, borderColor: color }}>
            {task.priority}
          </span>
          {subtasks.length > 0 && (
            <span className="subtask-count">
              {completedSubs}/{subtasks.length} sub
            </span>
          )}
          {task.due_date && (
            <span className="due-date" style={isOverdue(task.due_date) && !isCompleted ? { color: 'var(--danger)' } : {}}>
              <IoCalendarOutline size={12} /> {formatDueDate(task.due_date)}
            </span>
          )}
          {(task.weight ?? 0) > 5 && (
            <span className="weight-badge">⚡{task.weight}</span>
          )}
          <span className="chevron"><IoChevronForward size={14} /></span>
        </div>
      </div>
    </div>
  );
}
