# Kiros Dashboard

Next.js 16 dashboard for managing Eh-va, Daniel Wong's AI voice assistant. Replaces Make.com as the middleware layer — VAPI calls this app directly for assistant configuration, tool execution, and call logging.

---

## Architecture

```text
Inbound Call → VAPI
               ↓
    POST /api/vapi/webhook   ← assistant-request / end-of-call-report
               ↓
    Supabase (clients, calls, bookings, settings)
               ↓
    POST /api/vapi/tools     ← book / reschedule / cancel / update_client_details
               ↓
    Gmail (nodemailer) → confirmation email to client
```

---

## Features

### VAPI Integration

- **Webhook handler** — returns dynamic assistant config per caller (returning vs new)
- **Tool handler** — executes `book_appointment`, `reschedule_appointment`, `cancel_appointment`, `update_client_details`
- **System prompt dates** — serves 60-day pre-calculated SGT date list (replaces `kiros-vapi-functions.vercel.app`)
- **Cost sync** — backfills per-call costs from the VAPI API

### Dashboard

- **Overview** — total calls, clients, spend, credits remaining; upcoming bookings widget
- **Call Logs** — full call table with search, transcript modal, call notes, pagination, auto-refresh
- **Clients** — client management with inline editing, add/delete, DISC profile
- **Bookings** — list + calendar views; reschedule (datetime picker) and cancel actions
- **Client detail** — individual client page with call history
- **Assistant** — live-edit system prompts, first message, voice settings, LLM model
- **Integrations** — status dashboard for all connected services

### UX

- Collapsible sidebar (state persisted in localStorage)
- ⌘K command palette with fuzzy search + keyboard shortcuts (G+O/C/L/B/A/I)
- Skeleton loaders on all pages
- Real-time updates via Supabase Realtime (calls, clients, bookings)
- Toast notifications for all actions
- Mobile-responsive card view for call logs
- Empty state illustrations
- Error boundary with "Try again" fallback

### Automation

- **Gmail confirmations** — booking, reschedule, and cancellation emails (nodemailer + Gmail app password)
- **Booking reminders** — Vercel cron job at 09:00 SGT daily sends 24-hour reminder emails

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-repo/kiros-dashboard
cd kiros-dashboard
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | How to get it |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL (e.g. `https://kiros-ai.vercel.app`) |
| `NEXTAUTH_URL` | Same as above |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `ALLOWED_EMAIL` | Email address(es) allowed to log in, comma-separated |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (service_role) |
| `VAPI_WEBHOOK_SECRET` | VAPI dashboard → Phone number → Server URL → add secret header `x-vapi-secret` |
| `VAPI_PRIVATE_KEY` | VAPI dashboard → API Keys |
| `GMAIL_USER` | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | Google Account → Security → 2-Step Verification → App Passwords |
| `CRON_SECRET` | Run `openssl rand -hex 32` |

### 3. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Enable **Realtime** on the three tables — run in SQL Editor:

```sql
alter publication supabase_realtime add table clients, calls, bookings;
```

1. Add RLS policies so the anon key can subscribe:

```sql
create policy "Allow realtime reads" on clients for select using (true);
create policy "Allow realtime reads" on calls    for select using (true);
create policy "Allow realtime reads" on bookings for select using (true);
```

1. Add the `notes` column to the calls table if not already in the schema:

```sql
alter table calls add column if not exists notes text;
```

### 4. Google OAuth (dashboard login)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorised redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Copy Client ID and Secret into `.env.local`

### 5. Gmail (email confirmations)

