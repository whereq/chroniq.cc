import { useQuery } from '@tanstack/react-query'

interface NagerHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
}

async function fetchYear(year: number, cc: string): Promise<NagerHoliday[]> {
  try {
    const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`)
    if (!r.ok) return []
    return (await r.json()) as NagerHoliday[]
  } catch {
    return []
  }
}

/** Best-effort ISO-3166 country from the browser locale (e.g. en-US → US). */
export function browserCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).region
    if (region) return region.toUpperCase()
  } catch {
    /* ignore */
  }
  return navigator.language.split('-')[1]?.toUpperCase() || 'US'
}

/**
 * Public holidays for a given year + country as a `date → name` map, for
 * anonymous surfaces (the invitee booking page). Failures degrade to an empty
 * map — holidays are a helpful hint, never a blocker.
 */
export function usePublicHolidays(year: number, country: string): Map<string, string> {
  const { data } = useQuery({
    queryKey: ['public-holidays', country, year],
    queryFn: () => fetchYear(year, country),
    enabled: !!country,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
  const byDate = new Map<string, string>()
  ;(data ?? []).forEach((h) => byDate.set(h.date, h.name))
  return byDate
}
