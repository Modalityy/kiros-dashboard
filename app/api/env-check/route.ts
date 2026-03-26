import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Returns booleans and non-secret public values — no raw secrets
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({}, { status: 401 })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return NextResponse.json({
    vapiSecretSet: !!process.env.VAPI_WEBHOOK_SECRET,
    vapiSecret: process.env.VAPI_WEBHOOK_SECRET ?? null,
    vapiWebhookUrl: base ? `${base}/api/vapi/webhook` : null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
    googleOAuthSet: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? null,
    allowedEmail: process.env.ALLOWED_EMAIL ?? null,
    callbackUrl: base ? `${base}/api/auth/callback/google` : null,
    sheetsIdSet: !!process.env.GOOGLE_SHEETS_ID,
    sheetsId: process.env.GOOGLE_SHEETS_ID ?? null,
    serviceAccountSet: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
  })
}
