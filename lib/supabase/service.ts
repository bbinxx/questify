
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export const createServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Using anon key - some operations may fail due to RLS.')
        return createClient<Database>(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
