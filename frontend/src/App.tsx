import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CalendarPage } from '@/pages/CalendarPage'
import { ResourcesPage } from '@/pages/Resources'
import { BookingPage } from '@/pages/BookingPage'
import { ManageBookingPage } from '@/pages/ManageBooking'
import { DashboardPage } from '@/pages/Dashboard'
import { HomePage } from '@/pages/Home'
import { PrivacyPage, TermsPage } from '@/pages/Legal'
import { AboutPage } from '@/pages/About'
import { useCalendarStore } from '@/store/calendarStore'
import { useAuth } from '@/auth/AuthProvider'
import { useLoadBookings } from '@/hooks/useLoadBookings'
import { useLoadHolidays } from '@/hooks/useLoadHolidays'
import { OnboardingBanner } from '@/components/calendar/OnboardingBanner'

function AppShell() {
  const view = useCalendarStore((s) => s.view);
  // Mirror the signed-in user's real bookings + real public holidays into the store.
  useLoadBookings();
  useLoadHolidays();

  return (
    <div className="app">
      <Header />
      <OnboardingBanner />
      <main className="main">
        {view === 'calendar' ? <CalendarPage /> : <ResourcesPage />}
      </main>
      <Footer />
    </div>
  );
}

/** Marketing landing page (anonymous) wrapped in the shared chrome. */
function Landing() {
  return (
    <div className="app">
      <Header />
      {/* Scrollable middle so the pinned footer (privacy/terms) stays visible. */}
      <div className="main main-scroll">
        <HomePage />
      </div>
      <Footer />
    </div>
  );
}

/**
 * Root route: signed-in users get the calendar workspace, anonymous visitors
 * get the marketing site. While Keycloak is initializing we render nothing to
 * avoid a flash of the wrong page.
 */
function Root() {
  const { ready, isAuthenticated } = useAuth();
  if (!ready) return null;
  // Signed-in users land on the calendar workspace (their real bookings);
  // anonymous visitors get the marketing site. Management lives at /dashboard.
  return isAuthenticated ? <AppShell /> : <Landing />;
}

function NotFound() {
  return (
    <div className="app">
      <Header />
      <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)', marginBottom: 12 }}>404</h1>
          <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>Page not found</p>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            ← Go home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Root — marketing (anonymous) or dashboard (authed) */}
          <Route path="/" element={<Root />} />

          {/* Management dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Calendar workspace */}
          <Route path="/app" element={<AppShell />} />

          {/* About + Legal */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Invitee self-service (from confirmation email link) */}
          <Route path="/bookings/:token" element={<ManageBookingPage />} />

          {/* Public booking page — standalone layout */}
          <Route path="/:username/:eventSlug" element={<BookingPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
