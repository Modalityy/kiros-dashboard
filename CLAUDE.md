Project: Kiros Dashboard — Next.js 14 app on Windows Desktop at C:\\Users\\mongo\\Desktop\\kiros-dashboard. Replaces Make.com as VAPI middleware. Stack: Next.js 14.2.35, Supabase, Google Sheets API, NextAuth v4 (Google OAuth), Resend email, VAPI webhooks.

What's fully built (31 files):

Backend API routes:



app/api/vapi/webhook/route.ts — handles assistant-request (returns dynamic assistant config) and end-of-call-report (saves transcript to Supabase + syncs to Sheets). Has x-vapi-secret header verification.

app/api/vapi/tools/route.ts — handles all tool calls: book\_appointment, reschedule\_appointment, cancel\_appointment, update\_client\_details. Upserts Supabase, syncs Sheets, sends Resend email.

app/api/vapi/system-prompt/route.ts — returns 60-day pre-calculated dates list (replaces kiros-vapi-functions.vercel.app)

app/api/auth/\[...nextauth]/route.ts — Google OAuth, whitelisted to gabbbb.ong@gmail.com only



Lib layer:



lib/supabase.ts — all DB helpers (getClientByPhone, upsertClient, createCall, updateCall, createBooking, getUpcomingBookings(limit))

lib/sheets.ts — Google Sheets sync via service account (appendClientToSheet, updateSheetRow, syncClientToSheet)

lib/vapi-config.ts — returningCallerConfig(client, dates) and newCallerConfig(dates) — full VAPI assistant JSON with ElevenLabs voice, Deepgram transcriber, GPT-4o-mini, tools array pointing to /api/vapi/tools

lib/auth.ts — NextAuth config

lib/email.ts — Resend booking/reschedule/cancellation emails formatted in SGT, BCC'd to Daniel



Dashboard UI:



app/login/page.tsx — Google Sign-In page

app/dashboard/layout.tsx — sidebar nav (Overview, Call Logs, Clients, Bookings)

app/dashboard/page.tsx — stats overview + upcoming bookings widget

app/dashboard/calls/page.tsx + components/CallsTable.tsx — full call log table matching Google Sheets layout (First Name, Last Name, Number, Type, DISC, Zoom Meeting, Email, Objectives 1-4, Duration, Success, Transcript modal, Date). Has search + click-to-expand transcript modal.

app/dashboard/clients/page.tsx + components/ClientsTable.tsx — client management table

app/dashboard/bookings/page.tsx — upcoming vs past/cancelled bookings

middleware.ts — protects all /dashboard/\* routes



Config: next.config.ts, tailwind.config.ts, tsconfig.json, postcss.config.js, .gitignore, .env.example, supabase/schema.sql, package.json

Supabase schema (3 tables): clients (id, phone\_number, first\_name, last\_name, email, disc\_profile, zoom\_meeting, objective\_1–4, sheets\_row, timestamps), calls (id, vapi\_call\_id, client\_id, phone\_number, caller\_type, started\_at, ended\_at, duration\_seconds, ended\_reason, transcript, summary, success\_eval), bookings (id, client\_id, booking\_type enum schedule/reschedule/cancel, scheduled\_at, email, status enum active/cancelled/completed)

Google Sheets column mapping: A=First Name, B=Last Name, C=Phone, D=DISC, E=Zoom Meeting, F=Email, G–J=Objectives 1–4, K=Transcript, L=End-Of-Call-Report

.env.example keys needed:

NEXT\_PUBLIC\_BASE\_URL

NEXTAUTH\_URL

NEXTAUTH\_SECRET

GOOGLE\_CLIENT\_ID

GOOGLE\_CLIENT\_SECRET

ALLOWED\_EMAIL

VAPI\_WEBHOOK\_SECRET

NEXT\_PUBLIC\_SUPABASE\_URL

SUPABASE\_SERVICE\_ROLE\_KEY

GOOGLE\_SHEETS\_ID

GOOGLE\_SERVICE\_ACCOUNT\_EMAIL

GOOGLE\_SERVICE\_ACCOUNT\_KEY

RESEND\_API\_KEY

FROM\_EMAIL

DANIEL\_EMAIL

Current state: All packages installed (npm install done). node\_modules present. .env.local not yet created — user needs to fill in values from .env.example, run Supabase schema SQL, then npm run dev. The app is not yet deployed to Vercel — VAPI still points to Make.com.

Remaining work: Nothing structurally missing. Next steps when user is ready: (1) fill .env.local, (2) run Supabase schema, (3) npm run dev to test locally, (4) deploy to Vercel, (5) update VAPI server URL from Make.com webhook to https://your-app.vercel.app/api/vapi/webhook.

