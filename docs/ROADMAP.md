# chroniq.cc — Product Roadmap

Plan to take chroniq.cc from a frontend-only prototype to a live, self-hostable
scheduling product (a Calendly-style booking platform) built on the shared
"whereq" stack (FastAPI + PostgreSQL + Keycloak + React/Vite + Docker).

> Status: **DRAFT for discussion.** Scope decisions locked so far:
> - v1 scope: **Full Calendly clone** (event types, availability, public booking, calendar sync, notifications)
> - Repo shape: **Restructure into `backend/` + `frontend/` monorepo now**
> - Calendar sync: **Google + Microsoft**
> - Auth: dedicated Keycloak realm `chroniq.cc` (house convention)

---

## 1. Target architecture

Mirrors `flowdesk.top` / `catobigato.com` exactly so ops, auth, and deploy are
shared muscle memory.

```
Browser (React 19 + Vite SPA)
   │  keycloak-js  ─────────────►  Keycloak realm "chroniq.cc"  (hosted at keytomarvel.com)
   │  axios + Bearer JWT                 │  clients: chroniq-spa (public), chroniq-backend (service acct)
   ▼                                     │  roles:   ch-admin, ch-tier-1/2/unlimited
FastAPI  (chroniq-api)                   │
   │  verifies RS256 JWT via JWKS + azp  ◄┘
   │  SQLAlchemy 2.0 async / asyncpg
   ▼
PostgreSQL  (whereq-db, database "chroniq")   ── shared container on whereq-network
   ▲
   │  external calendars: Google Calendar API, Microsoft Graph  (free/busy + event create)
   │  email: transactional mailer (confirmations, reminders, .ics)
   │  payments: Stripe Checkout + webhook → Keycloak role assignment
```

### Repo layout after Phase 0
```
chroniq.cc/
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   ├── routes/         # me_profile, event_types, availability, bookings,
│   │   │                   # public_booking, integrations, payments, calendar, status
│   │   ├── schemas/        # pydantic request/response models
│   │   └── services/       # slot_engine, google_cal, ms_graph, mailer,
│   │                       # keycloak_admin, stripe_service
│   ├── chroniq/
│   │   ├── auth.py         # ported from flowdesk/auth.py
│   │   ├── config.py       # pydantic-settings
│   │   ├── database.py     # async engine + Base
│   │   └── models/         # SQLAlchemy models (see §3)
│   ├── alembic/            # migrations
│   ├── tests/
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/               # current Vite app moves here
│   ├── src/
│   │   ├── auth/           # keycloak.ts, AuthProvider.tsx (ported)
│   │   ├── api/            # client.ts (axios + token refresh) + typed endpoints
│   │   ├── pages/          # Home (marketing), Booking, Dashboard/*, Calendar
│   │   ├── components/     # existing calendar workspace retained
│   │   ├── store/          # existing zustand stores
│   │   └── locales/        # existing i18n (complete DE/ES/IT/JA/KO)
│   └── ...
├── docker/
│   ├── api/{Dockerfile,Dockerfile.dev}
│   ├── frontend/{Dockerfile,Dockerfile.dev}
│   ├── docker-compose.dev.yml
│   ├── docker-compose.yml          # prod
│   └── docker-compose.postgres.yml # shared db (reference)
├── bin/                    # release.sh (exists) + deploy.sh + dev.sh
└── docs/ROADMAP.md         # this file
```

---

## 2. Keycloak realm design

Follows the flowdesk pattern (`docs/KEYCLOAK_SETUP.md` in flowdesk is the template).

- **Realm:** `chroniq.cc`
- **Clients:**
  - `chroniq-spa` — public SPA client (PKCE), redirect URIs for dev + prod.
  - `chroniq-backend` — confidential service account for Admin REST (role assignment after Stripe payment).
- **Roles:** `ch-admin` (bypass), `ch-tier-1`, `ch-tier-2`, `ch-tier-unlimited`; no role = free tier.
- **Login theme:** deploy existing `k2m-theme-chroniq` (Keycloakify) from `KeyToMarvel.com-theme`.
- **Backend env:** `KEYCLOAK_URL`, `KEYCLOAK_REALM=chroniq.cc`, `KEYCLOAK_CLIENT_ID=chroniq-spa`, `KEYCLOAK_ADMIN_CLIENT_ID=chroniq-backend`, `KEYCLOAK_ADMIN_CLIENT_SECRET`.

User identity across all tables = Keycloak `sub` UUID stored as `keycloak_id`.

---

## 3. Data model

All user-owned rows keyed by `keycloak_id` (PG UUID, indexed). Times stored UTC;
timezone stored per profile / per availability set.