1. Enable 2-Step Verification on the sending Gmail account
2. Go to **Google Account → Security → App Passwords**
3. Create an app password (app name: "Kiros Dashboard")
4. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local`

### 6. Run locally

```bash
npm run dev
```

### 7. Deploy to Vercel

```bash
vercel --prod
```

Add all `.env.local` values as Vercel environment variables. The `vercel.json` in this repo configures the daily cron job automatically.

---

## VAPI Configuration

Once deployed, set your VAPI phone number's **Server URL** to:

```text
https://your-app.vercel.app/api/vapi/webhook
```

Tools in your VAPI assistant config should point to:

```text
https://your-app.vercel.app/api/vapi/tools
```

This is already wired up inside `lib/vapi-config.ts` via `NEXT_PUBLIC_BASE_URL`.

The system prompt dates endpoint (replacing `kiros-vapi-functions.vercel.app`) is:

```text
GET https://your-app.vercel.app/api/vapi/system-prompt
```

---

## Dashboard Routes

| Route | Description |
| --- | --- |
| `/` | Redirects to `/dashboard` or `/login` |
| `/login` | Google OAuth login |
| `/dashboard` | Overview stats + upcoming bookings |
| `/dashboard/calls` | Call logs, transcript modal, call notes |
| `/dashboard/clients` | Client management table |
| `/dashboard/clients/[id]` | Individual client detail + call history |
| `/dashboard/bookings` | Upcoming/past bookings — list + calendar |
| `/dashboard/settings` | Assistant prompts, voice, LLM model |
| `/dashboard/integrations` | Service connection status |

---

## API Routes

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/vapi/webhook` | VAPI secret | `assistant-request` + `end-of-call-report` |
| POST | `/api/vapi/tools` | VAPI secret | Tool execution (book/reschedule/cancel/update) |
| GET | `/api/vapi/system-prompt` | None | 60-day SGT dates list |
| POST | `/api/vapi/sync-costs` | Session | Backfill call costs from VAPI |
| GET | `/api/calls` | Session | List calls (last 100) |
| PATCH | `/api/calls` | Session | Update call notes |
| GET | `/api/clients` | Session | List all clients |
| POST | `/api/clients` | Session | Create client |
| PATCH | `/api/clients/[id]` | Session | Update client fields |
| DELETE | `/api/clients/[id]` | Session | Delete client (cascades) |
| GET | `/api/bookings` | Session | List all bookings |
| PATCH | `/api/bookings/[id]` | Session | Update booking date |
| DELETE | `/api/bookings/[id]` | Session | Cancel booking |
| GET | `/api/dashboard-stats` | Session | Aggregated overview stats |
| GET | `/api/settings` | Session | All settings key-values |
| PUT | `/api/settings` | Session | Upsert a setting |
| GET | `/api/cron/reminders` | Cron secret | Send 24-hour reminder emails |
| POST | `/api/llm` | None | LLM proxy (VAPI custom LLM) |
| GET | `/api/openai/models` | Session | List available OpenAI models |
| GET | `/api/env-check` | Session | Env variable status flags |

---

## Project Structure

```text
kiros-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    ← Google OAuth
│   │   ├── vapi/
│   │   │   ├── webhook/route.ts           ← assistant-request + end-of-call-report
│   │   │   ├── tools/route.ts             ← book/reschedule/cancel/update tools
│   │   │   ├── system-prompt/route.ts     ← 60-day SGT dates
│   │   │   └── sync-costs/route.ts        ← backfill costs from VAPI API
│   │   ├── calls/route.ts                 ← GET + PATCH (notes)
│   │   ├── clients/
│   │   │   ├── route.ts                   ← GET + POST
│   │   │   └── [id]/route.ts              ← PATCH + DELETE
│   │   ├── bookings/
│   │   │   ├── route.ts                   ← GET
│   │   │   └── [id]/route.ts              ← PATCH + DELETE
│   │   ├── dashboard-stats/route.ts
│   │   ├── settings/route.ts
│   │   ├── llm/route.ts                   ← custom LLM proxy
│   │   ├── openai/models/route.ts
│   │   ├── env-check/route.ts
│   │   └── cron/reminders/route.ts        ← daily 24-hr reminder emails
│   ├── dashboard/
│   │   ├── layout.tsx                     ← sidebar, toast provider, error boundary
│   │   ├── page.tsx                       ← overview
│   │   ├── calls/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx              ← client detail
│   │   ├── bookings/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── settings/page.tsx
│   │   └── integrations/page.tsx
│   ├── login/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── icon.tsx
│   └── providers.tsx
├── components/
│   ├── CallsTable.tsx                     ← search, pagination, realtime, transcript modal
│   ├── ClientsTable.tsx                   ← inline editing, realtime
│   ├── BookingsTabs.tsx                   ← list + calendar, reschedule/cancel
│   ├── Sidebar.tsx                        ← collapsible, localStorage state
│   ├── NavLinks.tsx
│   ├── SignOutButton.tsx
│   ├── CommandPalette.tsx                 ← ⌘K palette + G+X shortcuts
│   ├── Toast.tsx                          ← toast context + provider
│   ├── ErrorBoundary.tsx                  ← class-based error boundary
│   ├── EmptyState.tsx                     ← SVG illustrations
│   └── NavigationProgress.tsx             ← page transition bar
├── hooks/
│   └── useRealtimeTable.ts                ← Supabase Realtime subscription
├── lib/
│   ├── supabase.ts                        ← server-side DB helpers
│   ├── supabase-browser.ts                ← browser client (anon key, realtime)
│   ├── vapi-config.ts                     ← dynamic assistant configs
│   ├── default-prompts.ts                 ← default system prompts
│   ├── email.ts                           ← nodemailer: confirmation + reminder emails
│   └── auth.ts                            ← NextAuth config
├── supabase/
│   └── schema.sql
├── middleware.ts                          ← auth guard on /dashboard/*
├── vercel.json                            ← cron job config
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Auth | NextAuth v4 (Google OAuth) |
| Email | Nodemailer + Gmail App Password |
| Voice AI | VAPI |
| Styling | Tailwind CSS |
| Deployment | Vercel |
