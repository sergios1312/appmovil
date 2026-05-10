import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { fetchPrimaryCalendarEvents } from '@/services/googleCalendar';
import { IoCalendarOutline, IoOpenOutline } from 'react-icons/io5';
import type { CalendarEvent } from '@/core/types/calendar';

export function CalendarPage() {
  const authStore = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <div className="page-header">
        <h2>Google Calendar</h2>
        <div className="subtitle">Proximos eventos del calendario primario</div>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

      {loading ? (
        <div className="loading-page" style={{ minHeight: '200px' }}>
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><IoCalendarOutline size={48} /></div>
          <h3>No hay eventos proximos</h3>
          <p>Los eventos de los proximos 7 dias apareceran aqui.</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="event-card">
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              <IoCalendarOutline size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {new Date(event.startDate).toLocaleString('es', {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
            {event.description && <div className="event-desc">{event.description}</div>}
            {event.htmlLink && (
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Ver en Google Calendar <IoOpenOutline size={12} />
              </a>
            )}
          </div>
        ))
      )}
    </>
  );
}
