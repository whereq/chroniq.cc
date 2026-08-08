# chroniq.cc — Release 1.0 (Technical Notes)

**Release:** 1.0 — General Availability
**Date:** August 2026
**Audience:** engineering / technical

chroniq.cc is a calendar-first scheduling & booking platform (Calendly-style) built
on the shared **whereq** stack. This release marks the first production-ready,
billing-enabled version: a real signed-in calendar workspace, a public booking
flow backed by a tested slot engine, Keycloak SSO, calendar free/busy sync, and a
complete Stripe subscription lifecycle (upgrade → entitlement grant, cancel →
auto-downgrade).

---

## 1. Architecture at a glance

Monorepo, deployed as Docker services on the shared whereq server behind a
Cloudflare Tunnel.

```
backend/    FastAPI + SQLAlchemy(async) + Alembic + Keycloak JWT
frontend/   React 19 + Vite + TypeScript + keycloak-js + react-query
docker/     Dockerfiles + docker-compose.{yml,dev.yml}  (name: chroniq)
bin/        release.sh, dev.sh, deploy.sh
docs/       ROADMAP.md, releases/
```

- **Edge:** Cloudflare Tunnel maps `chroniq.cc` → `localhost:8082` (the
  `chroniq-frontend` container). nginx inside the frontend image proxies
  `/api` → `chroniq-api:8000` (explicitly the chroniq container, not the shared
  `api` alias, which would round-robin across whereq apps).
- **Services:** `chroniq-api` (FastAPI/uvicorn), `chroniq-scheduler`
  (`python -m scheduler.main`, background reminders), `chroniq-frontend`
  (static build served by nginx).
- **Data:** dedicated `chroniq` PostgreSQL role + `chroniq` database inside the
  shared `whereq-db`; chroniq never manages Postgres itself. External
  `whereq-network`. Compose declares a top-level `name: chroniq` so operations
  never tear down sibling whereq apps.
- **Isolation:** all secrets live in `docker/.env` (mode 600, gitignored).

---

## 2. Backend

**Stack:** Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, pydantic-settings,
httpx, asyncpg, stripe, python-jose/JWKS.

### Auth
- `chroniq/auth.py` verifies Keycloak **RS256** JWTs via a cached JWKS with an
  `azp`/audience check. Dependencies expose `CurrentUser` (claims dict) and
  `CurrentUserId` (Keycloak `sub` UUID). User identity = `keycloak_id` on every
  user-owned row.
- Realm `chroniq.cc` (hosted at keytomarvel.com). Clients: `chroniq-spa`
  (public SPA, PKCE) and `chroniq-backend` (confidential service account with
  `realm-management: manage-users` + `view-realm`, used to grant/revoke tier
  roles). Roles: `ch-admin`, `ch-tier-1`, `ch-tier-2`, `ch-tier-unlimited`.

### Routing (`api/routes/`, all under `/api/v1`)
- `me_*` (auth required): profile, entitlements, event types, availability,
  bookings, integrations, payments checkout/portal.
- `public_booking` (anonymous): the invitee flow (`/public/{username}/...`).
- `status` (unauthenticated) + `/health` smoke endpoint.

### Slot engine — the core
`api/services/slot_engine.py` computes bookable slots as:

```
availability ∩ duration − existing bookings − external busy − (min notice / booking window)
```

Pure and **unit-tested without a database**. This is the product's heart and the
most heavily tested module.

### Data model (`chroniq/models/`)
`user_profiles`, `event_types`, `availability_schedules` / `_rules` /
`_overrides`, `bookings`, `calendar_connections`, `notification_log`.
- All times stored **UTC**.
- A **GiST exclusion constraint** (migration 0001, requires the `btree_gist`
  extension) blocks overlapping *confirmed* bookings per host at the DB level —
  double-booking is impossible even under a race.
- Migrations of note: `0002` widen `avatar_url` → Text; `0003` add
  `remove_branding`; `0004` add `stripe_customer_id`.

### Entitlements
`chroniq/entitlements.py` is the single source of truth mapping Keycloak roles →
feature limits (`None` = unlimited):

| Feature                | Free | Pro (ch-tier-1) | Team (ch-tier-2) | Admin |
|------------------------|------|-----------------|------------------|-------|
| max event types        |  1   | ∞               | ∞                | ∞     |
| max calendar conns     |  1   | ∞               | ∞                | ∞     |
| remove branding        | no   | yes             | yes              | yes   |

Enforced at the route layer (`event_types`, `integrations` return **402** on
exceed) and surfaced via `GET /me/entitlements` (tier + limits + current usage).

### Billing (Stripe)
- `POST /me/payments/checkout` → creates a **subscription** Checkout Session,
  stamping `client_reference_id = keycloak sub` and
  `subscription_data.metadata.keycloak_id` (so cancellation events know whose
  role to revoke).
- `POST /me/payments/portal` → Stripe **Billing Portal** session (self-serve
  update card / cancel) keyed by the stored `stripe_customer_id`.
