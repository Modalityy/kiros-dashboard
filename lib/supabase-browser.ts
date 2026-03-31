import { createClient } from '@supabase/supabase-js'

// Browser-safe client using the anon key — safe to expose to the client.
// Used exclusively for Realtime subscriptions; all data mutations go through
// API routes that use the server-side service role client.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: { params: { eventsPerSecond: 5 } },
  }
)
