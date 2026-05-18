import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/logo/Logo'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function generateSlots() {
  return ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM']
}

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const cells: Array<{ day: number; available: boolean; past: boolean } | null> = []

  for (let i = 0; i < firstDay; i++) cells.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dayOfWeek = date.getDay()
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    cells.push({ day: d, available: !isPast && !isWeekend, past: isPast })
  }
  return cells
}

export function BookingPage() {
  const { username, eventSlug } = useParams()
  const { t } = useTranslation()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar')
  const [form, setForm] = useState({ name: '', email: '', notes: '' })

  const cells = generateCalendar(year, month)
  const slots = generateSlots()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
    setSelectedSlot(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
    setSelectedSlot(null)
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirmed')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Logo size="sm" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Secure & encrypted
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          {step === 'confirmed' ? (
            /* Confirmation screen */
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('booking.confirmed_title')}</h2>
              <p className="text-gray-500 mb-6">{t('booking.confirmed_subtitle')}</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left inline-block min-w-60">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">30-min call with {username}</p>
                <p className="text-sm text-gray-500 mt-1">{DAYS[new Date(year, month, selectedDay!).getDay()]}, {MONTHS[month]} {selectedDay}, {year}</p>
                <p className="text-sm text-gray-500">{selectedSlot}</p>
              </div>
              <div className="mt-6">
                <Button onClick={() => { setStep('calendar'); setSelectedDay(null); setSelectedSlot(null); }}>
                  Book another meeting
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl">
              {/* Left panel: Event info */}
              <div className="md:col-span-2 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold mb-4">
                  {username?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{username}</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1 mb-1">
                  {eventSlug?.replace(/-/g, ' ') ?? '30 Minute Meeting'}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  30 min
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Zoom video call
                </div>

                {selectedDay && selectedSlot && (
                  <div className="mt-6 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                    <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Selected time</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {DAYS[new Date(year, month, selectedDay).getDay()]}, {MONTHS[month]} {selectedDay}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSlot} · {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                  </div>
                )}
              </div>

              {/* Right panel: Calendar or form */}
              <div className="md:col-span-3 p-4 sm:p-6">
                {step === 'calendar' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {t('booking.select_date')}
                      </h2>
                      <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-28 text-center">
                          {MONTHS[month]} {year}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Days of week */}
                    <div className="grid grid-cols-7 mb-2">
                      {DAYS.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 mb-6">
                      {cells.map((cell, i) => (
                        <div key={i} className="aspect-square flex items-center justify-center">
                          {cell && (
                            <button
                              onClick={() => cell.available && setSelectedDay(cell.day)}
                              disabled={!cell.available}
                              className={clsx(
                                'w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation',
                                cell.day === selectedDay
                                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                                  : cell.available
                                  ? 'text-gray-900 dark:text-gray-100 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600'
                                  : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                              )}
                            >
                              {cell.day}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Time slots */}
                    {selectedDay && (
                      <>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                          {t('booking.select_time')} — {MONTHS[month]} {selectedDay}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                          {slots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={clsx(
                                'py-3 sm:py-2.5 rounded-lg text-sm font-medium border transition-all touch-manipulation',
                                slot === selectedSlot
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600'
                              )}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                        {selectedSlot && (
                          <Button
                            className="mt-4 w-full justify-center"
                            onClick={() => setStep('form')}
                          >
                            Next
                            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}

                {step === 'form' && (
                  <form onSubmit={handleConfirm}>
                    <div className="flex items-center gap-2 mb-6">
                      <button
                        type="button"
                        onClick={() => setStep('calendar')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="font-semibold text-gray-900 dark:text-white">{t('booking.your_info')}</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('booking.name')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('booking.email')} *
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('booking.notes')}
                        </label>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="mt-6 w-full justify-center">
                      {t('booking.confirm')}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
