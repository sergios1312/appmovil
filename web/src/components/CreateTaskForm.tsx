import { useState } from 'react';
import type { CreateTaskDTO, TaskPriority, TaskType } from '@/core/entities/Task';
import { useTaskStore } from '@/store/taskStore';

interface CreateTaskFormProps {
  parentId?: string | null;
  onClose: () => void;
}

const TASK_TYPES: { key: TaskType; label: string; desc: string }[] = [
  { key: 'single', label: '📌 Única', desc: 'Pendiente de un solo uso' },
  { key: 'routine', label: '🔁 Rutina', desc: 'Se repite en días específicos' },
  { key: 'project', label: '📁 Proyecto', desc: 'Desglosable en etapas y subtareas' },
  { key: 'habit_group', label: '📋 Grupo de hábitos', desc: 'Contenedor que se completa automáticamente' },
];

const DAYS_OF_WEEK = [
  { key: 1, label: 'Lu' },
  { key: 2, label: 'Ma' },
  { key: 3, label: 'Mi' },
  { key: 4, label: 'Ju' },
  { key: 5, label: 'Vi' },
  { key: 6, label: 'Sá' },
  { key: 0, label: 'Do' },
];

export function CreateTaskForm({ parentId = null, onClose }: CreateTaskFormProps) {
  const store = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskType>(parentId ? 'single' : 'single');
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState(3);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [hideFromCalendar, setHideFromCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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
      task_type: parentId ? 'single' : taskType,
      weight,
      repeat_days: taskType === 'routine' ? repeatDays : undefined,
      hide_from_calendar: hideFromCalendar,
      is_synced: false,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    await store.addTask(dto);
    setLoading(false);
    onClose();
  };

  return (
    <form className="create-task-form" onSubmit={handleSubmit}>
      <input type="text" placeholder="Título de la tarea..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <textarea placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

      {/* Task type selector (only for root tasks) */}
      {!parentId && (
        <div className="task-type-selector">
          {TASK_TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              className={`task-type-option ${taskType === t.key ? 'active' : ''}`}
              onClick={() => setTaskType(t.key)}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Routine-specific: day picker */}
      {taskType === 'routine' && !parentId && (
        <div className="repeat-days-picker">
          <label className="form-label">Repetir en:</label>
          <div className="days-row">
            {DAYS_OF_WEEK.map(d => (
              <button
                key={d.key}
                type="button"
                className={`day-chip ${repeatDays.includes(d.key) ? 'active' : ''}`}
                onClick={() => toggleDay(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-row">
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
          <option value="low">🟦 Baja</option>
          <option value="medium">🟨 Media</option>
          <option value="high">🟧 Alta</option>
          <option value="urgent">🟥 Urgente</option>
        </select>
        <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="weight-control">
          <label className="form-label">Peso: {weight}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="weight-slider"
          />
          <span className="weight-hint">
            {weight <= 2 ? 'Rutina simple' : weight <= 5 ? 'Normal' : weight <= 8 ? 'Importante' : 'Proyecto grande'}
          </span>
        </div>
      </div>

      <div className="form-row" style={{ alignItems: 'center' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={hideFromCalendar}
            onChange={(e) => setHideFromCalendar(e.target.checked)}
          />
          Ocultar del calendario
        </label>
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
