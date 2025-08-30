import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = getServerSupabase()
  const { error } = await supabase.from("responses").insert({
    presentation_id: body.presentation_id,
    slide_id: body.slide_id,
    option_index: body.option_index,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const presentation_id = searchParams.get("presentation_id")
  const slide_id = searchParams.get("slide_id")
  const options = Number(searchParams.get("options") || "0")
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("responses")
    .select("option_index")
    .eq("presentation_id", presentation_id)
    .eq("slide_id", slide_id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const counts = Array(options).fill(0)
  for (const r of data ?? []) counts[(r as any).option_index] = (counts[(r as any).option_index] || 0) + 1
  return Response.json({ counts })
}
