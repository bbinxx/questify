import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET() {
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.from("presentations").select("*").order("created_at", { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ presentations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase()
  const title = "New Presentation"
  const code = generateCode()
  const { data, error } = await supabase
    .from("presentations")
    .insert({ title, code, is_active: false, current_slide: 0, show_results: false })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ presentation: data })
}
