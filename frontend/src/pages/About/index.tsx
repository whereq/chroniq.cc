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
            <strong>chroniq.cc</strong> is a calendar-first scheduling tool. It gives you a
            shareable booking link — like the tools you already know — but it lives inside a
            real calendar workspace that actually understands your day: holidays, lunar dates,
            weather, and the meetings you&rsquo;ve already got.
          </p>

          <div className="legal-body mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
            <H2>Why we built it</H2>
            <p>
              Most scheduling tools treat your calendar as an empty grid to be filled. But a
              day isn&rsquo;t a void — it has a public holiday, a festival, a rainy afternoon,
              the fact that it&rsquo;s already 80% booked. We wanted a scheduler where the
              calendar is the home screen, not an afterthought hidden behind a booking form —
              so the times you offer are grounded in the day people actually live.
            </p>

            <H2>What chroniq.cc does</H2>
            <p>
              You publish your availability and the types of meetings you offer (a 15-minute
              intro, an hour-long consultation, and so on). chroniq.cc gives you a personal
              link — <code>chroniq.cc/your-name</code> — that anyone can open to pick a time
              that works. When they book, everyone gets a confirmation and the booking appears
              on your chroniq calendar; connect Google or Microsoft and it stays in sync with
              your real free/busy time so you&rsquo;re never double-booked.
            </p>

            <H2>More than a booking link — your day in context</H2>
            <p>
              The calendar workspace is the part we care most about. Alongside your meetings it
              can surface:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li><strong>Holidays &amp; observances</strong> — local public holidays and global observances for your region.</li>
              <li><strong>Chinese lunar calendar</strong> — lunar dates and festivals, for those who plan by them.</li>
              <li><strong>Weather</strong> — a look at the day so you can plan around it.</li>
              <li><strong>Daily context</strong> — small touches (like a daily fortune) that make the calendar feel human.</li>
              <li><strong>Eight languages</strong> — English, 中文, 日本語, 한국어, Deutsch, Español, Italiano, and Français.</li>
            </ul>
            <p className="mt-2">
              Every one of these is a real, toggleable layer — turn on what&rsquo;s useful, hide
              the rest.
            </p>

            <H2>How it works</H2>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li><strong>Set your availability</strong> — weekly hours, date overrides, and buffers between meetings.</li>
              <li><strong>Create event types</strong> — each with its own duration and rules.</li>
              <li><strong>Share your link</strong> — invitees see only times you&rsquo;re genuinely free and pick one.</li>
              <li><strong>Stay in sync</strong> — bookings show on your calendar; reschedules and cancellations keep it up to date.</li>
            </ul>

            <H2>Simple, honest pricing</H2>
            <p>
              chroniq.cc is <strong>free</strong> to use for a single event type and calendar
              connection — enough to share a working booking link today. <strong>Pro</strong>
              lifts those limits (unlimited event types, multiple calendars) and removes the
              &ldquo;Powered by chroniq.cc&rdquo; badge from your booking page. We only charge
              for things that are actually built, and we mark what&rsquo;s still coming as such.
            </p>

            <H2>Calendar integration &amp; your data</H2>
            <p>
              chroniq.cc can connect to your Google or Microsoft calendar to read your real{' '}
              <strong>free/busy</strong> times, so invitees can only book when you&rsquo;re
              genuinely available — no double-booking. This uses a limited availability
              (free/busy) permission that exposes only busy time ranges, not your event
              details. Optionally, with calendar-event access, chroniq can also write confirmed
              bookings to your calendar as events. We request only the minimum permissions
              needed, store any access tokens encrypted, and never use your calendar data for
              advertising or to train generalized AI models. You can disconnect at any time.
              See our <a href="/privacy">Privacy Policy</a> for the full details, including the
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
