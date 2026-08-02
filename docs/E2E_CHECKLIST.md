# chroniq.cc — End-to-End Smoke-Test Checklist

Run this after the Keycloak realm is imported and credentials are configured, to
verify the whole stack works together. Ordered so each step builds on the last.

Legend: 🔧 setup · ✅ expected result · 💡 how to verify

---

## 0. Prerequisites

- [ ] Keycloak realm `chroniq.cc` imported; `chroniq-backend` secret regenerated → `KEYCLOAK_ADMIN_CLIENT_SECRET`. (`docs/KEYCLOAK_SETUP.md`)
- [ ] `k2m-theme-chroniq` deployed (or realm login theme temporarily `k2m-theme-vegeta`).
- [ ] `.env` filled from `.env.example` (DB creds, `PUBLIC_BASE_URL`, Keycloak, optionally SMTP / Google / Microsoft / Stripe / `TOKEN_ENCRYPTION_KEY`).
- [ ] Shared `whereq-db` running; `chroniq` database exists (`bin/dev.sh` creates it).
- [ ] Stack up: `bin/dev.sh` (or `docker compose -f docker/docker-compose.dev.yml up -d --build`).

💡 Smoke the services first:
```bash
curl -s localhost:8000/api/v1/health          # {"status":"ok",...}
curl -s localhost:8000/api/v1/ready            # {"status":"ready"}  (DB reachable)
open http://localhost:5173                      # marketing site loads
```

---

## 1. Auth

- [ ] Visit `/` anonymous → **marketing HomePage** renders.
- [ ] Click **Sign in** → redirected to Keycloak (`chroniq.cc` realm, chroniq theme).
- [ ] Register a new user, complete login → redirected back to `/`.
- [ ] ✅ Now `/` shows the **dashboard** (authenticated landing).
- [ ] Reload the page → still signed in (silent `check-sso`).
- [ ] Sign out → back to marketing site.

💡 Token check: DevTools → Network → any `/api/v1/me/*` call has `Authorization: Bearer …`; 401s disappear once signed in.

---

## 2. Profile / Settings

- [ ] Dashboard → **Settings**. A default profile exists (username seeded from your login).
- [ ] Change **username** to something clean (e.g. `alex`), set display name + timezone → **Save** → ✅ "Saved".
- [ ] Try a reserved username (e.g. `app`, `dashboard`) → ✅ save fails with the reserved/taken error.
- [ ] Note your booking link: `/{username}` (shown under the username field).

---

## 3. Event Types (+ entitlement limit)

- [ ] **Event Types** → **New event type**: title, slug `30-min`, 30 minutes, video → Save → ✅ appears in the list.
- [ ] Edit it (change duration) → ✅ persists. Toggle inactive → ✅ shows "inactive".
- [ ] Create a **second** event type on the free tier → ✅ blocked with a `402` upgrade message (free limit = 1 in `chroniq/entitlements.py`).

💡 `curl -s localhost:8000/api/v1/me/entitlements -H "Authorization: Bearer $TOKEN"` → tier `free`, `max_event_types: 1`, `event_types_used: 1`.

---

## 4. Availability

- [ ] **Availability**: confirm Mon–Fri 9–5 default; adjust a day's hours, set timezone → **Save availability** → ✅ "Saved".
- [ ] Reload → values persisted.

---

## 5. Public booking flow (the core path — works fully anonymous)

Open the booking link **in a private window** (as an invitee): `http://localhost:5173/{username}/30-min`

- [ ] ✅ Host name, event title, duration render.
- [ ] Pick an **enabled weekday** → time slots load (respecting availability + duration).
- [ ] Change the **timezone** selector → ✅ slot times shift accordingly.
- [ ] Pick a slot → **Next** → fill name + email → **Schedule meeting** → ✅ confirmation screen with date/time in the chosen tz.
- [ ] **Double-booking guard:** in the host dashboard the booking shows under **Bookings → Upcoming**; back as invitee, that exact slot is ✅ no longer offered.
- [ ] Past dates are disabled; a day with no availability shows "No available times".

💡 API spot-check:
```bash
curl -s "localhost:8000/api/v1/public/{username}"                                  # host + active event types
curl -s "localhost:8000/api/v1/public/{username}/30-min/slots?date=YYYY-MM-DD&tz=UTC"
```

---

## 6. Invitee self-service (from the confirmation email link)

The confirmation email (or log-only output) contains `/bookings/{cancel_token}`.

