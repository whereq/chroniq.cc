import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Logo } from '@/components/logo/Logo'
import { Button } from '@/components/ui/Button'
import { publicApi } from '@/api/client'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function ManageBookingPage() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState<string | null>(null)

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['managed-booking', token],
    queryFn: () => publicApi.getBooking(token),
    enabled: !!token,
  })

  const tz = booking?.invitee_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const slotsQuery = useQuery({
    queryKey: ['reschedule-slots', token, date, tz],
    queryFn: () => publicApi.slots(booking!.host_username, booking!.event_slug, date, tz),
    enabled: !!booking && !!date,
  })

  const cancelMutation = useMutation({
    mutationFn: () => publicApi.cancelBooking(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['managed-booking', token] }),
  })
  const rescheduleMutation = useMutation({
    mutationFn: () => publicApi.rescheduleBooking(token, slot!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['managed-booking', token] })
      setRescheduling(false)
      setSlot(null)
      setDate('')
    },
  })

  const minDate = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: tz,
    })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Logo size="sm" />
      </div>

      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          {isLoading ? (
            <Msg>{t('common.loading')}</Msg>
          ) : isError || !booking ? (
            <Msg>{t('manage.invalid')}</Msg>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {t('booking.with_host', { title: booking.event_title, host: booking.host_display_name })}
              </h1>
              <p className="text-sm text-gray-500 mb-1">{fmt(booking.start_utc)} ({tz})</p>
              <span
                className={clsx(
                  'inline-block text-xs px-2 py-0.5 rounded-full mb-4',
                  booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                )}
              >
                {t(`manage.status.${booking.status}`, booking.status)}
              </span>

              {booking.status === 'cancelled' ? (
                <p className="text-sm text-gray-500">{t('manage.cancelled_notice')}</p>
              ) : rescheduling ? (
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{t('manage.pick_new_time')}</h2>
                  <input
                    type="date"
                    min={minDate}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSlot(null) }}
                    className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  />
                  {date && (
                    slotsQuery.isLoading ? (
                      <p className="text-sm text-gray-400">{t('common.loading')}</p>
                    ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400">{t('manage.no_times')}</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {slotsQuery.data!.slots.map((s) => (
                          <button
                            key={s.start}
                            onClick={() => setSlot(s.start)}
                            className={clsx(
                              'py-2 rounded-lg text-sm border',
                              s.start === slot
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-400',
                            )}
                          >
                            {fmtTime(s.start)}
                          </button>
                        ))}
                      </div>
                    )
                  )}
                  {rescheduleMutation.isError && <p className="text-sm text-red-500 mt-2">{t('manage.slot_taken')}</p>}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" disabled={!slot || rescheduleMutation.isPending} onClick={() => rescheduleMutation.mutate()}>
                      {rescheduleMutation.isPending ? t('common.saving') : t('manage.confirm_new_time')}
                    </Button>
                    <button className="text-sm text-gray-500" onClick={() => setRescheduling(false)}>{t('common.back')}</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => setRescheduling(true)}>{t('manage.reschedule')}</Button>
                  <button
                    className="text-sm text-red-500 hover:underline"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? t('manage.cancelling') : t('manage.cancel_meeting')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Msg({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <p className="text-gray-500 dark:text-gray-400">{children}</p>
    </div>
  )
}
