import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Construction icon */}
          <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-200 dark:border-brand-800 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('common.comingSoon')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            The dashboard is under active development. Sign up to get early access and be notified when it launches.
          </p>

          {/* Email waitlist */}
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button size="sm">Notify me</Button>
          </div>

          <div className="mt-6">
            <Link to="/" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
