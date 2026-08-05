import axios from 'axios'
import keycloak from '@/auth/keycloak'

const API_BASE = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach a fresh Bearer token to authenticated requests. Anonymous users
// (public booking pages) skip this entirely — those endpoints need no token.
apiClient.interceptors.request.use(async (config) => {
  if (!keycloak.authenticated) return config
  try {
    await keycloak.updateToken(30)
  } catch {
    keycloak.login()
    return Promise.reject(new Error('Session expired — redirecting to login'))
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

// ---- Shared types (mirror backend schemas) --------------------------------

export interface Profile {
  keycloak_id: string
  username: string
  display_name: string
  timezone: string
  avatar_url: string | null
  brand_color: string
  bio: string | null
}

export interface EventType {
  id: number
  slug: string
  title: string
  description: string
  duration_minutes: number
  location: 'video' | 'phone' | 'in-person' | 'custom'
  location_detail: string | null
  color: string
  buffer_before: number
  buffer_after: number
  min_notice_minutes: number
  booking_window_days: number
  schedule_id: number | null
  is_active: boolean
}

export interface Slot {
  start: string
  end: string
}

export type PublicEventType = Pick<
  EventType,
  'slug' | 'title' | 'description' | 'duration_minutes' | 'location' | 'color'
>

export interface PublicHost {
  username: string
  display_name: string
  avatar_url: string | null
  brand_color: string
  bio: string | null
  timezone: string
}

export interface PublicHostPage {
  host: PublicHost
  event_types: PublicEventType[]
}

export interface BookingConfirmation {
  booking: {
    id: number
    start_utc: string
    end_utc: string
    status: string
    meeting_url: string | null
  }
  cancel_token: string
  host_display_name: string
  event_title: string
}

export interface ManagedBooking {
  id: number
  status: string
  start_utc: string
  end_utc: string
  invitee_name: string
  invitee_timezone: string
  meeting_url: string | null
  host_username: string
  host_display_name: string
  event_slug: string
  event_title: string
  duration_minutes: number
}

// ---- Authenticated endpoints ----------------------------------------------

export interface AvailabilityRule {
  id?: number
  day_of_week: number
  start_time: string
  end_time: string
  is_enabled: boolean
}

export interface AvailabilitySchedule {
  id: number
  name: string
  timezone: string
  is_default: boolean
  rules: AvailabilityRule[]
  overrides: Array<{ id?: number; date: string; is_unavailable: boolean; start_time?: string | null; end_time?: string | null }>
}

export interface Booking {
  id: number
  event_type_id: number
  invitee_name: string
  invitee_email: string
  invitee_timezone: string
  notes: string | null
  start_utc: string
  end_utc: string
  status: string
  meeting_url: string | null
}

export interface CalendarConnection {
  id: number
  provider: 'google' | 'microsoft'
  account_email: string | null
  sync_enabled: boolean
}

export const meApi = {
  getProfile: () => apiClient.get<Profile>('/me/profile').then((r) => r.data),
  updateProfile: (data: Partial<Profile>) =>
    apiClient.put<Profile>('/me/profile', data).then((r) => r.data),

  listEventTypes: () => apiClient.get<EventType[]>('/me/event-types').then((r) => r.data),
  createEventType: (data: Partial<EventType>) =>
    apiClient.post<EventType>('/me/event-types', data).then((r) => r.data),
  updateEventType: (id: number, data: Partial<EventType>) =>
    apiClient.put<EventType>(`/me/event-types/${id}`, data).then((r) => r.data),
  deleteEventType: (id: number) => apiClient.delete(`/me/event-types/${id}`),

  listSchedules: () =>
    apiClient.get<AvailabilitySchedule[]>('/me/availability').then((r) => r.data),
  createSchedule: (data: Partial<AvailabilitySchedule>) =>
    apiClient.post<AvailabilitySchedule>('/me/availability', data).then((r) => r.data),
  updateSchedule: (id: number, data: Partial<AvailabilitySchedule>) =>
    apiClient.put<AvailabilitySchedule>(`/me/availability/${id}`, data).then((r) => r.data),

  listBookings: (filter: 'upcoming' | 'past' | 'cancelled' | 'all' = 'upcoming') =>
    apiClient.get<Booking[]>('/me/bookings', { params: { filter } }).then((r) => r.data),
  cancelBooking: (id: number) =>
    apiClient.post<Booking>(`/me/bookings/${id}/cancel`).then((r) => r.data),
  rescheduleBooking: (id: number, start: string) =>
    apiClient.post<Booking>(`/me/bookings/${id}/reschedule`, { start }).then((r) => r.data),

  listConnections: () =>
    apiClient.get<CalendarConnection[]>('/me/integrations').then((r) => r.data),
  connect: (provider: 'google' | 'microsoft') =>
    apiClient.post<{ authorize_url: string }>(`/me/integrations/${provider}/connect`).then((r) => r.data),
  disconnect: (id: number) => apiClient.delete(`/me/integrations/${id}`),

  getEntitlements: () => apiClient.get<Entitlements>('/me/entitlements').then((r) => r.data),
  checkout: (plan: 'tier-1' | 'tier-2') =>
    apiClient.post<{ url: string }>('/me/payments/checkout', { plan }).then((r) => r.data),
}

export interface Entitlements {
  tier: string
  max_event_types: number | null
  max_calendar_connections: number | null
  remove_branding: boolean
  event_types_used: number
  calendar_connections_used: number
}

// ---- Public (anonymous) endpoints -----------------------------------------

export const publicApi = {
  hostPage: (username: string) =>
    apiClient.get<PublicHostPage>(`/public/${username}`).then((r) => r.data),
  slots: (username: string, slug: string, date: string, tz: string) =>
    apiClient
      .get<{ timezone: string; date: string; slots: Slot[] }>(
        `/public/${username}/${slug}/slots`,
        { params: { date, tz } },
      )
      .then((r) => r.data),
  book: (
    username: string,
    slug: string,
    body: { start: string; invitee_name: string; invitee_email: string; invitee_timezone: string; notes?: string },
  ) => apiClient.post<BookingConfirmation>(`/public/${username}/${slug}/book`, body).then((r) => r.data),

  getBooking: (token: string) =>
    apiClient.get<ManagedBooking>(`/public/bookings/${token}`).then((r) => r.data),
  cancelBooking: (token: string) =>
    apiClient.post<ManagedBooking>(`/public/bookings/${token}/cancel`).then((r) => r.data),
  rescheduleBooking: (token: string, start: string) =>
    apiClient.post<ManagedBooking>(`/public/bookings/${token}/reschedule`, { start }).then((r) => r.data),
}
