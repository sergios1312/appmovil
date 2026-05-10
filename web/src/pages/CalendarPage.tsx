import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { fetchPrimaryCalendarEvents } from '@/services/googleCalendar';
import { formatDueDate, isOverdue } from '@/utils/dateHelpers';
import {
  IoCalendarOutline,
  IoOpenOutline,
  IoFilterOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoFlagOutline,
} from 'react-icons/io5';
import type { CalendarEvent } from '@/core/types/calendar';

export function CalendarPage() {
  const authStore = useAuthStore();
  const taskStore = useTaskStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoutines, setShowRoutines] = useState(false);

  useEffect(() => {
    if (!authStore.accessToken) return;

    setLoading(true);
    setError(null);
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    fetchPrimaryCalendarEvents(authStore.accessToken, { timeMax: next7Days })
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error consultando Calendar.'))
      .finally(() => setLoading(false));
  }, [authStore.accessToken]);

  // Tasks with deadlines (filtered to exclude routines by default)
  const deadlineTasks = useMemo(() => {
    return taskStore.tasks
      .filter(t => {
        if (!t.due_date) return false;
        if (t.status === 'completed') return false;
        if (!showRoutines && (t.task_type === 'routine' || t.hide_from_calendar)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  }, [taskStore.tasks, showRoutines]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dateKey = new Date(event.startDate).toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    }
    return groups;
  }, [events]);

  return (
    <>
      <div className="page-header">
        <h2>Calendario</h2>
        <div className="subtitle">Eventos y tareas con fecha límite</div>
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

      {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

      {/* ─── Tareas con Fecha Límite (Deadlines) ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoAlertCircleOutline size={18} />
          Tareas con fecha límite
        </h3>
        {deadlineTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <IoFlagOutline size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              No hay tareas con fecha límite próxima.
            </p>
          </div>
        ) : (
          <div className="calendar-tasks-list">
            {deadlineTasks.map((task) => (
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
        )}
      </section>

      {/* ─── Eventos del Calendario ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoCalendarOutline size={18} />
          Eventos de Google Calendar
        </h3>

        {loading ? (
          <div className="loading-page" style={{ minHeight: '200px' }}>
            <div className="spinner" />
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <IoCalendarOutline size={36} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              No hay eventos próximos en los próximos 7 días.
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="calendar-day-group">
              <div className="calendar-day-label">{dateLabel}</div>
              {dayEvents.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">
                    <IoCalendarOutline size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {new Date(event.startDate).toLocaleString('es', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                    {event.endDate && (
                      <> — {new Date(event.endDate).toLocaleString('es', {
                        hour: '2-digit', minute: '2-digit',
                      })}</>
                    )}
                  </div>
                  {event.description && <div className="event-desc">{event.description}</div>}
                  {event.htmlLink && (
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Ver en Google Calendar <IoOpenOutline size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </>
  );
}
