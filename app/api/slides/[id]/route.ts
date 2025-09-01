import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.from("slides").update(body).eq("id", params.id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ slide: data })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getServerSupabase()
  const { error } = await supabase.from("slides").delete().eq("id", params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
