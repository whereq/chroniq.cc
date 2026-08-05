import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type Booking } from '@/api/client'
import { useCalendarStore } from '@/store/calendarStore'

function formatWhen(b: Booking, locale: string): string {
  const start = new Date(b.start_utc)
  const end = new Date(b.end_utc)
  const day = start.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const hm = (d: Date) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${hm(start)} – ${hm(end)}`
}

/**
 * Detail popover for a booking clicked on the calendar. Reads the selected
 * booking id from the calendar store, looks it up in the cached /me/bookings
 * list, and offers the real host action (cancel). Reschedule is not exposed
 * because the backend has no host-side reschedule endpoint yet.
 */
export function BookingDetailModal() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const selectedBookingId = useCalendarStore((s) => s.selectedBookingId)
  const setSelectedBookingId = useCalendarStore((s) => s.setSelectedBookingId)

  const { data: bookings } = useQuery({
    queryKey: ['me-bookings', 'all'],
    queryFn: () => meApi.listBookings('all'),
    enabled: selectedBookingId != null,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => meApi.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me-bookings'] })
      setSelectedBookingId(null)
    },
  })

  if (selectedBookingId == null) return null
  const booking = bookings?.find((b) => b.id === selectedBookingId)

  const close = () => setSelectedBookingId(null)

  return (
    <div className="booking-modal-backdrop" onClick={close}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-head">
          <h3>{t('booking_detail.title')}</h3>
          <button className="booking-modal-x" onClick={close} aria-label={t('booking_detail.close')}>×</button>
        </div>

        {!booking ? (
          <p className="booking-modal-loading">{t('common.loading')}</p>
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
              )}
              <button className="booking-modal-close-btn" onClick={close}>{t('booking_detail.close')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
