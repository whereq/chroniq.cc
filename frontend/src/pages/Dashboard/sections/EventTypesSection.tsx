import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type EventType } from '@/api/client'
import { Button } from '@/components/ui/Button'

const EMPTY: Partial<EventType> = {
  slug: '',
  title: '',
  description: '',
  duration_minutes: 30,
  location: 'video',
  color: '#6366f1',
  is_active: true,
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function EventTypesSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['event-types'],
    queryFn: meApi.listEventTypes,
  })

  const [editing, setEditing] = useState<Partial<EventType> | null>(null)

  const saveMutation = useMutation({
    mutationFn: (et: Partial<EventType>) =>
      et.id ? meApi.updateEventType(et.id, et) : meApi.createEventType(et),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-types'] })
      setEditing(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => meApi.deleteEventType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-types'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.event_types.title')}</h2>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>{t('dashboard.event_types.new')}</Button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      ) : eventTypes.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('dashboard.event_types.none')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {eventTypes.map((et) => (
            <div key={et.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: et.color }} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{et.title}</p>
                    <p className="text-xs text-gray-500">/{et.slug} · {et.duration_minutes} {t('booking.min')} · {t(`dashboard.location.${et.location === 'in-person' ? 'in_person' : et.location}`)}</p>
                  </div>
                </div>
                {!et.is_active && <span className="text-xs text-amber-500">{t('dashboard.event_types.inactive')}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button className="text-xs text-brand-600 hover:underline" onClick={() => setEditing(et)}>{t('common.edit')}</button>
                <button className="text-xs text-red-500 hover:underline" onClick={() => et.id && deleteMutation.mutate(et.id)}>{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              {editing.id ? t('dashboard.event_types.modal_edit') : t('dashboard.event_types.modal_new')}
            </h3>
            <div className="space-y-3">
              <input className={inputCls} placeholder={t('dashboard.event_types.f_title')} value={editing.title ?? ''} onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))} />
              <input className={inputCls} placeholder={t('dashboard.event_types.f_slug')} value={editing.slug ?? ''} onChange={(e) => setEditing((s) => ({ ...s, slug: e.target.value }))} />
              <textarea className={inputCls} placeholder={t('dashboard.event_types.f_description')} rows={2} value={editing.description ?? ''} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
              <div className="flex gap-3">
                <input type="number" className={inputCls} placeholder={t('dashboard.event_types.f_minutes')} value={editing.duration_minutes ?? 30} onChange={(e) => setEditing((s) => ({ ...s, duration_minutes: Number(e.target.value) }))} />
                <select className={inputCls} value={editing.location ?? 'video'} onChange={(e) => setEditing((s) => ({ ...s, location: e.target.value as EventType['location'] }))}>
                  <option value="video">{t('dashboard.location.video')}</option>
                  <option value="phone">{t('dashboard.location.phone')}</option>
                  <option value="in-person">{t('dashboard.location.in_person')}</option>
                  <option value="custom">{t('dashboard.location.custom')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing((s) => ({ ...s, is_active: e.target.checked }))} />
                {t('dashboard.event_types.f_active')}
              </label>
            </div>
            {saveMutation.isError && <p className="text-sm text-red-500 mt-2">{t('dashboard.event_types.save_error')}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button className="text-sm text-gray-500" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(editing)}>{t('common.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
