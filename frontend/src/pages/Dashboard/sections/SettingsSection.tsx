import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, type Profile } from '@/api/client'
import { Button } from '@/components/ui/Button'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function SettingsSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: meApi.getProfile })
  const [form, setForm] = useState<Partial<Profile>>({})

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Profile>) => meApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  if (isLoading) return <p className="text-gray-400 text-sm">{t('common.loading')}</p>

  const bookingUrl = `${window.location.origin}/${form.username ?? ''}`

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.settings.title')}</h2>

      <div className="space-y-4">
        <Field label={t('dashboard.settings.username')}>
          <input className={inputCls} value={form.username ?? ''} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">{bookingUrl}</p>
        </Field>
        <Field label={t('dashboard.settings.display_name')}>
          <input className={inputCls} value={form.display_name ?? ''} onChange={(e) => setForm((s) => ({ ...s, display_name: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.settings.timezone')}>
          <input className={inputCls} value={form.timezone ?? ''} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.settings.brand_color')}>
          <input type="color" value={form.brand_color ?? '#6366f1'} onChange={(e) => setForm((s) => ({ ...s, brand_color: e.target.value }))} className="h-9 w-16 rounded border border-gray-300 dark:border-gray-600" />
        </Field>
        <Field label={t('dashboard.settings.bio')}>
          <textarea rows={3} className={inputCls} value={form.bio ?? ''} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} />
        </Field>
      </div>

      {saveMutation.isError && <p className="text-sm text-red-500 mt-2">{t('dashboard.settings.save_error')}</p>}
      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
          {saveMutation.isPending ? t('common.saving') : t('common.save')}
        </Button>
        {saveMutation.isSuccess && <span className="text-sm text-green-500">{t('common.saved')}</span>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}
