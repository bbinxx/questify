import { getServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const { code } = params
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from('presentations')
    .select('*, slides(*)')
    .eq('code', code)
    .limit(1)

  if (error) {
    console.error('Error fetching presentation by code:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const presentationData: any = data?.[0]

  if (!presentationData) {
    return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  }

  // Separate slides from presentation
  const slides = presentationData.slides || []
  const presentation = { ...presentationData }
  delete presentation.slides

  return NextResponse.json({
    presentation,
    slides: slides.map((s: any, idx: number) => ({
      ...s,
      position: s.order ?? idx
    }))
  })
}
