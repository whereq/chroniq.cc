import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import { useAuth } from '@/auth/AuthProvider'
import { meApi } from '@/api/client'

const planKeys = ['free', 'pro', 'team'] as const

// Marketing plan key → backend checkout plan (free has no checkout).
const PLAN_TO_TIER: Record<string, 'tier-1' | 'tier-2' | null> = {
  free: null,
  pro: 'tier-1',
  team: 'tier-2',
}

export function PricingSection() {
  const { t } = useTranslation()
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)

  const handlePlan = async (plan: (typeof planKeys)[number]) => {
    const tier = PLAN_TO_TIER[plan]
    if (!tier) {
      // Free plan: sign up (anonymous) or go to the dashboard (authed).
      isAuthenticated ? navigate('/dashboard') : register()
      return
    }
    if (!isAuthenticated) {
      login()
      return
    }
    try {
      setBusy(plan)
      const { url } = await meApi.checkout(tier)
      window.location.href = url
    } catch {
      setBusy(null)
    }
  }

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        <div className="mt-12 grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-6 md:items-start">
          {planKeys.map((plan) => {
            const isPro = plan === 'pro'
            const rawFeatures = t(`pricing.plans.${plan}.features`, { returnObjects: true })
            const features = Array.isArray(rawFeatures) ? (rawFeatures as string[]) : []

            return (
              <div
                key={plan}
                className={clsx(
                  'relative rounded-2xl p-6 flex flex-col',
                  isPro
                    ? 'bg-brand-600 text-white shadow-2xl shadow-brand-500/30 ring-2 ring-brand-400 md:scale-105'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                )}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded shadow">
                      {t('pricing.plans.pro.badge')}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={clsx('text-lg font-bold mb-1', isPro ? 'text-white' : 'text-gray-900 dark:text-white')}>
                    {t(`pricing.plans.${plan}.name`)}
                  </h3>
                  <p className={clsx('text-sm', isPro ? 'text-brand-200' : 'text-gray-500 dark:text-gray-400')}>
                    {t(`pricing.plans.${plan}.desc`)}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={clsx('text-4xl font-extrabold', isPro ? 'text-white' : 'text-gray-900 dark:text-white')}>
                      {t(`pricing.plans.${plan}.price`)}
                    </span>
                    <span className={clsx('text-sm', isPro ? 'text-brand-200' : 'text-gray-500 dark:text-gray-400')}>
                      {t(`pricing.plans.${plan}.period`)}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg
                        className={clsx('w-4 h-4 flex-shrink-0 mt-0.5', isPro ? 'text-brand-200' : 'text-brand-500')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={clsx('text-sm', isPro ? 'text-brand-100' : 'text-gray-600 dark:text-gray-400')}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPro ? 'inverse' : 'primary'}
                  className="w-full justify-center"
                  disabled={busy === plan}
                  onClick={() => handlePlan(plan)}
                >
                  {busy === plan ? '…' : t(`pricing.plans.${plan}.cta`)}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
