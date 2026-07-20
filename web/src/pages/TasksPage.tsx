import { useState, useMemo } from 'react';
import { useTaskStore, selectFilteredTasks, type TaskFilter, type TaskTypeFilter } from '@/store/taskStore';
import { TaskItem } from '@/components/TaskItem';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import {
  IoClipboardOutline,
  IoAdd,
  IoClose,
  IoRepeatOutline,
  IoFlashOutline,
  IoFolderOutline,
  IoLayersOutline,
  IoAppsOutline,
} from 'react-icons/io5';
import type { Task, TaskType } from '@/core/entities/Task';

const STATUS_FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
];

const TYPE_FILTERS: { key: TaskTypeFilter; label: string; Icon: typeof IoAppsOutline }[] = [
  { key: 'all', label: 'Todos', Icon: IoAppsOutline },
  { key: 'routine', label: 'Rutinas', Icon: IoRepeatOutline },
  { key: 'single', label: 'Únicas', Icon: IoFlashOutline },
  { key: 'project', label: 'Proyectos', Icon: IoFolderOutline },
  { key: 'habit_group', label: 'Grupos', Icon: IoLayersOutline },
];

export function TasksPage() {
  const store = useTaskStore();

  // Selector centralizado (misma lógica para todas las vistas, en hora local).
  const filteredTasks = selectFilteredTasks(store);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Group tasks by type for display
  const groupedTasks = useMemo(() => {
    if (store.activeTypeFilter !== 'all') return null;

    const groups: Record<TaskType, Task[]> = {
      habit_group: [],
      routine: [],
      single: [],
      project: [],
    };

    for (const task of filteredTasks) {
      const type = task.task_type || 'single';
      if (groups[type]) groups[type].push(task);
    }

    return groups;
  }, [filteredTasks, store.activeTypeFilter]);

  const typeLabels: Record<TaskType, { label: string; icon: typeof IoRepeatOutline }> = {
    habit_group: { label: 'Grupos de Hábitos', icon: IoLayersOutline },
    routine: { label: 'Tareas Rutinarias', icon: IoRepeatOutline },
    single: { label: 'Tareas Únicas', icon: IoFlashOutline },
    project: { label: 'Proyectos Modulares', icon: IoFolderOutline },
  };

  return (
    <>
      <div className="page-header">
        <h2>Mis Tareas</h2>
        <div className="subtitle">{filteredTasks.length} tareas</div>
      </div>

      {/* Type filters */}
      <div className="type-filters-row">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`type-filter-chip ${store.activeTypeFilter === f.key ? 'active' : ''}`}
            onClick={() => store.setTypeFilter(f.key)}
          >
            <f.Icon size={14} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="filters-row">
        {STATUS_FILTERS.map((f) => (
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
          {showCreate ? <><IoClose size={14} /> Cerrar</> : <><IoAdd size={14} /> Nueva tarea</>}
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
              ? `No hay tareas en "${STATUS_FILTERS.find((f) => f.key === store.activeFilter)?.label}"`
              : 'Crea tu primera tarea con el botón de arriba.'}
          </p>
        </div>
      ) : groupedTasks && store.activeTypeFilter === 'all' ? (
        // Grouped view
        Object.entries(groupedTasks).map(([type, tasks]) => {
          if (tasks.length === 0) return null;
          const info = typeLabels[type as TaskType];
          return (
            <div key={type} className="task-group">
              <div className="task-group-header">
                <info.icon size={16} />
                <span>{info.label}</span>
                <span className="task-group-count">{tasks.length}</span>
              </div>
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onClick={setSelectedTask} />
              ))}
            </div>
          );
        })
      ) : (
        filteredTasks.map((task) => (
          <TaskItem key={task.id} task={task} onClick={setSelectedTask} />
        ))
      )}

      <button className="fab" onClick={() => setShowCreate(!showCreate)} title="Nueva tarea">
        {showCreate ? <IoClose size={24} /> : <IoAdd size={24} />}
      </button>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