| Table | Key columns | Notes |
|---|---|---|
| `user_profiles` | `keycloak_id` PK, `username` (unique, the booking handle), `display_name`, `timezone`, `avatar_url`, `brand_color` | `username` drives `/{username}/{slug}` public URLs |
| `event_types` | `id`, `keycloak_id`, `slug`, `title`, `description`, `duration_minutes`, `location` (video/phone/in-person/custom), `color`, `buffer_before`, `buffer_after`, `min_notice_minutes`, `is_active` | unique (`keycloak_id`, `slug`) |
| `availability_schedules` | `id`, `keycloak_id`, `name`, `timezone`, `is_default` | a named set of weekly rules |
| `availability_rules` | `id`, `schedule_id`, `day_of_week` (0–6), `start_time`, `end_time`, `is_enabled` | multiple windows per day allowed |
| `availability_overrides` | `id`, `schedule_id`, `date`, `is_unavailable`, `start_time?`, `end_time?` | holidays / one-off changes |
| `bookings` | `id`, `host_keycloak_id`, `event_type_id`, `invitee_name`, `invitee_email`, `invitee_timezone`, `start_utc`, `end_utc`, `status` (confirmed/cancelled/rescheduled), `notes`, `cancel_token`, `external_event_id` | **exclusion constraint** to prevent overlapping confirmed bookings per host |
| `calendar_connections` | `id`, `keycloak_id`, `provider` (google/microsoft), `access_token`, `refresh_token`, `token_expiry`, `calendar_id`, `sync_enabled` | tokens encrypted at rest |
| `notification_log` | `id`, `booking_id`, `type`, `sent_at` | idempotency for reminders |

Existing static data (`HOLIDAYS`, `EVENTS`, `BIRTHDAYS`, lunar, weather) stays as
frontend reference data for the calendar workspace — not migrated to DB in v1.

---

## 4. API surface

Prefix `/api/v1`. `me_*` routes require auth; `public/*` routes are anonymous.

**Authenticated (host):**
- `GET/PUT  /me/profile`
- `GET/POST /me/event-types`, `GET/PUT/DELETE /me/event-types/{id}`
- `GET/POST /me/availability`, `PUT/DELETE /me/availability/{id}` (+ rules/overrides)
- `GET  /me/bookings` (upcoming/past filters), `POST /me/bookings/{id}/cancel`, `/reschedule`
- `GET  /me/integrations`, `POST /me/integrations/{provider}/connect` (OAuth start), `/callback`, `DELETE /me/integrations/{id}`
- `POST /me/payments/checkout` → Stripe session; `POST /payments/webhook` (Stripe → role)

**Public (invitee — no auth):**
- `GET  /public/{username}` — host profile + active event types
- `GET  /public/{username}/{slug}` — event details
- `GET  /public/{username}/{slug}/slots?date=…&tz=…` — **computed available slots**
- `POST /public/{username}/{slug}/book` — create booking (validates, prevents double-book, creates external event, sends email)
- `GET/POST /public/bookings/{cancel_token}` — invitee self-serve cancel/reschedule

**Core service: `slot_engine`** — the heart of the product:
```
slots = for each day in range:
          availability windows (schedule rules − overrides)
          ∩ event duration grid (respecting min_notice, buffers)
          − existing confirmed bookings (host)
          − external busy blocks (Google + Microsoft free/busy)
          rendered in invitee timezone
```

---

## 5. Calendar integrations (Google + Microsoft)

- **OAuth connect flow** per provider, tokens stored in `calendar_connections`.
- **Free/busy read:** merge external busy blocks into `slot_engine`.
- **Event write:** on confirmed booking, create an event on the host's primary
  calendar (with invitee as attendee + video link when location=video); store
  `external_event_id`; delete/update on cancel/reschedule.
- Google: Calendar API (`freebusy.query`, `events.insert`). Microsoft: Graph
  (`/me/calendar/getSchedule`, `/me/events`). One service module each under
  `api/services/`, common interface so `slot_engine` is provider-agnostic.

---

## 6. Notifications

- Transactional email: booking confirmation (host + invitee), reminder (24h/1h),
  cancellation, reschedule — each with an `.ics` attachment.
- `notification_log` guards against duplicate sends; reminders driven by a small
  scheduler (APScheduler, same pattern as flowdesk collector) or a periodic task.
- Optional: web-push via VAPID (port flowdesk `webpush.py`) — deferred past v1.

---

## 7. Frontend rework

- **Restructure** current app into `frontend/`; add `auth/`, `api/`, react-query.
- **Replace fake auth** in `Header.tsx` with real `AuthProvider` (keycloak-js);
  sign-in/out, avatar, roles from token.
- **Route the marketing Home page** (already built, currently dead code) at `/`
  for anonymous visitors; authenticated users land on the dashboard/calendar.
- **Rebuild `BookingPage`** against `public/*` APIs (real slots, real submit,
  timezone selector) — replaces all mocked logic.
- **Build the Dashboard** (replace "Coming soon"): event-type manager,
  availability editor, bookings list, integrations, billing/settings.
- **Retain the calendar workspace** (Month/Week/Day/Year + Panel) — overlay real
  bookings from `/me/bookings` on top of the existing holiday/lunar/weather layers.
- **i18n:** complete the 5 lagging locales (DE/ES/IT/JA/KO miss ~12 keys each).

---

## 8. Payments & tiers

