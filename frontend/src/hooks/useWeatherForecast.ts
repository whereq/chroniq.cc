import { useQuery } from '@tanstack/react-query'
import { CLIMATE, REGION_COORDS, wmoToCondition } from '@/utils/weatherUtils'
import type { WeatherCondition } from '@/types'

interface OpenMeteoDaily {
  daily?: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

/**
 * Real daily forecast (open-meteo, free/key-less/CORS) for a region's city,
 * as a `date → WeatherCondition` map. open-meteo only forecasts ~16 days out,
 * so dates beyond that are simply absent (WeatherCard shows "no data" rather
 * than a fabricated value). Any failure degrades to an empty map.
 */
export function useWeatherForecast(region: string): Map<string, WeatherCondition> {
  const coords = REGION_COORDS[region]
  const meta = CLIMATE[region]

  const { data } = useQuery({
    queryKey: ['weather', region],
    queryFn: async (): Promise<OpenMeteoDaily | null> => {
      if (!coords) return null
      const unit = meta?.unit === '°F' ? 'fahrenheit' : 'celsius'
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16` +
        `&temperature_unit=${unit}`
      try {
        const r = await fetch(url)
        if (!r.ok) return null
        return (await r.json()) as OpenMeteoDaily
      } catch {
        return null
      }
    },
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  })

  const map = new Map<string, WeatherCondition>()
  const d = data?.daily
  if (d) {
    for (let i = 0; i < d.time.length; i++) {
      map.set(d.time[i], {
        condition: wmoToCondition(d.weathercode[i]),
        high: Math.round(d.temperature_2m_max[i]),
        low: Math.round(d.temperature_2m_min[i]),
        unit: meta?.unit ?? '°C',
        city: meta?.city ?? region,
      })
    }
  }
  return map
}
