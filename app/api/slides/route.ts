import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.from("slides").insert(body).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ slide: data })
}
