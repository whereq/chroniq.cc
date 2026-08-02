import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export function CtaSection() {
  const { t } = useTranslation()

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-brand opacity-90 dark:opacity-80" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
          {t('cta.title')}
        </h2>
        <p className="mt-6 text-xl text-white/80">
          {t('cta.subtitle')}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            className="bg-white text-brand-700 hover:bg-gray-50 shadow-xl shadow-black/20 text-base px-8 py-3"
          >
            {t('cta.primary')}
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 border border-white/30 text-base px-8 py-3"
          >
            {t('cta.secondary')}
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto sm:max-w-none">
          {[
            { value: '50K+', label: 'Teams' },
            { value: '10M+', label: 'Meetings booked' },
            { value: '4.9★', label: 'Average rating' },
          ].map((stat) => (
            <div key={stat.label} className="flex sm:flex-col items-center sm:items-center justify-between sm:justify-start gap-3 sm:gap-0 py-3 sm:py-0 border-b sm:border-0 border-white/20 last:border-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">{stat.value}</div>
              <div className="text-sm text-white/70 sm:mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
