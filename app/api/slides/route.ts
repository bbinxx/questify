import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = getServerSupabase()

  const { question, type, options, settings, presentation_id, order } = body

  if (!question || !type || !presentation_id || order === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: newSlide, error } = await supabase
    .from('slides')
    .insert({
      question,
      type,
      options,
      settings,
      presentation_id,
      order,
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting slide:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(newSlide)
}