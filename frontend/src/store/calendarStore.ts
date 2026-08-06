import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarScope, CalendarView, CalendarFilters, CalEvent, Holiday } from '../types';

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
  /** Real public holidays (fetched per region/year, not persisted). */
  holidays: Holiday[];
  setHolidays: (holidays: Holiday[]) => void;
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

// B2B-sensible defaults: real holidays + your meetings on; the flavor layers
// (simulated weather, fortune, lunar) and the unused event/birthday sources off.
// Users can re-enable any of them from the panel.
const DEFAULT_FILTERS: CalendarFilters = {
  region: 'US',
  localHolidays: true,
  globalHolidays: false,
  meetings: true,
  events: false,
  birthdays: false,
  weather: false,
  fortune: false,
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
      holidays: [],
      selectedBookingId: null,

      setBookings: (bookings) => set({ bookings }),
      setHolidays: (holidays) => set({ holidays }),
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
      version: 2,
      // Force the new B2B filter defaults for anyone with older persisted state
      // (which had simulated weather / fortune on), keeping their other prefs.
      migrate: (persisted: unknown, version: number) => {
        if (version < 2 && persisted && typeof persisted === 'object') {
          return { ...(persisted as object), filters: DEFAULT_FILTERS };
        }
        return persisted as never;
      },
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
