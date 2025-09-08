import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  // TODO: Replace these with environment variables once the .env.local issue is resolved.
  return createBrowserClient(
    "https://your-project-id.supabase.co",
    "your-supabase-anon-key"
  )
}
