import type { NextRequest } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await getServerSupabase()

  let insertData: any = {
    presentation_id: body.presentation_id,
    slide_id: body.slide_id,
  };

  if (body.option_index !== undefined) {
    insertData.option_index = body.option_index;
  } else if (body.text !== undefined) {
    insertData.text_response = body.text;
  } else if (body.words !== undefined) {
    insertData.word_cloud_response = body.words;
  } else if (body.guess !== undefined) {
    insertData.guess_response = body.guess;
  } else {
    return Response.json({ error: "Invalid response payload" }, { status: 400 });
  }

  const { error } = await supabase.from("responses").insert(insertData)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const presentation_id = searchParams.get("presentation_id")
  const slide_id = searchParams.get("slide_id")
  const options = Number(searchParams.get("options") || "0")
  const type = searchParams.get("type")

  const supabase = await getServerSupabase()

  let query = supabase
    .from("responses")
    .select("*")
    .eq("presentation_id", presentation_id)
    .eq("slide_id", slide_id)

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (type === 'word_cloud') {
    const wordCounts: { [key: string]: number } = {};
    data?.forEach((r: any) => {
      if (r.word_cloud_response) {
        const words = r.word_cloud_response.split(' ').filter(Boolean);
        words.forEach((word: string) => {
          const lowerCaseWord = word.toLowerCase();
          wordCounts[lowerCaseWord] = (wordCounts[lowerCaseWord] || 0) + 1;
        });
      }
    });
    const cloud = Object.entries(wordCounts).map(([text, value]) => ({ text, value }));
    return Response.json({ cloud });
  } else {
    const counts = Array(options).fill(0)
    for (const r of data ?? []) {
      if (r.option_index !== null) {
        counts[r.option_index] = (counts[r.option_index] || 0) + 1
      }
    }
    return Response.json({ counts })
  }
}