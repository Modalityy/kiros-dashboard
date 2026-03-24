# Kiros Dashboard

Next.js 14 dashboard for managing Eh-va, Daniel Wong's AI voice assistant. Replaces Make.com as the middleware layer — VAPI calls this app directly for assistant configuration, tool execution, and call logging.

---

## Architecture

```
Inbound Call → VAPI
               ↓
    POST /api/vapi/webhook   ← assistant-request / end-of-call-report
               ↓
    Supabase (clients, calls, bookings)
               ↓
    Google Sheets sync (mirror of existing sheet)
               ↓
    POST /api/vapi/tools     ← book_appointment / reschedule / cancel / update
               ↓
    Resend email → client + BCC Daniel
```

---

## Features

- **VAPI Webhook** — returns dynamic assistant config per caller (returning vs new)
- **Tool Handler** — executes booking, reschedule, cancel, and objective update tools
- **Supabase** — primary DB: clients, calls, bookings tables
- **Google Sheets Sync** — dual-writes to existing sheet so Daniel's workflow is uninterrupted
- **Dashboard** — call logs table (matching the Google Sheets layout), client management, bookings view
- **Google OAuth** — single-user login (your email only)
- **Resend Emails** — booking confirmations to clients + BCC to Daniel

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

### 3. Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and service role key into `.env.local`

### 4. Google OAuth (for dashboard login)

1. Go to https://console.cloud.google.com → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorised redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Copy Client ID and Client Secret into `.env.local`

### 5. Google Sheets Service Account

1. Go to **IAM & Admin → Service Accounts** → Create service account
2. Create a JSON key and download it
3. Share your Google Sheet with the service account email (Editor access)
4. Put the service account email and private key into `.env.local`
5. Set `GOOGLE_SHEETS_ID` to the ID from your sheet URL:
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 6. Resend

1. Sign up at https://resend.com
2. Verify your sending domain
3. Create an API key and set `RESEND_API_KEY`

### 7. Deploy to Vercel

```bash
vercel --prod
```

Add all `.env.local` values as Vercel environment variables.

---

## VAPI Configuration

Once deployed, update your VAPI phone number's **Server URL** to:

```
https://your-app.vercel.app/api/vapi/webhook
```

This replaces the Make.com webhook URL. The `assistant-request` webhook will now hit this endpoint and receive a dynamic assistant config back.

For tool calls, the tools in your VAPI assistant config should point to:

```
https://your-app.vercel.app/api/vapi/tools
```

(This is already configured inside `lib/vapi-config.ts` via the `NEXT_PUBLIC_BASE_URL` env var.)

---

## System Prompt Dates Endpoint

The dynamic dates list (replacing `kiros-vapi-functions.vercel.app/api/system-prompt`) is now served from:

```
GET https://your-app.vercel.app/api/vapi/system-prompt
```

---

## Dashboard Routes

| Route | Description |
|---|---|
| `/` | Redirects to `/dashboard` or `/login` |
| `/login` | Google OAuth login page |
| `/dashboard` | Overview stats + upcoming bookings |
| `/dashboard/calls` | Full call logs table (mirrors Google Sheets) |
| `/dashboard/clients` | Client management |
| `/dashboard/bookings` | Upcoming and past bookings |

---

## Project Structure

```
kiros-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── vapi/
│   │       ├── webhook/route.ts       ← assistant-request + end-of-call-report
│   │       ├── tools/route.ts         ← book/reschedule/cancel/update tools
│   │       └── system-prompt/route.ts ← dynamic dates list
│   ├── dashboard/
│   │   ├── layout.tsx                 ← sidebar nav
│   │   ├── page.tsx                   ← overview
│   │   ├── calls/page.tsx             ← call logs table
│   │   ├── clients/page.tsx           ← client management
│   │   └── bookings/page.tsx          ← bookings view
│   ├── login/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── CallsTable.tsx
│   ├── ClientsTable.tsx
│   └── SignOutButton.tsx
├── lib/
│   ├── supabase.ts                    ← DB helpers
│   ├── sheets.ts                      ← Google Sheets sync
│   ├── vapi-config.ts                 ← assistant configs (replaces Make.com JSON)
│   ├── email.ts                       ← Resend confirmation emails
│   └── auth.ts                        ← NextAuth config
├── supabase/
│   └── schema.sql
├── middleware.ts                      ← auth guard on /dashboard
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```