- `POST /payments/webhook` → signature-verified; on
  **`checkout.session.completed`** grants the tier role (`chroniq-backend`
  Keycloak admin) + stores the customer id + sets `remove_branding`; on
  **`customer.subscription.deleted`** revokes the role → auto-downgrade to Free.
- **SDK note:** the installed `stripe` Python SDK's `StripeObject` does not
  expose dict `.get()`; the webhook verifies via `construct_event` then reads
  fields from the raw JSON payload as a plain dict.

### Integrations (staged)
- **Google / Microsoft calendar** (`calendar_providers.py`): OAuth + `free_busy`
  read is **live** for Google (least-privilege `calendar.freebusy` scope — no
  sensitive-scope verification required); event-write and Microsoft are wired as
  interfaces and staged for a later release.
- **Email** (`mailer.py`): live via Zoho SMTP (SSL 465); runs log-only if
  `SMTP_HOST` is unset — the booking flow completes regardless.
- OAuth tokens are stored **encrypted** at rest (`TOKEN_ENCRYPTION_KEY`).

### Tests
25 tests pass with no DB required: slot engine, entitlements matrix, profile
schema, Google OAuth wiring, `/health` smoke test.

---

## 3. Frontend

**Stack:** React 19, Vite, TypeScript, keycloak-js, axios, @tanstack/react-query,
react-router 7, i18next, Zustand, Tailwind CSS.

- **Auth:** `keycloak.ts` + `AuthProvider` (keycloak-js `check-sso`, **PKCE**,
  silent token refresh), consumed via `useAuth()`. `api/client.ts` is an axios
  instance that attaches the Bearer token for authed calls and omits it for
  public booking pages.
- **Routing:** `/` renders the marketing `HomePage` for anonymous visitors and
  the calendar workspace (`AppShell`) for authenticated users; `/dashboard` is
  the management surface; `/:username/:eventSlug` is the public booking page;
  `/about`, `/privacy`, `/terms` are static. Reserved usernames are enforced
  server-side to avoid route collisions.
- **Calendar workspace (the differentiator):** Month / Week / Day / Year views +
  mini-calendar, with toggleable day-context layers — local holidays, global
  observances, Chinese lunar calendar, weather, daily fortune, week numbers,
  region + week-start selectors. Real `/me/bookings` overlay on the grid.
- **State:** two persisted Zustand stores (`calendarStore`, `themeStore`);
  `cursor` is a timestamp; `view`/`panelOpen` are intentionally not persisted.
- **i18n:** 8 locales (en, zh, ja, ko, de, es, it, fr) at full key parity.
- **Avatars:** native archetype/portrait sets plus client-side image upload with
  cropping to a ~16 KB base64 JPEG (ported from flowdesk).
- **Performance:** route-level code-splitting via `lazy()` + `Suspense`; the
  marketing landing is eager for first paint.
- **Build/typecheck gate:** `yarn build` = `tsc -b` then `vite build → dist/`.
  `@/` import alias via vite-tsconfig-paths.

---

## 4. Design system — Metro UI

- **Radius = xs (2px) everywhere.** The Tailwind box-radius scale
  (`rounded`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`) is remapped to 2px in
  `tailwind.config.js`; only `rounded-full` (avatars, dots, date cells) and
  `none` keep their defaults, so circles are preserved and the rule is
  self-enforcing. CSS tokens (`--r-*`) collapse to `--r-xs`.
- **Defined borders** on interactive elements (`--border-strong`) so controls
  read as elements.
- **No emoji-as-icons** — emoji render in their own color and vanish on colored
  backgrounds; UI icons use `react-icons` (currentColor-inheriting).
- Dark-first, brand indigo (`#6366f1`) + accent blue; fully responsive; light/dark
  theme toggle persisted.

---

## 5. Delivery / DevOps

- **`bin/release.sh -m "…"`** — stage/commit on `dev`, squash-merge to `main`,
  tag `vX.Y.Z.N`, push.
- **`bin/deploy.sh <full|frontend|backend|scheduler> [--migrate]`** — run on the
  whereq server; rebuilds the targeted service, applies Alembic migrations with
  `--migrate`, reloads nginx on api recreate. Guarded by the `name: chroniq`
  compose project so a deploy never affects sibling apps.
- **SEO/compliance:** `robots.txt`, `sitemap.xml`, canonical + OpenGraph/Twitter
  meta, a `noscript` block, and the Google API Services User Data Policy
  (Limited Use) disclosure on the Privacy/About pages.

---

## 6. Known limitations / next

- **Google event-write** and **Microsoft calendar** are staged (free/busy only
  today).
- **Team tier** is numerically equal to Pro; team-specific features (round-robin,
  collective events, shared availability, admin roles) are the next milestone.
- Billing currently shares the flowdesk.top Stripe account (single entity);
  a dedicated chroniq Stripe account can be split out later without code changes
  (swap the four `sk_live_/whsec_/price_` env values).
