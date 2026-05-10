import { useState } from 'react';
import type { CreateTaskDTO, TaskPriority } from '@/core/entities/Task';
import { useTaskStore } from '@/store/taskStore';

interface CreateTaskFormProps {
  parentId?: string | null;
  onClose: () => void;
}

export function CreateTaskForm({ parentId = null, onClose }: CreateTaskFormProps) {
  const store = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const dto: CreateTaskDTO = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: 'pending',
      parent_id: parentId,
      is_synced: false,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    await store.addTask(dto);
    setLoading(false);
    onClose();
  };

  return (
    <form className="create-task-form" onSubmit={handleSubmit}>
      <input type="text" placeholder="Titulo de la tarea..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <textarea placeholder="Descripcion (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      <div className="form-row">
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
        <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!title.trim() || loading}>
          {loading ? <span className="spinner" /> : 'Crear tarea'}
        </button>
      </div>
    </form>
  );
}
