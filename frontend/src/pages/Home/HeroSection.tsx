import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/auth/AuthProvider'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function MockBookingCard() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-purple-500 rounded-2xl blur-3xl opacity-20 scale-95" />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        {/* Card header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
              JD
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">Jane Doe</p>
              <p className="text-xs text-gray-500">30 min call</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Free</span>
            </div>
          </div>
        </div>

        {/* Mini calendar */}
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">May 2026</p>
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
            {[...Array(4)].map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {[12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d) => (
              <button
                key={d}
                className={`text-xs py-1.5 rounded-lg transition-colors ${
                  d === 19
                    ? 'bg-brand-600 text-white font-semibold'
                    : d === 16 || d === 18 || d === 22 || d === 23
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Time slots */}
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Tue, May 19</p>
          <div className="grid grid-cols-2 gap-2">
            {['9:00 AM','9:30 AM','10:00 AM','10:30 AM','2:00 PM','2:30 PM'].map((t, i) => (
              <button
                key={t}
                className={`text-xs py-2 rounded-lg border font-medium transition-all ${
                  i === 2
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="mt-3 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-brand-500/25">
            Confirm booking
          </button>
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Booked!</p>
          <p className="text-xs text-gray-500">Confirmation sent</p>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  const { t } = useTranslation()
  const { register } = useAuth()

  return (
    <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-brand-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="animate-slide-up">
            <div className="inline-flex mb-6">
              <Badge variant="brand" className="px-3 py-1.5 text-sm">
                <span className="w-2 h-2 bg-brand-500 rounded-full mr-2 animate-pulse-slow inline-block" />
                {t('hero.badge')}
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              {t('hero.headline').split('\n').map((line, i) => (
                <span key={i} className="block">
                  {i === 1 ? (
                    <span className="gradient-text">{line}</span>
                  ) : line}
                </span>
              ))}
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
              {t('hero.subheadline')}
            </p>

            <div className="mt-8 flex flex-col xs:flex-row flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={() => register()}>
                {t('hero.cta_primary')}
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              <Button variant="outline" size="lg" onClick={() => scrollToId('how-it-works')}>
                {t('hero.cta_secondary')}
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </Button>
            </div>

            {/* Honest trust line — no fabricated counts */}
            <p className="mt-10 text-sm text-gray-500 dark:text-gray-400">
              {t('hero.trust')}
            </p>
          </div>

          {/* Right: Booking card mockup — hidden on small screens, shown from lg */}
          <div className="relative animate-fade-in hidden lg:block">
            <MockBookingCard />
          </div>
          {/* Compact preview strip for sm/md screens */}
          <div className="lg:hidden flex items-center justify-center gap-4 flex-wrap">
            {['9:00 AM','10:30 AM','2:00 PM','3:30 PM'].map((slot) => (
              <span
                key={slot}
                className="px-4 py-2 rounded-xl border border-brand-300 dark:border-brand-700 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20"
              >
                {slot}
              </span>
            ))}
            <span className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/30">
              Book a time →
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
