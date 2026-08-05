import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, publicApi, type Booking } from '@/api/client'
import { useCalendarStore } from '@/store/calendarStore'

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

function formatWhen(b: Booking, locale: string): string {
  const start = new Date(b.start_utc)
  const end = new Date(b.end_utc)
  const day = start.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const hm = (d: Date) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${hm(start)} – ${hm(end)}`
}

const localDateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Detail popover for a booking clicked on the calendar. Reads the selected
 * booking id from the calendar store, looks it up in the cached /me/bookings
 * list, and offers the real host actions: cancel and reschedule (into an
 * actually-available slot, validated server-side).
 */
export function BookingDetailModal() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const selectedBookingId = useCalendarStore((s) => s.selectedBookingId)
  const setSelectedBookingId = useCalendarStore((s) => s.setSelectedBookingId)

  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState<string>('')

  const { data: bookings } = useQuery({
    queryKey: ['me-bookings', 'all'],
    queryFn: () => meApi.listBookings('all'),
    enabled: selectedBookingId != null,
  })
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: meApi.getProfile,
    enabled: selectedBookingId != null,
  })
  const { data: eventTypes } = useQuery({
    queryKey: ['event-types'],
    queryFn: meApi.listEventTypes,
    enabled: selectedBookingId != null,
  })

  const booking = bookings?.find((b) => b.id === selectedBookingId)
  const eventType = eventTypes?.find((e) => e.id === booking?.event_type_id)
  const username = profile?.username

  const { data: slotsData, isFetching: slotsLoading } = useQuery({
    queryKey: ['reschedule-slots', username, eventType?.slug, date],
    queryFn: () => publicApi.slots(username!, eventType!.slug, date, BROWSER_TZ),
    enabled: rescheduling && !!username && !!eventType?.slug && !!date,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => meApi.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-bookings'] })
      close()
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, start }: { id: number; start: string }) => meApi.rescheduleBooking(id, start),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-bookings'] })
      close()
    },
  })

  function close() {
    setSelectedBookingId(null)
    setRescheduling(false)
    setDate('')
    rescheduleMutation.reset()
    cancelMutation.reset()
  }

  function startReschedule() {
    if (booking) setDate(localDateInput(new Date(booking.start_utc)))
    setRescheduling(true)
  }

  if (selectedBookingId == null) return null

  return (
    <div className="booking-modal-backdrop" onClick={close}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-head">
          <h3>{rescheduling ? t('booking_detail.pick_new_time') : t('booking_detail.title')}</h3>
          <button className="booking-modal-x" onClick={close} aria-label={t('booking_detail.close')}>×</button>
        </div>

        {!booking ? (
          <p className="booking-modal-loading">{t('common.loading')}</p>
        ) : rescheduling ? (
          <>
            <div className="booking-modal-body" style={{ display: 'block' }}>
              <label className="reschedule-label">
                {t('booking_detail.choose_date')}
                <input
                  type="date"
                  className="reschedule-date"
                  value={date}
                  min={localDateInput(new Date())}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <div className="reschedule-slots">
                {slotsLoading ? (
                  <p className="booking-modal-loading">{t('common.loading')}</p>
                ) : (slotsData?.slots.length ?? 0) === 0 ? (
                  <p className="reschedule-empty">{t('booking_detail.no_slots')}</p>
                ) : (
                  slotsData!.slots.map((s) => (
                    <button
                      key={s.start}
                      className="reschedule-slot"
                      disabled={rescheduleMutation.isPending}
                      onClick={() => rescheduleMutation.mutate({ id: booking.id, start: s.start })}
                    >
                      {new Date(s.start).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' })}
                    </button>
                  ))
                )}
              </div>
            </div>

            {rescheduleMutation.isError && (
              <p className="booking-modal-error">{t('booking_detail.reschedule_error')}</p>
            )}

            <div className="booking-modal-actions">
              <button className="booking-modal-close-btn" onClick={() => setRescheduling(false)}>
                {t('booking_detail.back')}
              </button>
            </div>
          </>
        ) : (
          <>
            <dl className="booking-modal-body">
              <dt>{t('booking_detail.invitee')}</dt>
              <dd>
                {booking.invitee_name}
                <br />
                <a href={`mailto:${booking.invitee_email}`}>{booking.invitee_email}</a>
              </dd>

              <dt>{t('booking_detail.when')}</dt>
              <dd>{formatWhen(booking, i18n.language)}</dd>

              <dt>{t('booking_detail.status')}</dt>
              <dd>
                <span className={`booking-status booking-status--${booking.status}`}>
                  {t(`booking_detail.status_${booking.status}`, { defaultValue: booking.status })}
                </span>
              </dd>

              {booking.notes && (
                <>
                  <dt>{t('booking_detail.notes')}</dt>
                  <dd>{booking.notes}</dd>
                </>
              )}

              {booking.meeting_url && (
                <>
                  <dt>{t('booking_detail.join')}</dt>
                  <dd><a href={booking.meeting_url} target="_blank" rel="noreferrer">{booking.meeting_url}</a></dd>
                </>
              )}
            </dl>

            {cancelMutation.isError && (
              <p className="booking-modal-error">{t('booking_detail.cancel_error')}</p>
            )}

            <div className="booking-modal-actions">
              {booking.status === 'confirmed' && (
                <>
                  <button
                    className="booking-modal-cancel"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t('booking_detail.cancel_confirm'))) {
                        cancelMutation.mutate(booking.id)
                      }
                    }}
                  >
                    {cancelMutation.isPending ? t('booking_detail.cancelling') : t('booking_detail.cancel')}
                  </button>
                  <button className="booking-modal-reschedule" onClick={startReschedule}>
                    {t('booking_detail.reschedule')}
                  </button>
                </>
              )}
              <button className="booking-modal-close-btn" onClick={close}>{t('booking_detail.close')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
