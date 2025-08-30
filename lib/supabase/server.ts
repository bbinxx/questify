import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

let serverClient: ReturnType<typeof createServerClient> | null = null

export function getServerSupabase() {
  if (serverClient) return serverClient
  const cookieStore = cookies()
  serverClient = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {}
      },
    },
  })
  return serverClient
}
