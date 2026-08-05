import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { meApi, type Booking } from '@/api/client'
import { useAuth } from '@/auth/AuthProvider'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalEvent } from '@/types'

const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Map a backend booking (UTC) to a calendar meeting in the viewer's local tz. */
function toCalEvent(b: Booking): CalEvent {
  const start = new Date(b.start_utc)
  const end = new Date(b.end_utc)
  return {
    date: localDate(start),
    kind: 'meeting',
    title: { en: b.invitee_name?.trim() || 'Booking' },
    start: localHM(start),
    end: localHM(end),
    bookingId: b.id,
  }
}

/**
 * Loads the signed-in user's confirmed bookings and mirrors them into the
 * calendar store as meetings, so every calendar view renders real data.
 * Mount once at the top of the calendar workspace.
 */
export function useLoadBookings() {
  const { isAuthenticated } = useAuth()
  const setBookings = useCalendarStore((s) => s.setBookings)

  const { data } = useQuery({
    queryKey: ['me-bookings', 'all'],
    queryFn: () => meApi.listBookings('all'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!data) return
    setBookings(
      data
        .filter((b) => b.status === 'confirmed')
        .map(toCalEvent),
    )
  }, [data, setBookings])
}