- [ ] Open it → ✅ booking details render with status **confirmed**.
- [ ] **Reschedule** → pick a new date/time → **Confirm new time** → ✅ status updates, new time shown.
- [ ] **Cancel meeting** → ✅ status becomes **cancelled**; the slot frees up again for booking.
- [ ] Host dashboard → **Bookings → Cancelled** shows it.

---

## 7. Notifications / email

Email is **log-only until `SMTP_HOST` is set** — that's expected.

- [ ] Log-only mode: after booking, `docker logs chroniq-api-dev` shows a `[mailer:log-only]` line with the invitee message + `.ics` note.
- [ ] With SMTP configured: invitee receives a **confirmation** email with a calendar `.ics` attachment; cancel/reschedule send their emails too.

---

## 8. Reminder scheduler

- [ ] `docker logs chroniq-scheduler-dev` shows "Scheduler starting (reminder scan every 5 min)" and runs a scan on boot.
- [ ] 💡 To trigger without waiting 24h: create a booking ~50 minutes out, wait for the next scan → ✅ a `reminder_1h` email/log appears **once** (re-scans don't resend — `notification_log` idempotency).

---

## 9. Calendar sync (needs Google/Microsoft OAuth credentials)

- [ ] Dashboard → **Integrations** → **Connect** Google → OAuth consent → redirected back; ✅ shows **Connected** (+ account email).
- [ ] Put a busy block on that external calendar → as invitee, ✅ overlapping slots disappear from availability (free/busy merge).
- [ ] Make a new booking → ✅ an event appears on the host's external calendar (invitee as attendee).
- [ ] Cancel that booking → ✅ the external event is removed.
- [ ] Repeat for **Microsoft** if configured. Disconnect → ✅ connection removed.

💡 If a provider errors, availability must still load (sync failures degrade gracefully, never block booking).

---

## 10. Payments → tier role → entitlement (needs Stripe test keys + price ids)

- [ ] Marketing **Pricing**: as anonymous, clicking a paid plan → prompts sign in.
- [ ] Signed in, click **Pro** → redirected to Stripe Checkout → pay with test card `4242 4242 4242 4242`.
- [ ] ✅ Stripe webhook assigns the `ch-tier-1` realm role (check the user in Keycloak → Role mapping).
- [ ] After the next token refresh (≤60s) / re-login → ✅ `/me/entitlements` shows tier `tier-1`; you can now create **more than one** event type.

💡 Locally, forward webhooks: `stripe listen --forward-to localhost:8000/api/v1/payments/webhook`.

---

## 11. Internationalization

- [ ] Header language selector → switch through all 8 (EN, 中, JP, KR, DE, ES, IT, FR).
- [ ] ✅ Marketing site, dashboard tabs/sections, booking page, and manage page are all translated (no raw English leaking) in every language.
- [ ] Reload → language persists (`localStorage: chroniq-cc-lang`).

---

## 12. Calendar workspace (retained differentiator)

- [ ] Signed in → dashboard sidebar → **Calendar** (`/app`) → Month/Week/Day/Year views render with holidays / lunar / weather / fortune panel toggles.

---

## 13. Production deploy (Raspberry Pi)

- [ ] `bin/deploy.sh` on the Pi: pulls `main`, ensures `chroniq` DB, rebuilds, runs `alembic upgrade head` on api start.
- [ ] `docker compose -f docker/docker-compose.yml ps` → api, scheduler, frontend all **up**.
- [ ] `https://chroniq.cc/api/v1/health` → ok; the site loads behind the real domain + Keycloak.

---

## Quick regression (run anytime)

```bash
# Backend
cd backend && . .venv/bin/activate && pytest -q          # slot engine, reminders, entitlements, parsers, health
# Frontend
cd frontend && yarn tsc -b && yarn build                 # typecheck + bundle
# i18n parity (all locales must match en)
python3 - <<'EOF'
import json, glob
def leaves(d,p=""):
    o=set()
    for k,v in d.items():
        q=f"{p}.{k}" if p else k
        o |= leaves(v,q) if isinstance(v,dict) else {q}
    return o
base=leaves(json.load(open('frontend/src/locales/en/translation.json')))
for f in glob.glob('frontend/src/locales/*/translation.json'):
    d=leaves(json.load(open(f)))
    assert d==base, (f, base-d, d-base)
print("i18n parity OK")
EOF
```
