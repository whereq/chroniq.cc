import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCalendarStore } from '@/store/calendarStore'
import type { Holiday } from '@/types'

interface NagerHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  global: boolean
}

// Free, key-less public-holiday API (CORS-enabled). Any failure degrades to
// "no holidays" — never a crash, never fabricated data.
async function fetchYear(year: number, cc: string): Promise<NagerHoliday[]> {
  try {
    const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`)
    if (!r.ok) return []
    return (await r.json()) as NagerHoliday[]
  } catch {
    return []
  }
}

/**
 * Loads real public holidays for the selected region around the viewed year and
 * mirrors them into the calendar store, so every view shows accurate,
 * data-backed holidays (holiday-aware scheduling) instead of static samples.
 * Mount once at the top of the calendar workspace.
 */
export function useLoadHolidays() {
  const region = useCalendarStore((s) => s.filters.region)
  const cursor = useCalendarStore((s) => s.cursor)
  const setHolidays = useCalendarStore((s) => s.setHolidays)
  const year = new Date(cursor).getFullYear()

  const { data } = useQuery({
    queryKey: ['holidays', region, year],
    // Fetch the viewed year plus the next, so forward-looking booking dates and
    // the panel's 30-day outlook (which can cross a year boundary) are covered.
    queryFn: async () => {
      const [a, b] = await Promise.all([fetchYear(year, region), fetchYear(year + 1, region)])
      return [...a, ...b]
    },
    enabled: !!region,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (!data) return
    const holidays: Holiday[] = data.map((h) => ({
      date: h.date,
      region: h.countryCode,
      name: { en: h.name, [h.countryCode.toLowerCase()]: h.localName },
    }))
    setHolidays(holidays)
  }, [data, setHolidays])
}
