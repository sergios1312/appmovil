import { useMemo, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { formatDueDate, isOverdue, dayKeyOf } from '@/utils/dateHelpers';
import {
  IoCalendarOutline,
  IoFilterOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoFlagOutline,
} from 'react-icons/io5';

export function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const [showRoutines, setShowRoutines] = useState(false);

  // Tasks with deadlines (filtered to exclude routines by default)
  const deadlineTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (!t.due_date) return false;
        if (t.status === 'completed') return false;
        if (!showRoutines && (t.task_type === 'routine' || t.hide_from_calendar)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [tasks, showRoutines]);

  // Group tasks by stable day key (YYYY-MM-DD, incluye año → sin colisión entre años)
  const groupedTasks = useMemo(() => {
    const byKey = new Map<string, typeof deadlineTasks>();
    for (const task of deadlineTasks) {
      const key = dayKeyOf(task.due_date!);
      const list = byKey.get(key) ?? [];
      list.push(task);
      byKey.set(key, list);
    }
    // deadlineTasks viene ordenado asc → las claves quedan en orden cronológico.
    return Array.from(byKey.entries()).map(([key, tasks]) => ({
      key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      tasks,
    }));
  }, [deadlineTasks]);

  return (
    <>
      <div className="page-header">
        <h2>Calendario</h2>
        <div className="subtitle">Tareas con fecha límite</div>
      </div>

      {/* Filter toggle */}
      <div className="calendar-filter-bar">
        <button
          className={`filter-chip ${!showRoutines ? 'active' : ''}`}
          onClick={() => setShowRoutines(false)}
        >
          <IoFilterOutline size={13} /> Sin rutinas
        </button>
        <button
          className={`filter-chip ${showRoutines ? 'active' : ''}`}
          onClick={() => setShowRoutines(true)}
        >
          Mostrar todo
        </button>
      </div>

      {/* ─── Tareas con Fecha Límite ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoAlertCircleOutline size={18} />
          Próximas fechas límite
        </h3>

        {groupedTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <IoFlagOutline size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              No hay tareas con fecha límite próxima.
            </p>
          </div>
        ) : (
          groupedTasks.map(({ key, label, tasks: dayTasks }) => (
            <div key={key} className="calendar-day-group">
              <div className="calendar-day-label">{label}</div>
              <div className="calendar-tasks-list">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`calendar-task-card ${isOverdue(task.due_date!) ? 'overdue' : ''}`}
                  >
                    <div className="calendar-task-left">
                      <div className={`priority-dot ${task.priority}`} />
                      <div>
                        <div className="calendar-task-title">{task.title}</div>
                        <div className="calendar-task-date">
                          <IoTimeOutline size={12} />
                          {formatDueDate(task.due_date!)}
                          {isOverdue(task.due_date!) && <span className="overdue-badge">Vencida</span>}
                        </div>
                      </div>
                    </div>
                    <span className="task-type-badge">{task.task_type || 'single'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ─── Resumen ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoCalendarOutline size={18} />
          Resumen
        </h3>
        <div className="empty-state" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {deadlineTasks.length} tarea{deadlineTasks.length !== 1 ? 's' : ''} con fecha límite pendiente
          </p>
        </div>
      </section>
    </>
  );
}
