import { createServerClient } from '@/lib/supabase/custom-auth'
import { cookies } from 'next/headers'

export const getServerSupabase = () => {
  cookies().getAll() // This is a workaround to make cookies readable in a server component
  return createServerClient(cookies)
}
