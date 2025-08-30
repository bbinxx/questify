import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const supabase = getServerSupabase()
  const { data: presentation, error } = await supabase
    .from("presentations")
    .select("*")
    .eq("code", params.code)
    .single()
  if (error) return Response.json({ error: error.message }, { status: 404 })
  const { data: slides, error: e2 } = await supabase
    .from("slides")
    .select("*")
    .eq("presentation_id", presentation.id)
    .order("position", { ascending: true })
  if (e2) return Response.json({ error: e2.message }, { status: 500 })
  return Response.json({ presentation, slides })
}
