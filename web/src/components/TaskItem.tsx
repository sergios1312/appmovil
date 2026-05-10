import type { Task } from '@/core/entities/Task';
import { useTaskStore } from '@/store/taskStore';
import { formatDueDate, isOverdue } from '@/utils/dateHelpers';
import { IoCheckmarkCircle, IoEllipseOutline, IoCalendarOutline, IoChevronForward } from 'react-icons/io5';

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

export function TaskItem({ task, onClick }: TaskItemProps) {
  const store = useTaskStore();
  const isCompleted = task.status === 'completed';
  const color = PRIORITY_COLORS[task.priority] ?? 'var(--text-muted)';

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
        </div>
        <div className="task-meta">
          <span className="priority-badge" style={{ color, borderColor: color }}>
            {task.priority}
          </span>
          {task.due_date && (
            <span className="due-date" style={isOverdue(task.due_date) && !isCompleted ? { color: 'var(--danger)' } : {}}>
              <IoCalendarOutline size={12} /> {formatDueDate(task.due_date)}
            </span>
          )}
          <span className="chevron"><IoChevronForward size={14} /></span>
        </div>
      </div>
    </div>
  );
}
