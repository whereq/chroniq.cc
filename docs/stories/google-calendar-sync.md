# Storybook — "Never double-booked": chroniq.cc × Google Calendar

> A storyboard for a demo video / slide deck of chroniq's Google Calendar sync.
> Narrative-first; each scene has **what's on screen**, **voiceover**, and an
> **on-screen caption**. Timings are suggestions (~2.5 min total). The technical
> ground truth is in `docs/EVOLUTION.md` and the code
> (`api/services/calendar_providers.py`, `api/routes/public_booking.py`).

## Logline
Dana shares one link. Anyone can book her — and she's never double-booked,
because chroniq reads her real Google Calendar and writes every booking back to
it, automatically.

## Cast
- **Dana** — freelance UX consultant, the chroniq host.
- **Sam** — a prospect who wants 30 minutes with Dana (the invitee).
- **chroniq** — the scheduling app. **Google Calendar** — Dana's source of truth.

## The core idea to land (say it once, clearly)
> "Signing in tells chroniq *who Dana is*. Connecting Google separately gives
> chroniq permission to *see when she's busy* and *put meetings on her
> calendar* — so her booking page always reflects real life."

---

## Scene 1 — The problem (0:00–0:15)
- **On screen:** split view — a messy inbox of "are you free Tuesday?" emails on
  the left; a personal Google Calendar with a dentist appointment on the right.
- **Voiceover:** "Booking a meeting usually means a dozen emails — and the risk
  of double-booking over something already on your calendar."
- **Caption:** *The back-and-forth. The double-books. There's a better way.*

## Scene 2 — Dana's booking page (0:15–0:30)
- **On screen:** `chroniq.cc/dana` → her "30-min intro call" page, clean month
  grid, holidays subtly marked.
- **Voiceover:** "Dana has one link. But first, let's connect it to her real
  calendar."
- **Caption:** *One link: chroniq.cc/dana*

## Scene 3 — Connect Google (the key moment) (0:30–1:00)
- **On screen:** Manage → **Integrations** → click **Connect Google** →
  Google's account chooser → consent screen ("See and edit your calendars") →
  **Allow** → back on chroniq showing **Connected ✓**.
- **Voiceover:** "In two clicks, Dana grants chroniq permission to her calendar.
  chroniq stores that permission securely — encrypted — and can now work with
  her calendar even when she's offline."
- **Caption:** *Connect once. Encrypted & revocable anytime.*
- **Optional callout (for the technical slide):** a tiny diagram —
  `chroniq → Google: "may I access the calendar?" → Dana: Allow → chroniq gets an
  offline token (encrypted)`. Login ≠ calendar access; they're separate grants.

## Scene 4 — Busy times disappear (the "aha") (1:00–1:35)
- **On screen:** Dana adds a "Dentist 2–3 PM" event **directly in Google
  Calendar**. Cut to Sam opening `chroniq.cc/dana/30-min-intro`, picking that
  day — the **2:00 and 2:30 slots are simply not there**.
- **Voiceover:** "Sam only ever sees times Dana is genuinely free. chroniq checks
  Google's free/busy in real time and hides anything that clashes — even events
  chroniq never created."
- **Caption:** *Real-time free/busy. No clashes. (chroniq sees "busy 2–3", never
  "Dentist" — privacy kept.)*

## Scene 5 — The booking, both ways (1:35–2:05)
- **On screen:** Sam picks **11:00 AM**, enters name/email, confirms → success
  screen. Cut to Dana's **Google Calendar**: the "Sam — 30-min intro" event has
  appeared, Sam listed as a guest. Cut to Sam's inbox: a confirmation email with
  a calendar invite (.ics).
- **Voiceover:** "When Sam books, the meeting lands on Dana's Google Calendar
  automatically, with Sam as a guest — and Sam gets a confirmation and a calendar
  invite. Reschedule or cancel later, and Dana's calendar updates to match."
- **Caption:** *Booked → written to your calendar → everyone notified.*

## Scene 6 — Why it's calm (2:05–2:25)
- **On screen:** the chroniq calendar workspace showing the new booking alongside
  holidays; the Integrations tab showing "Google — Connected".
- **Voiceover:** "One link, one source of truth. chroniq respects the calendar
  Dana already lives in — so scheduling just works."
- **Caption:** *chroniq.cc — scheduling that respects your calendar.*

---

## Key messages (for slides / description copy)
1. **Two separate permissions:** login proves identity; Connect Google grants
   calendar access. You can disconnect anytime.
2. **Reads free/busy:** only busy *time ranges*, never event details — privacy by
   design.
3. **Writes bookings back:** new bookings appear on your calendar; reschedule/
   cancel stay in sync.
4. **Works in the background:** an offline token (refreshed automatically) lets
   chroniq keep your slots accurate and send reminders without you re-authorizing.
5. **Secure:** tokens are encrypted at rest; revoke in chroniq or in your Google
   account at any time.

## Shot list / assets to capture
- A clean host account (`dana`) with 1 event type + Mon–Fri availability.
- A Google Calendar with one obvious daytime event to demo the free/busy drop.
- Screen recording of: Integrations → Connect Google → consent → Connected.
- The invitee flow in a **private window** (so it's clearly the public page).
- Split-screen of Google Calendar updating after the booking.

## Honest disclaimer to include if shown publicly
While the integration is in Google's **Testing** mode it shows an "unverified
app" screen and connections expire after ~7 days. For the polished demo, either
use a test account, or record after the app is **verified/published** (see the
go-live checklist). Don't imply "production-ready" until verification is done.
