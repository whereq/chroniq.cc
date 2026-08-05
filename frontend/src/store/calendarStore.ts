import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarScope, CalendarView, CalendarFilters, CalEvent } from '../types';

interface CalendarState {
  locale: string;
  scope: CalendarScope;
  cursor: number; // timestamp
  weekStart: 0 | 1;
  weekNumbers: boolean;
  panelOpen: boolean;
  view: CalendarView;
  filters: CalendarFilters;
  /** Real bookings from /me/bookings, mapped to calendar meetings (not persisted). */
  bookings: CalEvent[];
  setBookings: (bookings: CalEvent[]) => void;
  /** Booking currently open in the detail modal (not persisted). */
  selectedBookingId: number | null;
  setSelectedBookingId: (id: number | null) => void;
  setLocale: (locale: string) => void;
  setScope: (scope: CalendarScope) => void;
  setCursor: (cursor: Date) => void;
  setWeekStart: (ws: 0 | 1) => void;
  setWeekNumbers: (wn: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  setView: (view: CalendarView) => void;
  setFilters: (filters: CalendarFilters) => void;
  updateFilter: <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => void;
}

const DEFAULT_FILTERS: CalendarFilters = {
  region: 'US',
  localHolidays: true,
  globalHolidays: true,
  meetings: true,
  events: true,
  birthdays: true,
  weather: true,
  fortune: true,
  lunar: false,
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      locale: 'en',
      scope: 'month',
      cursor: Date.now(),
      weekStart: 0,
      weekNumbers: false,
      panelOpen: true,
      view: 'calendar',
      filters: DEFAULT_FILTERS,
      bookings: [],
      selectedBookingId: null,

      setBookings: (bookings) => set({ bookings }),
      setSelectedBookingId: (selectedBookingId) => set({ selectedBookingId }),
      setLocale: (locale) => set({ locale }),
      setScope: (scope) => set({ scope }),
      setCursor: (cursor) => set({ cursor: cursor.getTime() }),
      setWeekStart: (weekStart) => set({ weekStart }),
      setWeekNumbers: (weekNumbers) => set({ weekNumbers }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setView: (view) => set({ view }),
      setFilters: (filters) => set({ filters }),
      updateFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
    }),
    {
      name: 'chroniq-cc-state',
      partialize: (s) => ({
        locale: s.locale,
        scope: s.scope,
        cursor: s.cursor,
        weekStart: s.weekStart,
        weekNumbers: s.weekNumbers,
        filters: s.filters,
      }),
    }
  )
);
