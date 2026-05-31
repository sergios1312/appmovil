import { useState, useMemo } from 'react';
import type { Task } from '@/core/entities/Task';
import { useTaskStore } from '@/store/taskStore';
import { formatDueDate } from '@/utils/dateHelpers';
import { CreateTaskForm } from './CreateTaskForm';
import {
  IoFlagOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircle,
  IoSquareOutline,
} from 'react-icons/io5';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const store = useTaskStore();

  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentTask = useMemo(() => store.tasks.find((t) => t.id === task.id), [store.tasks, task.id]);
  const subtasks = useMemo(() => store.tasks.filter((t) => t.parent_id === task.id), [store.tasks, task.id]);

  if (!currentTask) return null;

  const handleDelete = async () => {
    await store.deleteTask(task.id);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>{currentTask.title}</h2>
        <span className={`task-detail-status ${currentTask.status === 'completed' ? 'completed' : ''}`}>
          {currentTask.status}
        </span>

        <div className="info-card">
          <span className="meta"><IoFlagOutline size={14} /> Prioridad: {currentTask.priority}</span>
          <span className="meta"><IoCalendarOutline size={14} /> Vence: {currentTask.due_date ? formatDueDate(currentTask.due_date) : 'Sin fecha'}</span>
          {currentTask.description && <span className="meta"><IoDocumentTextOutline size={14} /> {currentTask.description}</span>}
        </div>

        <div className="subtask-section">
          <h3>Subtareas ({subtasks.length})</h3>

          <button className="add-subtask-btn" onClick={() => setShowAddSubtask(!showAddSubtask)}>
            + Agregar subtarea
          </button>

          {showAddSubtask && (
            <CreateTaskForm parentId={task.id} onClose={() => setShowAddSubtask(false)} />
          )}

          {subtasks.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Esta tarea no tiene subtareas.
            </div>
          ) : (
            subtasks.map((sub) => (
              <div key={sub.id} className="subtask-item" onClick={() => store.toggleComplete(sub.id)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: sub.status === 'completed' ? 'line-through' : 'none', color: sub.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {sub.status === 'completed'
                    ? <IoCheckmarkCircle size={16} color="var(--success)" />
                    : <IoSquareOutline size={16} color="var(--text-muted)" />
                  }
                  {sub.title}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          {!confirmDelete ? (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Eliminar</button>
          ) : (
            <>
              <span style={{ color: 'var(--danger)', fontSize: '13px', alignSelf: 'center' }}>Confirmar?</span>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>No</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => store.toggleComplete(task.id)}>
            {currentTask.status === 'completed' ? 'Reabrir' : 'Completar'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
