import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'

const stepIcons = [
  // Create
  <svg key="create" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>,
  // Share
  <svg key="share" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>,
  // Meet
  <svg key="meet" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>,
]

const stepKeys = ['create', 'share', 'meet']

export function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('how_it_works.title')}
          subtitle={t('how_it_works.subtitle')}
        />

        <div className="mt-16 grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-brand-400 to-brand-600 opacity-30" />

          {stepKeys.map((key, i) => (
            <div key={key} className="relative flex flex-col items-center text-center">
              {/* Step number badge */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  {stepIcons[i]}
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {i + 1}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t(`how_it_works.steps.${key}.title`)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t(`how_it_works.steps.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
