import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Button } from '@/components/ui/Button'

const integrations = [
  { name: 'Google Calendar', color: '#4285F4', initial: 'G' },
  { name: 'Microsoft Outlook', color: '#0078D4', initial: 'O' },
  { name: 'Zoom', color: '#2D8CFF', initial: 'Z' },
  { name: 'Microsoft Teams', color: '#5B5EA6', initial: 'T' },
  { name: 'Slack', color: '#4A154B', initial: 'S' },
  { name: 'Salesforce', color: '#00A1E0', initial: 'SF' },
  { name: 'HubSpot', color: '#FF7A59', initial: 'H' },
  { name: 'Zapier', color: '#FF4A00', initial: 'Z' },
  { name: 'Stripe', color: '#635BFF', initial: 'St' },
  { name: 'PayPal', color: '#003087', initial: 'P' },
  { name: 'Notion', color: '#000000', initial: 'N' },
  { name: 'Linear', color: '#5E6AD2', initial: 'L' },
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
          <Button variant="outline">
            {t('integrations.cta')}
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  )
}
