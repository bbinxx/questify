import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const { code } = params
  const supabase = getServerSupabase()

  const { data: presentation, error } = await supabase
    .from('presentations')
    .select('*, slides(*)')
    .eq('code', code)
    .single()

  if (error) {
    console.error('Error fetching presentation by code:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  return NextResponse.json(presentation)
}
