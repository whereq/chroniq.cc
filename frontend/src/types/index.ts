export type Theme = 'dark' | 'light';
export type Locale = 'en' | 'zh' | 'fr' | 'ja' | 'ko' | 'de' | 'es' | 'it';

export interface EventType {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  color: string;
  location: 'video' | 'phone' | 'in-person' | 'custom';
  isActive: boolean;
}

export interface TimeSlot {
  startISO: string;
  endISO: string;
  available: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  startISO: string;
  endISO: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
}

export interface AvailabilityRule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

/* ─── Calendar Types ─────────────────────────────────────── */
export type CalendarScope = 'year' | 'month' | 'week' | 'day';
export type CalendarView = 'calendar' | 'resources';

export interface CalendarFilters {
  region: string;
  localHolidays: boolean;
  globalHolidays: boolean;
  meetings: boolean;
  events: boolean;
  birthdays: boolean;
  weather: boolean;
  fortune: boolean;
  lunar: boolean;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  region: string; // ISO-3166 or 'global'
  name: Record<string, string>; // { en: '...', zh: '...', ... }
}

export interface CalEvent {
  date: string;
  kind: 'meeting' | 'event';
  title: Record<string, string>;
  start: string; // HH:MM
  end: string;
  bookingId?: number; // set for real bookings, enables click-through to detail
}

export interface Birthday {
  md: string; // MM-DD
  name: string;
}

export interface Country {
  code: string; // ISO-3166
  flag: string; // emoji
}

export interface WeatherCondition {
  condition: 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';
  high: number;
  low: number;
  unit: '°C' | '°F';
  city: string;
}

export interface CalendarItem {
  type: 'holiday' | 'meeting' | 'event' | 'birthday';
  title: string;
  color: string;
  allDay?: boolean;
  start?: string;
  end?: string;
  region?: string;
  bookingId?: number; // set for real bookings, enables click-through to detail
}
