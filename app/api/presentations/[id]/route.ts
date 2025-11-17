import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = getServerSupabase()

  const { data: presentation, error } = await supabase
    .from('presentations')
    .select('*, slides(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!presentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  return NextResponse.json(presentation)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const payload = await req.json()
  const supabase = getServerSupabase()

  const { data: updatedPresentation, error } = await supabase
    .from('presentations')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updatedPresentation) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  return NextResponse.json(updatedPresentation)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = getServerSupabase()

  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting presentation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Presentation deleted successfully' })
}
