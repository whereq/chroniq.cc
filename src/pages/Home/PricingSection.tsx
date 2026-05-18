import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

const planKeys = ['free', 'pro', 'team'] as const

export function PricingSection() {
  const { t } = useTranslation()
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('pricing.title')}
          subtitle={t('pricing.subtitle')}
        />

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={clsx('text-sm font-medium', !annual ? 'text-gray-900 dark:text-white' : 'text-gray-500')}>
            {t('pricing.monthly')}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              annual ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
            )}
          >
            <div className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              annual ? 'translate-x-7' : 'translate-x-1'
            )} />
          </button>
          <span className={clsx('text-sm font-medium flex items-center gap-1.5', annual ? 'text-gray-900 dark:text-white' : 'text-gray-500')}>
            {t('pricing.annual')}
            <Badge variant="success" className="text-xs">{t('pricing.save')}</Badge>
          </span>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 md:gap-4 lg:gap-6 md:items-start">
          {planKeys.map((plan) => {
            const isPro = plan === 'pro'
            const features = t(`pricing.plans.${plan}.features`, { returnObjects: true }) as string[]

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
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
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
                      {annual && plan !== 'free'
                        ? t(`pricing.plans.${plan}.price`).replace(/\d+/, (n) => String(Math.floor(Number(n) * 0.8)))
                        : t(`pricing.plans.${plan}.price`)}
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
                  variant={isPro ? 'secondary' : 'primary'}
                  className={clsx(
                    'w-full justify-center',
                    isPro && 'bg-white text-brand-700 hover:bg-brand-50'
                  )}
                >
                  {t(`pricing.plans.${plan}.cta`)}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
