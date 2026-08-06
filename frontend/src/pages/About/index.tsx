import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-10 mb-2">{children}</h2>
}

export function AboutPage() {
  return (
    <div className="app">
      <Header />
      <main className="main main-scroll">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">chroniq.cc</p>
          <h1 className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white">About chroniq.cc</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            <strong>chroniq.cc</strong> is a scheduling and booking platform. Share your
            personal chroniq.cc link and let anyone book time with you automatically —
            no back-and-forth emails, and never a double-booking.
          </p>

          <div className="legal-body mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
            <H2>What chroniq.cc does</H2>
            <p>
              You publish your availability and the types of meetings you offer (a
              15-minute intro, an hour-long consultation, and so on). chroniq.cc gives
              you a personal link — <code>chroniq.cc/your-name</code> — that anyone can
              open to pick a time that works. When they book, everyone gets a
              confirmation, and the meeting lands on your calendar.
            </p>

            <H2>How it works</H2>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li><strong>Set your availability</strong> — weekly hours, date overrides, and buffers between meetings.</li>
              <li><strong>Create event types</strong> — each with its own duration and rules.</li>
              <li><strong>Share your link</strong> — invitees see only times you're genuinely free and pick one.</li>
              <li><strong>Stay in sync</strong> — bookings are written to your calendar; reschedules and cancellations keep it up to date.</li>
            </ul>

            <H2>Calendar integration &amp; your data</H2>
            <p>
              chroniq.cc can connect to your Google or Microsoft calendar so that (1) your
              real <strong>free/busy</strong> times are subtracted from what invitees can
              book, and (2) confirmed bookings are written to your calendar as events. We
              request only the minimum calendar permissions needed for this, store any
              access tokens encrypted, and never use your calendar data for advertising or
              to train generalized AI models. You can disconnect at any time. See our{' '}
              <a href="/privacy">Privacy Policy</a> for the full details, including the
              Google API Services User Data Policy (Limited Use) disclosure.
            </p>

            <H2>Get in touch</H2>
            <p>
              Questions about chroniq.cc? Email{' '}
              <a href="mailto:admin@whereq.com">admin@whereq.com</a>. See also our{' '}
              <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
