# BarangayConnect Hotline

**Barangay Automated Hotline and Emergency Assistance System**

A single telephone hotline for a Philippine barangay where residents use an automated voice menu (IVR) to report emergencies, request services, report community problems, listen to announcements, and connect directly to an available barangay official.

This is a **school / academic prototype**. The current focus is a fully working **web phone simulator** driven by a shared IVR engine — the same engine that will later connect to a real telephony provider.

---

## Features

- **Web phone simulator** — looks like an actual phone; dial the hotline and navigate the IVR with the keypad.
- **Shared IVR state machine** — one pure engine powers the simulator, future telephony, and automated tests.
- **Emergency flow** — Medical / Fire / Flood & Disaster / Other, with priority CRITICAL and routing to officials.
- **Barangay services** — info & routing for clearances and certificates.
- **Community problem reports** — record a complaint, generate a report number.
- **Announcements** — active announcements are read by the IVR.
- **Speak to an official** — availability-based routing simulation, queue, and voice message simulation.
- **Official dashboard** — live calls, recent calls, officials, announcements, reports, and settings (progressively built). Dashboard stats read live from the database.
- **Log in with roles** — Captain, Secretary, Emergency Officer, and Staff accounts with demo session cookies and audit logs on sign-in/out.
- **Local database** (SQLite via Prisma) — schema ready to move to Supabase/PostgreSQL later.
- **Seeded demo data** — officials, announcements, escalation rules, sample calls & reports.

---

## Architecture

```text
RESIDENT → PHONE CALL → TELEPHONY PROVIDER (future)
                                │
                                ▼
                          IVR BACKEND
                                │
                       (shared state machine)
                                │
        ┌──────────────┬────────┴─────────┬──────────────┐
        ▼              ▼                  ▼              ▼
   Emergency       Services          Complaints    Announcements
        │              │                  │
        └──────────────┴──────┬───────────┘
                              ▼
                       CALL ROUTING
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        Available Official          Voice Message
                 │                         │
                 ▼                         ▼
         (transfer later)              DATABASE
                                            │
                                            ▼
                                   ADMIN DASHBOARD
```

**IVR engine** (`src/lib/ivr/`) is a pure, data-driven state machine. It has no UI or telephony dependencies, so the web simulator, a future Twilio/SIP adapter, and tests all consume the same logic.

**Planned phases** (in development order):

1. ~~Project setup & architecture~~ ✅
2. ~~Database schema & seed data~~ ✅
3. ~~Authentication & roles~~ ✅ (demo sessions)
4. IVR engine wiring & call records
5. ~~Phone simulator~~ ✅ (voice + keypad + live-call Twilio adapter)
6. Call management: queue, availability, routing, escalation
7. Voice recording simulation & storage
8. Admin dashboard modules
9. Security hardening: RLS, validation, audit logs
10. ~~Real telephony provider integration~~ ✅ (Twilio adapter + Filipino voice TTS)

---

## Tech Stack

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js (App Router)                              |
| Frontend     | React, TypeScript, Tailwind CSS v4                |
| Database     | Prisma ORM + SQLite (local) → Supabase/PostgreSQL later |
| Auth         | Demo session (local) → Supabase Auth later        |
| Telephony    | Twilio (live phone) + browser speechSynthesis (simulator voice) |
| Storage      | Local filesystem → Supabase Storage later         |
| Icons        | lucide-react                                      |

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20+ recommended)

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

For local development you only need `DATABASE_URL` (already set in the example). Supabase and telephony values are placeholders for later phases. `AUTH_SECRET` signs the demo session cookies — the `.env` dev fallback works out of the box, but generate a real one for any deployed environment:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Set up the database + seed

```bash
npm run db:migrate
npm run db:seed
```

> `db:migrate` runs `prisma migrate dev`. If your environment is non-interactive, use `npx prisma db push` to sync the schema instead.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the dashboard, which requires sign-in.

**Demo accounts** (password: `password123`):

| Role | Email |
| --- | --- |
| Captain | captain@brgyconnect.ph |
| Secretary | secretary@brgyconnect.ph |
| Emergency Officer | emergency@brgyconnect.ph |
| Staff | staff@brgyconnect.ph |

The login page has quick-fill buttons for these accounts. After signing in you can reach the **Phone Simulator** to place a simulated call.

### Optional: view the database

```bash
npm run db:studio
```

---

## Project Structure

```text
prisma/
  schema.prisma          # all tables: users, officials, calls, queues, reports...
  seed.ts                # demo data
src/
  app/
    (auth)/login/        # sign-in page
    (dashboard)/         # dashboard layout (sidebar) + pages
      dashboard/         # overview with live stats
      simulator/         # phone simulator
      calls/ officials/  # upcoming modules
      announcements/ reports/ settings/
    api/
      auth/              # login, logout, me (session)
      calls/             # start a call
      calls/[id]/        # update a call
  components/
    auth/                # LoginForm
    phone/               # PhoneSimulator, PhoneKeypad
    ui/                  # Button, Card, Badge, Sidebar, TopBar...
  lib/
    auth/                # password hashing, HMAC session, role guards
    ivr/                 # state machine + menus  ← shared engine
    prisma.ts            # Prisma client
    utils.ts
  services/
    audit.ts             # audit-log writer (spec §34)
    stats.ts             # dashboard aggregates
  types/                 # IVR & domain types
```

---

## Environment Variables

See `.env.example`. Key notes:

- Only variables prefixed `NEXT_PUBLIC_` reach the browser.
- `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and telephony secrets are **server-only**.
- Never commit real credentials.

---

## Testing

Tests are planned for the IVR state machine, call routing, and security (see phases above). The pure `stepIvr` function makes this straightforward once a test runner is added.

---

## Deployment

- **Frontend:** Vercel (or any Node host for the Next.js app).
- **Database:** Supabase PostgreSQL (migration path from SQLite via Prisma).
- **Auth:** Supabase Auth.
- **Telephony:** connect a provider adapter in Phase 10; no phone minutes are needed for the demo.

---

## Safety & Scope Notes

- This prototype is a **barangay-level communication and assistance system**, not a replacement for Philippine 911, police/fire dispatch, or ambulance services.
- For life-threatening emergencies the IVR directs callers to the national emergency hotline (911) as well.
- Simulated calls are clearly labeled **DEMO**; the system does not pretend simulated calls are real telephone calls.
- Out of scope: resident management, payroll, accounting, full document management, voting, and government dispatch integrations.

---

## License

Academic / prototyping use only.