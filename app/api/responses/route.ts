import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = getServerSupabase()

  const { presentation_id, slide_id, response_data, user_name, session_id } = body

  if (!presentation_id || !slide_id || !response_data || !session_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('responses')
    .insert({
      presentation_id,
      slide_id,
      response_data,
      user_name,
      session_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting response:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const presentation_id = searchParams.get('presentation_id')
  const slide_id = searchParams.get('slide_id')

  if (!presentation_id || !slide_id) {
    return NextResponse.json({ error: 'Missing presentation_id or slide_id' }, { status: 400 })
  }

  const supabase = getServerSupabase()

  const { data: responses, error } = await supabase
    .from('responses')
    .select('*')
    .eq('presentation_id', presentation_id)
    .eq('slide_id', slide_id)

  if (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(responses)
}
