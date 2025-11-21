import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const payload = await req.json()
  const supabase = getServerSupabase()

  const { data: updatedSlide, error } = await supabase
    .from('slides')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating slide:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!updatedSlide) {
    return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
  }

  return NextResponse.json(updatedSlide)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = getServerSupabase()

  const { error } = await supabase
    .from('slides')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting slide:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Slide deleted successfully' })
}