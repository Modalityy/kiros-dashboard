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
    vapiWebhookUrl: base ? `${base}/api/vapi/webhook` : null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null, // public, safe to expose
    supabaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    googleOAuthSet: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    allowedEmail: process.env.ALLOWED_EMAIL ?? null,
    callbackUrl: base ? `${base}/api/auth/callback/google` : null,
    sheetsIdSet: !!process.env.GOOGLE_SHEETS_ID,
    serviceAccountSet: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  })
}
