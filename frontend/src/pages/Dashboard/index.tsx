import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/auth/AuthProvider'
import { EventTypesSection } from './sections/EventTypesSection'
import { BookingsSection } from './sections/BookingsSection'
import { AvailabilitySection } from './sections/AvailabilitySection'
import { IntegrationsSection } from './sections/IntegrationsSection'
import { SettingsSection } from './sections/SettingsSection'

type Tab = 'event-types' | 'bookings' | 'availability' | 'integrations' | 'settings'

const TABS: { id: Tab; labelKey: string; icon: string }[] = [
  { id: 'event-types', labelKey: 'dashboard.tabs.event_types', icon: '🗓️' },
  { id: 'bookings', labelKey: 'dashboard.tabs.bookings', icon: '📋' },
  { id: 'availability', labelKey: 'dashboard.tabs.availability', icon: '⏰' },
  { id: 'integrations', labelKey: 'dashboard.tabs.integrations', icon: '🔌' },
  { id: 'settings', labelKey: 'dashboard.tabs.settings', icon: '⚙️' },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const { ready, isAuthenticated, login } = useAuth()
  const [tab, setTab] = useState<Tab>('event-types')

  if (!ready) return null

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('dashboard.signin_title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{t('dashboard.signin_subtitle')}</p>
            <Button onClick={() => login()}>{t('dashboard.signin_title')}</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 py-6 hidden sm:block">
          <nav className="space-y-1 px-3">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  tab === tb.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{tb.icon}</span> {t(tb.labelKey)}
              </button>
            ))}
            <a
              href="/app"
              className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>📆</span> {t('dashboard.tabs.calendar')}
            </a>
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 py-2 text-lg ${tab === tb.id ? 'text-brand-600' : 'text-gray-400'}`}>
              {tb.icon}
            </button>
          ))}
        </div>

        <main className="flex-1 p-6 pb-24 sm:pb-6">
          {tab === 'event-types' && <EventTypesSection />}
          {tab === 'bookings' && <BookingsSection />}
          {tab === 'availability' && <AvailabilitySection />}
          {tab === 'integrations' && <IntegrationsSection />}
          {tab === 'settings' && <SettingsSection />}
        </main>
      </div>
      <Footer />
    </div>
  )
}
