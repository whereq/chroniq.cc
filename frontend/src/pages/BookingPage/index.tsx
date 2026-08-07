import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Logo } from '@/components/logo/Logo'
import { Button } from '@/components/ui/Button'
import { publicApi, type PublicEventType } from '@/api/client'
import { usePublicHolidays, browserCountry } from '@/hooks/usePublicHolidays'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function timezoneList(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
    .supportedValuesOf
  if (supported) {
    try {
      return supported('timeZone')
    } catch {
      /* fall through */
    }
  }
  return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Shanghai', 'Asia/Tokyo']
}

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const cells: Array<{ day: number; past: boolean } | null> = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    cells.push({ day: d, past: isPast })
  }
  return cells
}

export function BookingPage() {
  const { username = '', eventSlug = '' } = useParams()
  const { t } = useTranslation()

  const browserTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const [tz, setTz] = useState(browserTz)
  const tzOptions = useMemo(timezoneList, [])

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null) // ISO start
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar')
  const [form, setForm] = useState({ name: '', email: '', notes: '' })

  // Host + event details (single fetch; find the event by slug).
  const hostQuery = useQuery({
    queryKey: ['host', username],
    queryFn: () => publicApi.hostPage(username),
    enabled: !!username,
  })
  const event: PublicEventType | undefined = hostQuery.data?.event_types.find(
    (e) => e.slug === eventSlug,
  )

  // Slots for the selected day.
  const dateStr = selectedDay ? ymd(year, month, selectedDay) : ''
  const slotsQuery = useQuery({
    queryKey: ['slots', username, eventSlug, dateStr, tz],
    queryFn: () => publicApi.slots(username, eventSlug, dateStr, tz),
    enabled: !!selectedDay && !!event,
  })

  const bookMutation = useMutation({
    mutationFn: () =>
      publicApi.book(username, eventSlug, {
        start: selectedSlot!,
        invitee_name: form.name,
        invitee_email: form.email,
        invitee_timezone: tz,
        notes: form.notes || undefined,
      }),
    onSuccess: () => setStep('confirmed'),
  })

  const cells = generateCalendar(year, month)

  // Holiday hints for the invitee's own country (helps avoid booking on a holiday).
  const holidayByDate = usePublicHolidays(year, browserCountry())
  const selectedHoliday = selectedDay ? holidayByDate.get(ymd(year, month, selectedDay)) : undefined

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) } else setMonth((m) => m - 1)
    setSelectedDay(null); setSelectedSlot(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) } else setMonth((m) => m + 1)
    setSelectedDay(null); setSelectedSlot(null)
  }

  const fmtSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz })

  if (hostQuery.isLoading) {
    return <CenteredMessage>{t('common.loading', 'Loading…')}</CenteredMessage>
  }
  if (hostQuery.isError || !hostQuery.data) {
    return <CenteredMessage>{t('booking.host_not_found', 'This scheduling page was not found.')}</CenteredMessage>
  }
  if (!event) {
    return <CenteredMessage>{t('booking.event_not_found', 'This event type is not available.')}</CenteredMessage>
  }

  const host = hostQuery.data.host
  const hostName = host.display_name || host.username

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Logo size="sm" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {t('booking.secure')}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          {step === 'confirmed' ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('booking.confirmed_title', 'You are booked!')}</h2>
              <p className="text-gray-500 mb-6">{t('booking.confirmed_subtitle', 'A calendar invitation has been sent to your email.')}</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left inline-block min-w-60">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('booking.with_host', { title: event.title, host: hostName })}</p>
                {selectedSlot && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(selectedSlot).toLocaleString(undefined, {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', timeZone: tz,
                    })} ({tz})
                  </p>
                )}
              </div>
              <div className="mt-6">
                <Button onClick={() => { setStep('calendar'); setSelectedDay(null); setSelectedSlot(null); setForm({ name: '', email: '', notes: '' }) }}>
                  {t('booking.book_another', 'Book another meeting')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
              {/* Left: event info */}
              <div className="md:col-span-2 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4"
                  style={{ background: host.brand_color }}
                >
                  {hostName[0]?.toUpperCase() ?? 'U'}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{hostName}</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 mb-1">{event.title}</h1>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {event.duration_minutes} {t('booking.min')}
                </div>
                {event.description && <p className="text-sm text-gray-500 dark:text-gray-400">{event.description}</p>}

                {selectedSlot && (
                  <div className="mt-6 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                    <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">{t('booking.selected_time')}</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {new Date(selectedSlot).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tz}</p>
                  </div>
                )}
              </div>

              {/* Right: calendar or form */}
              <div className="md:col-span-3 p-4 sm:p-6">
                {step === 'calendar' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900 dark:text-white">{t('booking.select_date', 'Select a date & time')}</h2>
                      <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-28 text-center">{MONTHS[month]} {year}</span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                      {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {cells.map((cell, i) => {
                        const holiday = cell ? holidayByDate.get(ymd(year, month, cell.day)) : undefined
                        return (
                          <div key={i} className="aspect-square flex items-center justify-center">
                            {cell && (
                              <button
                                onClick={() => { setSelectedDay(cell.day); setSelectedSlot(null) }}
                                disabled={cell.past}
                                title={holiday || undefined}
                                className={clsx(
                                  'relative w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation',
                                  cell.day === selectedDay
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                                    : cell.past
                                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                    : 'text-gray-900 dark:text-gray-100 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600',
                                )}
                              >
                                {cell.day}
                                {holiday && (
                                  <span
                                    className={clsx(
                                      'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                                      cell.day === selectedDay ? 'bg-white' : 'bg-amber-400',
                                    )}
                                  />
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {selectedHoliday && (
                      <p className="mb-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                        🎉 {selectedHoliday}
                      </p>
                    )}

                    {/* Timezone selector */}
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('booking.timezone', 'Timezone')}</label>
                    <select
                      value={tz}
                      onChange={(e) => { setTz(e.target.value); setSelectedSlot(null) }}
                      className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                      {tzOptions.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>

                    {selectedDay && (
                      <>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                          {t('booking.select_time', 'Select a time')} — {MONTHS[month]} {selectedDay}
                        </h3>
                        {slotsQuery.isLoading ? (
                          <p className="text-sm text-gray-400">{t('common.loading', 'Loading…')}</p>
                        ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                          <p className="text-sm text-gray-400">{t('booking.no_times', 'No available times on this day.')}</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                            {slotsQuery.data!.slots.map((slot) => (
                              <button
                                key={slot.start}
                                onClick={() => setSelectedSlot(slot.start)}
                                className={clsx(
                                  'py-3 sm:py-2.5 rounded-lg text-sm font-medium border transition-all touch-manipulation',
                                  slot.start === selectedSlot
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600',
                                )}
                              >
                                {fmtSlot(slot.start)}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedSlot && (
                          <Button className="mt-4 w-full justify-center" onClick={() => setStep('form')}>
                            {t('booking.next', 'Next')}
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}

                {step === 'form' && (
                  <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate() }}>
                    <div className="flex items-center gap-2 mb-6">
                      <button type="button" onClick={() => setStep('calendar')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{t('booking.your_info', 'Enter your details')}</h2>
                    </div>

                    <div className="space-y-4">
                      <Field label={`${t('booking.name', 'Name')} *`}>
                        <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label={`${t('booking.email', 'Email')} *`}>
                        <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label={t('booking.notes', 'Notes')}>
                        <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
                      </Field>
                    </div>

                    {bookMutation.isError && (
                      <p className="mt-3 text-sm text-red-500">
                        {t('booking.error', 'That time is no longer available. Please pick another slot.')}
                      </p>
                    )}

                    <Button type="submit" className="mt-6 w-full justify-center" disabled={bookMutation.isPending}>
                      {bookMutation.isPending ? t('common.loading', 'Loading…') : t('booking.confirm', 'Schedule meeting')}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {!host.remove_branding && (
        <a
          href="https://chroniq.cc"
          target="_blank"
          rel="noreferrer"
          className="block py-4 text-center text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          {t('booking.powered_by', 'Powered by chroniq.cc')}
        </a>
      )}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  )
}
