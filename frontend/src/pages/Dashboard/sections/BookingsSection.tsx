import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi } from '@/api/client'

type Filter = 'upcoming' | 'past' | 'cancelled'

const FILTER_LABEL: Record<Filter, string> = {
  upcoming: 'dashboard.bookings.filter_upcoming',
  past: 'dashboard.bookings.filter_past',
  cancelled: 'dashboard.bookings.filter_cancelled',
}

export function BookingsSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', filter],
    queryFn: () => meApi.listBookings(filter),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => meApi.cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.bookings.title')}</h2>
      <div className="flex gap-2 mb-4">
        {(['upcoming', 'past', 'cancelled'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === f ? 'bg-brand-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {t(FILTER_LABEL[f])}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('dashboard.bookings.none')}</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{b.invitee_name}</p>
                <p className="text-xs text-gray-500">{b.invitee_email} · {fmt(b.start_utc)}</p>
                {b.notes && <p className="text-xs text-gray-400 mt-1">{b.notes}</p>}
              </div>
              {filter === 'upcoming' && (
                <button className="text-xs text-red-500 hover:underline" onClick={() => cancelMutation.mutate(b.id)}>
                  {t('dashboard.bookings.cancel')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
