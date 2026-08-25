import { createClient } from "@supabase/supabase-js";

// Server-only admin client for machine-to-machine writes (webhooks, background
// jobs) where there's no user session/cookies to work with. Never import this
// from a client component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
}
