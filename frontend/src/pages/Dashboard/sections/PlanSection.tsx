import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { meApi } from '@/api/client'
import { Button } from '@/components/ui/Button'

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  'tier-1': 'Pro',
  'tier-2': 'Team',
  unlimited: 'Unlimited',
  admin: 'Admin',
}

function UsageRow({ label, used, limit, unlimitedText }: { label: string; used: number; limit: number | null; unlimitedText: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white tabular-nums">
        {used} / {limit === null ? unlimitedText : limit}
      </span>
    </div>
  )
}

export function PlanSection() {
  const { t } = useTranslation()
  const { data: ent, isLoading } = useQuery({ queryKey: ['entitlements'], queryFn: meApi.getEntitlements })
  const [busy, setBusy] = useState(false)

  if (isLoading || !ent) return <p className="text-gray-400 text-sm">{t('common.loading')}</p>

  const isFree = ent.tier === 'free'
  const planName = PLAN_LABEL[ent.tier] ?? ent.tier
  const unlimited = t('dashboard.plan.unlimited', 'Unlimited')

  const upgrade = async () => {
    try {
      setBusy(true)
      const { url } = await meApi.checkout('tier-1')
      window.location.href = url
    } catch {
      setBusy(false)
    }
  }

  const manage = async () => {
    try {
      setBusy(true)
      const { url } = await meApi.portal()
      window.location.href = url
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {t('dashboard.plan.title', 'Plan & billing')}
      </h2>

      {/* Current plan */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{t('dashboard.plan.current', 'Current plan')}</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{planName}</p>
          </div>
          {!isFree && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {t('dashboard.plan.active', 'Active')}
            </span>
          )}
        </div>
        <div className="text-sm">
          <UsageRow label={t('dashboard.plan.event_types', 'Event types')} used={ent.event_types_used} limit={ent.max_event_types} unlimitedText={unlimited} />
          <UsageRow label={t('dashboard.plan.calendars', 'Calendar connections')} used={ent.calendar_connections_used} limit={ent.max_calendar_connections} unlimitedText={unlimited} />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-gray-600 dark:text-gray-300">{t('dashboard.plan.branding', 'Remove “Powered by” badge')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {ent.remove_branding ? t('common.yes', 'Yes') : t('common.no', 'No')}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade CTA (Free only) */}
      {isFree ? (
        <div className="mt-5 rounded-xl border-2 border-brand-500 p-5 bg-brand-50/50 dark:bg-brand-900/10">
          <p className="font-bold text-gray-900 dark:text-white">
            {t('dashboard.plan.upgrade_title', 'Upgrade to Pro')}
            <span className="ml-2 text-brand-600 dark:text-brand-300">CA$9.99{t('dashboard.plan.per_month', '/mo')}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.plan.upgrade_desc', 'Unlimited event types, connect multiple calendars, remove the “Powered by chroniq.cc” badge, and priority support.')}
          </p>
          <Button className="mt-3 w-full justify-center" disabled={busy} onClick={upgrade}>
            {busy ? '…' : t('dashboard.plan.upgrade_cta', 'Upgrade to Pro')}
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <Button variant="secondary" className="w-full justify-center" disabled={busy} onClick={manage}>
            {busy ? '…' : t('dashboard.plan.manage_cta', 'Manage subscription')}
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            {t('dashboard.plan.manage_note', 'Update your card or cancel anytime — changes take effect immediately.')}
          </p>
        </div>
      )}
    </div>
  )
}
