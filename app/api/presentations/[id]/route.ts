import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // Await params before using
  const supabase = await getServerSupabase()
  const { data: presentation, error } = await supabase.from("presentations").select("*").eq("id", id).single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const { data: slides, error: e2 } = await supabase
    .from("slides")
    .select("*")
    .eq("presentation_id", id)
    .order("position", { ascending: true })
  if (e2) return Response.json({ error: e2.message }, { status: 500 })
  return Response.json({ presentation, slides })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // Await params before using
  const payload = await req.json()
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.from("presentations").update(payload).eq("id", id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ presentation: data })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // Await params before using
  const supabase = await getServerSupabase()
  // Remove responses associated with this presentation (in case FK cascade isn't set)
  const { error: e1 } = await supabase.from("responses").delete().eq("presentation_id", id)
  if (e1) return Response.json({ error: e1.message }, { status: 500 })
  // Remove slides for this presentation
  const { error: e2 } = await supabase.from("slides").delete().eq("presentation_id", id)
  if (e2) return Response.json({ error: e2.message }, { status: 500 })
  // Remove the presentation itself
  const { error: e3 } = await supabase.from("presentations").delete().eq("id", id)
  if (e3) return Response.json({ error: e3.message }, { status: 500 })
  return Response.json({ ok: true })
}