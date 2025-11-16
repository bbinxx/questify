import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET() {
  const supabase = getServerSupabase()
  const { data: presentations, error } = await supabase
    .from('presentations')
    .select('*, slides(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching presentations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(presentations)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = generateCode()
  const { data: newPresentation, error } = await supabase
    .from('presentations')
    .insert({
      title: 'New Presentation',
      code: code,
      user_id: user.id,
      is_active: false,
      current_slide_index: 0,
      show_results: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newPresentation)
}