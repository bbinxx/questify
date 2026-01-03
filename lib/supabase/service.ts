
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export const createServiceRoleClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
        const error = new Error('NEXT_PUBLIC_SUPABASE_URL is missing in environment variables')
        console.error('[SUPABASE] CRITICAL ERROR:', error.message)
        throw error
    }

    if (!supabaseServiceKey) {
        console.warn('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY is missing. Using anon key - some operations may fail due to RLS.')

        if (!supabaseAnonKey) {
            const error = new Error('Both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing')
            console.error('[SUPABASE] CRITICAL ERROR:', error.message)
            throw error
        }

        return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
