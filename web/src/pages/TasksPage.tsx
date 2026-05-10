import { useEffect, useState, useMemo } from 'react';
import { useTaskStore, type TaskFilter } from '@/store/taskStore';
import { TaskItem } from '@/components/TaskItem';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { IoClipboardOutline } from 'react-icons/io5';
import type { Task } from '@/core/entities/Task';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
];

export function TasksPage() {
  const store = useTaskStore();

  const filteredTasks = useMemo(() => {
    const rootTasks = store.tasks.filter((t) => !t.parent_id);
    const today = new Date().toISOString().split('T')[0];
    switch (store.activeFilter) {
      case 'today': return rootTasks.filter((t) => t.due_date?.startsWith(today));
      case 'pending': return rootTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
      case 'completed': return rootTasks.filter((t) => t.status === 'completed');
      default: return rootTasks;
    }
  }, [store.tasks, store.activeFilter]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { store.loadTasks(); }, []);

  return (
    <>
      <div className="page-header">
        <h2>Mis Tareas</h2>
        <div className="subtitle">{filteredTasks.length} tareas</div>
      </div>

      <div className="filters-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-chip ${store.activeFilter === f.key ? 'active' : ''}`}
            onClick={() => store.setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)} style={{ padding: '8px 16px', fontSize: '13px' }}>
          + Nueva tarea
        </button>
      </div>

      {showCreate && <CreateTaskForm onClose={() => setShowCreate(false)} />}

      {store.isLoading && filteredTasks.length === 0 ? (
        <div className="loading-page" style={{ minHeight: '200px' }}>
          <div className="spinner" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><IoClipboardOutline size={48} /></div>
          <h3>No hay tareas</h3>
          <p>
            {store.activeFilter !== 'all'
              ? `No hay tareas en "${FILTERS.find((f) => f.key === store.activeFilter)?.label}"`
              : 'Crea tu primera tarea con el boton de arriba.'}
          </p>
        </div>
      ) : (
        filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} onClick={setSelectedTask} />
        ))
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
