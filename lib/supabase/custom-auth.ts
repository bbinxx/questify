import { createClient } from '@supabase/supabase-js'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import type { Database } from '../types/database'

// Singleton instance for browser client
let browserClient: ReturnType<typeof createClient<Database, 'public'>> | null = null

// Custom client for client components (singleton pattern)
export const createBrowserClient = () => {
  if (browserClient) {
    return browserClient
  }

  browserClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'public' } }
  )

  return browserClient
}

// Custom client for server components/route handlers
// This is a simplified version. The original auth-helpers library handles
// cookie serialization/deserialization and refresh token logic more robustly.
// For a full replacement, more advanced cookie handling would be needed.
export const createServerClient = (cookies: ReadonlyRequestCookies) => {
  return createClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'public' },
      auth: {
        flowType: 'pkce',
      },
      global: {
        headers: {
          'Cookie': cookies.toString(),
        },
      },
    }
  )
}

// Service role client for admin operations (server-side only)
export const createServiceClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
