import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'

// Only integrations that are actually wired today. Keep this honest — add a
// brand here only when its integration ships.
const integrations = [
  { name: 'Google Calendar', color: '#4285F4', initial: 'G' },
  { name: 'Microsoft Outlook', color: '#0078D4', initial: 'O' },
  { name: 'Stripe', color: '#635BFF', initial: 'St' },
]

export function IntegrationsSection() {
  const { t } = useTranslation()

  return (
    <section id="integrations" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('integrations.title')}
          subtitle={t('integrations.subtitle')}
        />

        <div className="mt-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {integrations.map((integ) => (
            <div
              key={integ.name}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-inner"
                style={{ backgroundColor: integ.color }}
              >
                {integ.initial}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium leading-tight">
                {integ.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('integrations.cta')}</p>
        </div>
      </div>
    </section>
  )
}
