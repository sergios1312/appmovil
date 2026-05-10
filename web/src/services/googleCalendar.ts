/**
 * @file googleCalendar.ts — Google Calendar API client (100% reusable from mobile)
 */

import type { CalendarEvent } from '@/core/types/calendar';

interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
}

interface GoogleCalendarApiEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: GoogleCalendarDateTime;
  end?: GoogleCalendarDateTime;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarApiEvent[];
}

const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';

const resolveDate = (value?: GoogleCalendarDateTime): string => {
  return value?.dateTime ?? value?.date ?? new Date().toISOString();
};

export const mapGoogleEventToCalendarEvent = (
  googleEvent: GoogleCalendarApiEvent
): CalendarEvent => ({
  id: googleEvent.id,
  title: googleEvent.summary?.trim() || 'Untitled event',
  description: googleEvent.description,
  startDate: resolveDate(googleEvent.start),
  endDate: resolveDate(googleEvent.end),
  status: googleEvent.status ?? 'confirmed',
  htmlLink: googleEvent.htmlLink,
});

export async function fetchPrimaryCalendarEvents(
  accessToken: string,
  params?: { timeMin?: string; timeMax?: string }
): Promise<CalendarEvent[]> {
  const query = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: params?.timeMin ?? new Date().toISOString(),
    ...(params?.timeMax ? { timeMax: params.timeMax } : {}),
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_BASE_URL}/calendars/primary/events?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Google Calendar request failed (${response.status})`);
  const payload = (await response.json()) as GoogleCalendarEventsResponse;
  return (payload.items ?? []).map(mapGoogleEventToCalendarEvent);
}
