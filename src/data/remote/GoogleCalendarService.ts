/**
 * @file GoogleCalendarService.ts
 * @layer data/remote
 * @description Cliente para Google Calendar API.
 * ESTADO ACTUAL: Mockeado. La firma de métodos está lista para implementación real.
 *
 * Para implementación real se necesita:
 * 1. Google Cloud Console → Habilitar Calendar API
 * 2. OAuth 2.0 credentials con scope: https://www.googleapis.com/auth/calendar
 * 3. Reemplazar los mocks por llamadas a https://www.googleapis.com/calendar/v3/
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

const MOCK_EVENTS: GoogleCalendarEvent[] = [
  {
    id: 'gcal_event_mock_001',
    summary: 'Reunión de planificación Q2',
    description: 'Definir objetivos del próximo trimestre',
    start: { dateTime: new Date().toISOString(), timeZone: 'America/Bogota' },
    end: { dateTime: new Date(Date.now() + 3600000).toISOString(), timeZone: 'America/Bogota' },
    status: 'confirmed',
    htmlLink: 'https://calendar.google.com/mock-event',
  },
];

export class GoogleCalendarService {
  private readonly BASE_URL = 'https://www.googleapis.com/calendar/v3';

  constructor(private getAccessToken: () => string | null) {}

  /**
   * Obtiene los eventos del calendario primario del usuario
   * @param timeMin - Inicio del rango (ISO 8601)
   * @param timeMax - Fin del rango (ISO 8601)
   *
   * TODO (Real): GET /calendars/primary/events?timeMin=...&timeMax=...&singleEvents=true
   */
  async getEvents(timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> {
    console.log('[GoogleCalendarService] MOCK: getEvents', { timeMin, timeMax });

    // Simula latencia de red
    await this.simulateDelay(500);

    return MOCK_EVENTS.filter(event => {
      const eventTime = new Date(event.start.dateTime).getTime();
      return (
        eventTime >= new Date(timeMin).getTime() &&
        eventTime <= new Date(timeMax).getTime()
      );
    });
  }

  /**
   * Crea un evento en Google Calendar
   *
   * TODO (Real): POST /calendars/primary/events
   */
  async createEvent(input: CreateEventInput): Promise<GoogleCalendarEvent> {
    console.log('[GoogleCalendarService] MOCK: createEvent', input);
    await this.simulateDelay(800);

    const newEvent: GoogleCalendarEvent = {
      id: `gcal_mock_${Date.now()}`,
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: 'America/Bogota' },
      end: { dateTime: input.end, timeZone: 'America/Bogota' },
      status: 'confirmed',
    };

    return newEvent;
  }

  /**
   * Elimina un evento por ID
   *
   * TODO (Real): DELETE /calendars/primary/events/{eventId}
   */
  async deleteEvent(eventId: string): Promise<void> {
    console.log('[GoogleCalendarService] MOCK: deleteEvent', eventId);
    await this.simulateDelay(300);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
