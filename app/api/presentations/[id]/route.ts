import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = getServerSupabase()

  // Use simple query as it's public read
  const { data, error } = await supabase
    .from('presentations')
    .select('*, slides(*)')
    .eq('id', id)
    .limit(1)

  if (error) {
    console.error('Error fetching presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const presentation = data?.[0]

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  return NextResponse.json(presentation)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const payload = await req.json()
  const supabase = getServerSupabase()

  // 1. Verify User
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.warn("Unauthorized update attempt:", authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Use regular authenticated client (relies on RLS)
  const { data, error } = await supabase
    .from('presentations')
    .update(payload)
    .eq('id', id)
    // Enforce ownership manually as double-check, though RLS should handle it
    .eq('user_id', user.id)
    .select()

  if (error) {
    console.error('Error updating presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const updatedPresentation = data && data.length > 0 ? data[0] : null

  if (!updatedPresentation) {
    // If no data returned, it means either ID didn't exist OR user_id didn't match (or RLS blocked it)
    return NextResponse.json({ error: 'Presentation not found or access denied' }, { status: 404 })
  }

  return NextResponse.json(updatedPresentation)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = getServerSupabase()

  // 1. Verify User
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Use regular authenticated client
  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Presentation deleted successfully' })
}
