export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

