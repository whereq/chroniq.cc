import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type AvailabilityRule } from '@/api/client'
import { Button } from '@/components/ui/Button'

interface DayState {
  enabled: boolean
  start: string
  end: string
}

function defaultWeek(): DayState[] {
  // Mon–Fri 9–5 enabled by default (index 0 = Sunday).
  return Array.from({ length: 7 }, (_, dow) => ({
    enabled: dow >= 1 && dow <= 5,
    start: '09:00',
    end: '17:00',
  }))
}

function rulesToWeek(rules: AvailabilityRule[]): DayState[] {
  const week = defaultWeek().map((d) => ({ ...d, enabled: false }))
  for (const r of rules) {
    if (week[r.day_of_week]) {
      week[r.day_of_week] = {
        enabled: r.is_enabled,
        start: r.start_time.slice(0, 5),
        end: r.end_time.slice(0, 5),
      }
    }
  }
  return week
}

const timeCls =
  'px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white'

export function AvailabilitySection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dayNames = t('days.full', { returnObjects: true }) as string[]

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: meApi.listSchedules,
  })
  const schedule = schedules.find((s) => s.is_default) ?? schedules[0]

  const [week, setWeek] = useState<DayState[]>(defaultWeek())
  const [tz, setTz] = useState(browserTz)

  useEffect(() => {
    if (schedule) {
      setWeek(rulesToWeek(schedule.rules))
      setTz(schedule.timezone)
    }
  }, [schedule])

  const saveMutation = useMutation({
    mutationFn: () => {
      const rules: AvailabilityRule[] = week
        .map((d, dow) => ({ ...d, dow }))
        .filter((d) => d.enabled)
        .map((d) => ({
          day_of_week: d.dow,
          start_time: `${d.start}:00`,
          end_time: `${d.end}:00`,
          is_enabled: true,
        }))
      const payload = { name: 'Working hours', timezone: tz, is_default: true, rules, overrides: [] }
      return schedule
        ? meApi.updateSchedule(schedule.id, payload)
        : meApi.createSchedule(payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })

  const update = (dow: number, patch: Partial<DayState>) =>
    setWeek((w) => w.map((d, i) => (i === dow ? { ...d, ...patch } : d)))

  if (isLoading) return <p className="text-gray-400 text-sm">{t('common.loading')}</p>

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.availability.title')}</h2>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t('dashboard.availability.timezone')}</label>
        <input className={timeCls} value={tz} onChange={(e) => setTz(e.target.value)} />
      </div>

      <div className="space-y-2 max-w-lg">
        {week.map((d, dow) => (
          <div key={dow} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 w-32">
              <input type="checkbox" checked={d.enabled} onChange={(e) => update(dow, { enabled: e.target.checked })} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{dayNames[dow]}</span>
            </label>
            {d.enabled ? (
              <div className="flex items-center gap-2">
                <input type="time" className={timeCls} value={d.start} onChange={(e) => update(dow, { start: e.target.value })} />
                <span className="text-gray-400">–</span>
                <input type="time" className={timeCls} value={d.end} onChange={(e) => update(dow, { end: e.target.value })} />
              </div>
            ) : (
              <span className="text-sm text-gray-400">{t('dashboard.availability.unavailable')}</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? t('common.saving') : t('dashboard.availability.save')}
        </Button>
        {saveMutation.isSuccess && <span className="text-sm text-green-500">{t('common.saved')}</span>}
      </div>
    </div>
  )
}
