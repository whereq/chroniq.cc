# chroniq.cc — Product Evolution Plan (POC → real product)

> Written 2026-08 after a full audit of the deployed v1. The v1 build plan lives
> in `ROADMAP.md`; **this** doc is the forward plan to turn a working-but-POC
> deployment into a product that feels real. Grounded in three locked decisions.

## Positioning (the north star)

chroniq is a **scheduling product built around a calendar you actually want to
look at.** Same booking engine as Calendly (event types, availability, public
booking links, double-book prevention), but the signed-in home is a rich,
**culturally-aware calendar** that overlays your real bookings and shows the
context of each day — holidays, lunar dates, weather, a bit of fortune. That
calendar is the differentiator; the booking engine is table stakes.

## Locked decisions (2026-08)

1. **Authed home = the real scheduling calendar** (overlay real `/me/bookings`),
   not the current bare management dashboard.
2. **Keep holidays/lunar/weather/fortune** and make them *real day-context*
   woven into the calendar (not decorative), with per-user toggles so B2B users
   can hide the astro/fortune flavor.
3. **Strip all fake marketing content now** (50k teams, brand logo wall, fake
   testimonials, "AI scheduling", "live demo") — honest, polished copy only.

## What's real vs POC today (audit)

- ✅ Real: booking backend (event types, availability, `slot_engine`, public
  booking + GiST double-book guard), dashboard CRUD, notifications (log-only),
  calendar-sync code, Keycloak auth (live).
- ⚠️ POC: `App.tsx` sends authed users to `DashboardPage` (5 tabs); the calendar
  workspace (`/app`) is stranded and is a holidays/lunar/weather/fortune viewer
  that **doesn't show bookings**; marketing page is full of placeholder claims;
  authed users still see marketing nav (Product/Solutions/Enterprise/About) that
  goes nowhere; no first-run onboarding, so a new user lands on an empty app.

---

## Phase A — Unify the authed experience (the calendar *is* the home)

**Goal:** log in → land on your real scheduling calendar with your bookings on it.

- Route authed `/` to the calendar workspace (`AppShell`/`CalendarPage`), not
  `DashboardPage` (`App.tsx`).
- **Overlay real bookings:** fetch `/me/bookings`, map to calendar events, render
  on Month/Week/Day/Year (`CalendarView` + `MonthView`/`WeekView`/`DayView`/
  `YearView`). Click a booking → detail/cancel/reschedule.
- **Relocate management** (event types, availability, integrations, settings)
  into a config area reachable from the calendar — a "Manage"/gear entry or
  slide-over — keeping the existing `Dashboard` sections as the content. Bookings
  list stays accessible too.
- **App vs marketing chrome:** `Header` shows app nav (Calendar · Event types ·
  Availability · Bookings · Settings · avatar/logout) when authed; the marketing
  nav only for anonymous. Remove dead links.
- **First-run onboarding:** if the user has no username / availability / event
  type, show a short guided setup (pick username → confirm availability → create
  first event type) instead of an empty calendar.

*Outcome: fixes "no full calendar when I log in" and makes the differentiator the
centerpiece.*

## Phase B — Make the day-context real (the moat)

**Goal:** holidays/lunar/weather/fortune become genuine, data-backed scheduling
signals, not decoration.

- **Holidays:** real per-country data (`data/calendarData.ts`, `CountryPicker`,
  `data/countries.ts`); mark holidays on calendar + public booking dates;
  optionally warn/soft-block booking on a holiday. Most defensible B2B value.
- **Lunar:** verify `lunarUtils` correctness; surface tastefully in day cells.
- **Weather:** wire `weatherUtils` to a real forecast API (needs key/config) for
  the meeting date/location, with graceful fallback when unavailable.
- **Fortune:** keep as light, clearly-fun flavor (`fortuneUtils`).
- **Per-user toggles** in Settings to show/hide each layer; default a clean B2B
  profile (holidays on, astro/fortune off) so it never feels gimmicky.

## Phase C — De-POC the marketing site (honest + polished)

**Goal:** the landing page tells the truth and looks intentional.

- **Remove:** "Trusted by 50,000+ teams", the brand logo wall, invented
  testimonials, "Now with AI scheduling", "View live demo" (`HeroSection`,
  `TestimonialsSection`, `IntegrationsSection`).
- **Rewrite** hero/features/how-it-works/pricing around features that exist;
  drop or gate the testimonials section until there are real quotes.
- **Real proof instead of fake:** replace the mock hero widget with a link to an
  actual live booking page (a demo user), or a labeled real product screenshot.
- **Wire nav:** Product→features anchor, Pricing→pricing, Resources→`/resources`;
  remove Solutions/Enterprise/About (or make them real). No dead links.
- **Re-do the marketing i18n** to match the new honest copy (supersedes the
  earlier "translate 5 namespaces" task — translate the *final* copy once).

## Phase D — Product polish & real operations

- **SMTP** so confirmations/reminders are real (`docker/.env` → `deploy.sh backend`).
- **Empty states & micro-UX** across dashboard/calendar; brand-consistent
  booking page.
- **Error boundary** so a render error can never blank the site again (the i18n
  `.map` crash showed the gap).
- Optional: a light **overview** (today/upcoming, simple stats).

## Phase E — Config-gated integrations & billing

- Google/Microsoft OAuth live (calendar free/busy + write-back).
- Stripe keys + price ids; set the **real tier-limit matrix** in
  `chroniq/entitlements.py`; `chroniq-backend` secret → `KEYCLOAK_ADMIN_CLIENT_SECRET`.

---

## Recommended sequence

1. **Phase A** — highest-impact, fixes the top complaint (biggest UI work).
2. **Phase C** — fast, high-visibility credibility win; can run alongside A.
3. **Phase B** — deepen the differentiator.
4. **Phase D**, then **E** as creds/decisions land.

## Cross-cutting

- Design-system pass (spacing, typography, empty states) — the engine is solid
  but the skin is plain; this is most of the "feels like a product" gap.
- Every phase ships via `bin/release.sh` → `bin/deploy.sh frontend|backend`.

## Open decisions

- **Solo vs teams:** recommend polishing single-host deeply first; add
  round-robin/collective later (large data-model add). Confirm before Phase B.
- **Weather provider** + whether weather is worth the API cost/complexity vs
  holidays+lunar alone.
