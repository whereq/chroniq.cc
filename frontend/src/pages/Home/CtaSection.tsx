import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthProvider'

export function CtaSection() {
  const { t } = useTranslation()
  const { register } = useAuth()

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
            variant="inverse"
            onClick={() => register()}
            className="shadow-xl shadow-black/20 text-base px-8 py-3"
          >
            {t('cta.primary')}
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-white hover:bg-white/10 border border-white/30 text-base px-8 py-3"
          >
            {t('cta.secondary')}
          </Button>
        </div>
      </div>
    </section>
  )
}