Port flowdesk `payments.py` + `services/keycloak_admin.py`:
- Pricing page → Stripe Checkout session.
- Webhook on payment success → assign `ch-tier-*` realm role via Admin REST
  (using `chroniq-backend` service account).
- Feature gating (e.g. number of event types, team seats) enforced by role.
- Define the actual tier limits in a `docs/PRICING_AND_QUOTA.md` (TBD).

---

## 9. Infrastructure & deploy

- `docker/` with `api` + `frontend` Dockerfiles (dev + prod), compose files.
- Join external `whereq-network`; use `whereq-db` with a new `chroniq` database.
- Alembic migrations run on API start (flowdesk pattern).
- `bin/deploy.sh` for the whereq-server prod path (`/home/whereq/git/chroniq.cc`).
- Health check endpoint (`GET /api/v1/health`) unauthenticated for Docker.
- CORS origins for dev (5173) + prod domain.

---

## 10. Phased delivery

| Phase | Deliverable | Status |
|---|---|---|
| **0. Restructure** | Monorepo layout, backend skeleton boots, marketing Home routed, dev docker compose | ✅ done — FE builds, API imports, tests green |
| **1. Auth** | Keycloak realm+clients+theme, `auth.py` ported, real login on frontend, `/me/profile` | ✅ realm imported & live on keytomarvel.com (`chroniq.cc` OIDC discovery 200; `chroniq-spa` allows `https://chroniq.cc/*`). **Not yet exercised in a browser; `chroniq-backend` secret still blank (only gates Stripe→role).** |
| **2. Booking core** | Event types + availability CRUD, `slot_engine`, public booking flow, double-book prevention | ✅ done — real APIs + rebuilt BookingPage; slot engine unit-tested |
| **3. Calendar sync** | Google + Microsoft OAuth, free/busy in slots, event write-back | ✅ code done — httpx REST impl + OAuth callback + parsers tested; needs OAuth creds to run live |
| **4. Notifications** | Confirmation + reminder + cancel/reschedule emails with `.ics` | ✅ done — confirmation/reminder(24h,1h)/cancel/reschedule + `.ics`; scheduler container; invitee self-service page (log-only until SMTP set) |
| **5. Dashboard** | Full authenticated management UI | ✅ done — event types, availability, bookings, integrations, settings sections |
| **6. Marketing + billing** | Pricing → Stripe → tier roles, complete locales, tests | ✅ mostly done — all 8 locales at parity; Pricing CTAs wired to Stripe checkout; entitlements enforced (**limit numbers are placeholders in `chroniq/entitlements.py` — set the real matrix**) |
| **7. Prod deploy** | Prod compose, deploy.sh, migrations, health checks live | ✅ live on the whereq server: `chroniq-api`/`-scheduler`/`-frontend` up, migration `0001` applied, Cloudflare Tunnel → `localhost:8082`, `www → apex` 301 redirect. Multi-mode `bin/deploy.sh` + compose `name: chroniq` guard. |

### Remaining before launch
- **Verify (do first):** exercise the core path in a browser on `https://chroniq.cc` — sign in → set username → create event type → set availability → book via the public link (private window) → invitee manage link. Follow `docs/E2E_CHECKLIST.md`.
- **User/config:** SMTP credentials (email is log-only until set); `chroniq-backend` client secret → `KEYCLOAK_ADMIN_CLIENT_SECRET`; Stripe keys + price ids; Google/Microsoft OAuth credentials.
- **Product decision:** finalize the tier-limit matrix in `chroniq/entitlements.py` (currently placeholders) and the Stripe price mapping.
- **Polish:** translate the 5 marketing i18n namespaces (`features`, `how_it_works`, `integrations`, `pricing`, `testimonials`) into the other 7 locales — currently English-only via fallback.

### Done since Phase 0
Booking flow (real slots + double-booking guard), dashboard (5 sections), Google/Microsoft sync (REST + OAuth callback), reminders + reschedule + invitee self-service, scheduler container, Stripe checkout wiring + entitlement enforcement. **i18n: all booking/dashboard/manage UI extracted — 8 locales at full 204-key parity.** E2E smoke-test checklist at `docs/E2E_CHECKLIST.md`. Backend: 19 tests green. Frontend: typecheck + build green.

---

## 11. Open decisions (to resolve before/along the way)

1. **Teams / round-robin** in v1, or single-host only first? (Calendly's team
   features are a large add-on; recommend single-host for v1.)
2. **Tier limits** — concrete free vs paid feature matrix (drives §8).
3. **Email provider** — which transactional mailer (SES / Resend / SMTP relay)?
4. **Video links** — auto-generate (Google Meet / Teams via the calendar event)
   or just store a static host meeting URL in v1?
5. **Token encryption** — KMS vs app-level symmetric key for `calendar_connections`.
6. **Username claim** — reserved handles, collision with existing routes
   (`/dashboard`, `/event-types` currently collide with `/{username}/{slug}`).
7. **Keep the calendar workspace's static holiday/lunar/weather data** as a
   differentiator feature, or trim it to focus on scheduling?
```
