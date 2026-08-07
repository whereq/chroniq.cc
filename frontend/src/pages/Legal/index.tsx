import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const LAST_UPDATED = 'August 6, 2026'
const CONTACT_EMAIL = 'admin@whereq.com'

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="app">
      <Header />
      <main className="main main-scroll">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
          <div className="legal-body mt-8 space-y-6 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-2">{children}</h2>
}
function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-1">{children}</ul>
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <P>
        This Privacy Policy explains how chroniq.cc ("chroniq", "we", "us") collects, uses, and
        protects information when you use our scheduling and booking service (the "Service").
        By using the Service you agree to this policy. Questions? Contact{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </P>

      <H2>Information we collect</H2>
      <UL>
        <li><strong>Account &amp; identity</strong> — when you sign in (via our identity provider, Keycloak), we receive your name and email address.</li>
        <li><strong>Profile</strong> — the username, display name, timezone, avatar, brand color, and bio you set.</li>
        <li><strong>Scheduling data</strong> — your event types, availability, and bookings. For each booking we store the invitee's name, email, chosen time, timezone, and any notes they provide.</li>
        <li><strong>Connected calendars</strong> — if you connect Google or Microsoft, we store OAuth access/refresh tokens (encrypted) and the connected account's email address.</li>
        <li><strong>Technical &amp; local data</strong> — minimal cookies/local storage for your session, theme, and language preferences.</li>
      </UL>

      <H2>Google user data</H2>
      <P>
        If you connect a Google account, chroniq requests access to your Google Calendar to read
        your <strong>free/busy</strong> availability, so your booking page only offers times you're
        actually free (preventing double-booking). This uses a limited availability (free/busy)
        permission that returns only busy time ranges — never the details of your events.
      </P>
      <P>
        If you additionally grant calendar-event access, chroniq can also <strong>create, update,
        and delete calendar events</strong> for bookings made through chroniq (writing confirmed
        meetings to your calendar). This is optional and requested separately.
      </P>
      <P>
        We store the resulting OAuth tokens encrypted at rest and use them only to provide these
        scheduling features on your behalf. We do <strong>not</strong> use Google user data for
        advertising, and we do <strong>not</strong> use it to train generalized AI/ML models.
      </P>
      <P>
        <strong>Limited Use.</strong> chroniq's use and transfer of information received from Google
        APIs to any other app will adhere to the{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Google API Services User Data Policy
        </a>, including the Limited Use requirements.
      </P>

      <H2>How we use information</H2>
      <UL>
        <li>Provide the Service: generate accurate availability, take bookings, and sync them to your calendar.</li>
        <li>Send transactional emails (booking confirmations, reminders, reschedule/cancellation notices).</li>
        <li>Maintain security, prevent abuse, and comply with legal obligations.</li>
      </UL>

      <H2>How we share information</H2>
      <P>We do not sell your personal information. We share it only:</P>
      <UL>
        <li><strong>With your invitees</strong> as needed to schedule a meeting (e.g., a booking confirmation).</li>
        <li><strong>With service providers</strong> that operate the Service: Keycloak (authentication), Google / Microsoft (calendar sync, only when you connect them), Stripe (payments, if you subscribe), and our email provider (transactional email).</li>
        <li><strong>When required by law</strong> or to protect rights and safety.</li>
      </UL>

      <H2>Storage &amp; security</H2>
      <P>
        Data is stored in our PostgreSQL database. OAuth tokens are encrypted at rest. Access is
        restricted and transmitted over TLS. No system is perfectly secure, but we take reasonable
        measures to protect your information.
      </P>

      <H2>Data retention &amp; deletion</H2>
      <UL>
        <li><strong>Disconnect a calendar</strong> at any time in Dashboard → Integrations; this deletes the stored tokens for that connection.</li>
        <li>You may revoke chroniq's access directly in your Google Account at{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>.</li>
        <li><strong>Delete your account</strong> by contacting <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>; we remove your profile, bookings, and connections, subject to legal retention requirements.</li>
      </UL>

      <H2>Your rights</H2>
      <P>
        Depending on your location, you may have rights to access, correct, export, or delete your
        personal data. Contact us to exercise them.
      </P>

      <H2>Children</H2>
      <P>The Service is not directed to children under 13 (or the age of digital consent in your region).</P>

      <H2>Changes</H2>
      <P>We may update this policy; material changes will be reflected by the "Last updated" date above.</P>

      <H2>Contact</H2>
      <P>Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</P>
    </LegalShell>
  )
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <P>
        These Terms of Service ("Terms") govern your use of chroniq.cc (the "Service"). By accessing
        or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
      </P>

      <H2>The service</H2>
      <P>
        chroniq is a scheduling and booking platform: you publish availability and event types,
        others book time with you, and bookings can sync to your connected calendar.
      </P>

      <H2>Accounts &amp; eligibility</H2>
      <UL>
        <li>You must provide accurate information and keep your account secure.</li>
        <li>You are responsible for activity under your account and for your invitees' experience.</li>
        <li>You must be able to form a binding contract to use the Service.</li>
      </UL>

      <H2>Acceptable use</H2>
      <P>You agree not to misuse the Service, including: unlawful activity, spam, infringing others' rights, attempting to disrupt or reverse-engineer the Service, or using it to send unsolicited communications.</P>

      <H2>Bookings &amp; invitees</H2>
      <P>
        You are responsible for honoring bookings you accept and for the accuracy of your
        availability. chroniq is a tool to coordinate meetings; we are not a party to any agreement
        between you and your invitees.
      </P>

      <H2>Third-party integrations</H2>
      <P>
        When you connect Google, Microsoft, or Stripe, your use of those services is also governed by
        their respective terms and privacy policies. You authorize chroniq to access those services on
        your behalf to provide the features you enable, and you can disconnect them at any time.
      </P>

      <H2>Plans &amp; payment</H2>
      <P>
        Paid plans (where offered) are billed through Stripe. Fees, billing cycles, and any free tier
        are described at the point of purchase. Except where required by law, payments are
        non-refundable.
      </P>

      <H2>Intellectual property</H2>
      <P>
        The Service, including its software and branding, is owned by chroniq and its licensors. You
        retain ownership of the content and data you provide.
      </P>

      <H2>Disclaimers</H2>
      <P>
        The Service is provided "as is" and "as available," without warranties of any kind. We do not
        guarantee that the Service will be uninterrupted, error-free, or that calendar sync will
        always be timely or complete.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, chroniq will not be liable for indirect, incidental,
        special, consequential, or punitive damages, or for lost profits, data, or missed meetings
        arising from your use of the Service.
      </P>

      <H2>Termination</H2>
      <P>
        You may stop using the Service at any time. We may suspend or terminate access for violations
        of these Terms or to protect the Service and its users.
      </P>

      <H2>Changes</H2>
      <P>We may update these Terms; continued use after changes constitutes acceptance. The "Last updated" date above reflects the latest version.</P>

      <H2>Contact</H2>
      <P>Questions about these Terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</P>
    </LegalShell>
  )
}
