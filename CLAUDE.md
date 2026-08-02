# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

chroniq.cc is a scheduling / booking platform (Calendly-style) built on the
shared "whereq" stack. It is a **monorepo**: a FastAPI backend + a React/Vite
frontend, deployed via Docker against the shared `whereq-db` PostgreSQL and a
Keycloak realm hosted at keytomarvel.com. The full product plan lives in
`docs/ROADMAP.md`.

## Layout

```
backend/    FastAPI + SQLAlchemy(async) + Alembic + Keycloak JWT   (see backend/README.md)
frontend/   React 19 + Vite + keycloak-js + axios + react-query + i18n
docker/     Dockerfiles + docker-compose.{dev,yml} (references external whereq-network/whereq-db)
bin/        release.sh, dev.sh, deploy.sh
docs/       ROADMAP.md (product plan)
```

## Commands

Frontend (`cd frontend`):
```bash
yarn dev        # Vite dev server (proxies /api → localhost:8000)
yarn build      # tsc -b then vite build → dist/    (primary typecheck gate)
yarn lint       # ESLint
```

Backend (`cd backend`, in a venv with requirements installed):
```bash
uvicorn api.main:app --reload   # http://localhost:8000/docs
alembic upgrade head            # apply migrations
pytest -q                       # slot engine + /health smoke test (no DB needed)
```

Full stack via Docker (needs shared whereq-db running on whereq-network):
```bash
bin/dev.sh                                          # creates chroniq DB + starts dev stack
docker compose -f docker/docker-compose.dev.yml up -d --build
```

Release/deploy: `bin/release.sh -m "..."` (dev→main squash+tag), `bin/deploy.sh` (on prod Pi).

## Backend architecture

- **Auth**: `chroniq/auth.py` verifies Keycloak RS256 JWTs via cached JWKS + `azp`
  check. Use the `CurrentUser` (claims dict) or `CurrentUserId` (Keycloak `sub`
  UUID) dependencies. User identity = `keycloak_id` on every user-owned table.
  Realm `chroniq.cc`; roles `ch-admin`, `ch-tier-*`.
- **Routes** (`api/routes/`, all under `/api/v1`): `me_*` require auth;
  `public_booking` is anonymous (the invitee flow). `status` is unauthenticated.
- **Core logic**: `api/services/slot_engine.py` computes bookable slots
  (availability ∩ duration − existing bookings − external busy − notice/window).
  This is the heart of the product and is unit-tested without a DB.
- **Data model** (`chroniq/models/`): `user_profiles`, `event_types`,
  `availability_schedules`/`_rules`/`_overrides`, `bookings`,
  `calendar_connections`, `notification_log`. Times stored UTC; a GiST exclusion
  constraint (migration 0001, needs `btree_gist`) blocks overlapping confirmed
  bookings per host.
- **Integrations** are staged: Google/Microsoft `free_busy`+event write
  (`calendar_providers.py`), Stripe→role (`payments.py` + `keycloak_admin.py`),
  and email (`mailer.py`) are wired as interfaces. **Email runs in log-only mode
  until `SMTP_HOST` is set** — the booking flow completes regardless.

## Frontend architecture

- **Auth**: `src/auth/keycloak.ts` + `AuthProvider.tsx` (keycloak-js, `check-sso`,
  PKCE, silent token refresh). Consume via `useAuth()`. `src/api/client.ts` is an
  axios instance that attaches the Bearer token for authenticated calls and skips
  it for public booking pages.
- **Routing** (`App.tsx`): `/` shows the marketing `HomePage` for anonymous
  visitors and the calendar workspace (`AppShell`) for authenticated users;
  `/app` is the authed workspace; `/:username/:eventSlug` is the public booking
  page. Reserved usernames are enforced backend-side to avoid route collisions.
- **Retained asset**: the calendar workspace (Month/Week/Day/Year + Panel with
  holidays/lunar/weather/fortune) is a differentiator; keep it. It will overlay
  real bookings from `/me/bookings`.
- **State**: two persisted Zustand stores (`calendarStore`, `themeStore`).
  `cursor` is a timestamp; `view`/`panelOpen` are intentionally not persisted.
- **i18n**: 8 locales; adding one requires editing `main.tsx` (import +
  `resources` + `supported`). Note DE/ES/IT/JA/KO are missing ~12 keys (fall back
  to English) — completing them is a roadmap item.

## Conventions

- Use the `@/` import alias for `frontend/src` (provided by vite-tsconfig-paths).
- The shared PostgreSQL container is `whereq-db` on the external `whereq-network`;
  chroniq owns the `chroniq` database within it and never manages Postgres itself.
- Never push directly to `main`; work on `dev` and release via PR / `bin/release.sh`.
