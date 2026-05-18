import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CalendarPage } from '@/pages/CalendarPage'
import { ResourcesPage } from '@/pages/Resources'
import { BookingPage } from '@/pages/BookingPage'
import { DashboardPage } from '@/pages/Dashboard'
import { useCalendarStore } from '@/store/calendarStore'

function AppShell() {
  const view = useCalendarStore((s) => s.view);

  return (
    <div className="app">
      <Header />
      <main className="main">
        {view === 'calendar' ? <CalendarPage /> : <ResourcesPage />}
      </main>
      <Footer />
    </div>
  );
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
          {/* Main app — calendar + resources view */}
          <Route path="/" element={<AppShell />} />

          {/* Booking page — standalone layout */}
          <Route path="/:username/:eventSlug" element={<BookingPage />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/event-types" element={<DashboardPage />} />
          <Route path="/availability" element={<DashboardPage />} />
          <Route path="/team" element={<DashboardPage />} />
          <Route path="/integrations" element={<DashboardPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
