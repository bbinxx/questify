"use client"

import { useEffect } from "react"
import { getBrowserSupabase } from "@/lib/supabase/client"

type UseRealtimeOpts = {
  presentationId: string
  slideId?: string
  onPresentationUpdate?: (payload: any) => void
  onResponse?: (payload: any) => void
  onSlideChange?: (payload: any) => void
  onControl?: (payload: any) => void
}

export function usePresentationRealtime({
  presentationId,
  slideId,
  onPresentationUpdate,
  onResponse,
  onSlideChange,
  onControl,
}: UseRealtimeOpts) {
  useEffect(() => {
    if (!presentationId) return
    const supabase = getBrowserSupabase()

    const dbChannel = supabase
      .channel(`realtime:presentations:${presentationId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "presentations", filter: `id=eq.${presentationId}` },
        (payload) => {
          onPresentationUpdate?.(payload)
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses", filter: `presentation_id=eq.${presentationId}` },
        (payload) => {
          if (!slideId || payload.new.slide_id === slideId) onResponse?.(payload)
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "slides" }, (payload) => {
        if ((payload.new as any).presentation_id === presentationId) onSlideChange?.(payload)
      })
      .subscribe()

    const controlChannel = supabase
      .channel(`control:presentations:${presentationId}`, { config: { broadcast: { ack: true } } })
      .on("broadcast", { event: "control" }, (payload) => {
        onControl?.(payload) || onPresentationUpdate?.(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(dbChannel)
      supabase.removeChannel(controlChannel)
    }
  }, [presentationId, slideId, onPresentationUpdate, onResponse, onSlideChange, onControl])
}
