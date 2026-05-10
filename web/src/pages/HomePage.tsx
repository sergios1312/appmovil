import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { TaskItem } from '@/components/TaskItem';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { IoClipboardOutline, IoAdd, IoClose } from 'react-icons/io5';
import type { Task } from '@/core/entities/Task';

export function HomePage() {
  const store = useTaskStore();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const rootTasks = useMemo(() => store.tasks.filter((t) => !t.parent_id), [store.tasks]);
  const pendingCount = useMemo(() => rootTasks.filter((t) => t.status === 'pending').length, [rootTasks]);
  const completedCount = useMemo(() => rootTasks.filter((t) => t.status === 'completed').length, [rootTasks]);

  useEffect(() => { store.loadTasks(); }, []);

  return (
    <>
      <div className="page-header">
        <div className="label">TaskFlow</div>
        <h2>Mis tareas</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="number">{pendingCount}</div>
          <div className="label">Pendientes</div>
        </div>
        <div className="stat-card accent">
          <div className="number">{completedCount}</div>
          <div className="label">Completadas</div>
        </div>
        <div className="stat-card">
          <div className="number">{rootTasks.length}</div>
          <div className="label">Total</div>
        </div>
      </div>

      {showCreate && (
        <CreateTaskForm onClose={() => setShowCreate(false)} />
      )}

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="subtitle">
          {rootTasks.length === 0 ? 'Sin tareas aun' : `${rootTasks.length} tareas`}
        </div>
      </div>

      {store.isLoading && rootTasks.length === 0 ? (
        <div className="loading-page" style={{ minHeight: '200px' }}>
          <div className="spinner" />
        </div>
      ) : rootTasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><IoClipboardOutline size={48} /></div>
          <h3>Todo limpio</h3>
          <p>Presiona el boton + para agregar tu primera tarea.</p>
        </div>
      ) : (
        rootTasks.map((task) => (
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
