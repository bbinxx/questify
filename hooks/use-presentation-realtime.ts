"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

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

    const supabase = createClient()

    // Subscribe to presentation updates
    const presentationChannel = supabase
      .channel(`presentation:${presentationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presentations',
          filter: `id=eq.${presentationId}`
        },
        (payload) => {
          console.log('Presentation updated:', payload)
          onPresentationUpdate?.(payload)
        }
      )
      .subscribe()

    // Subscribe to responses
    const responsesChannel = supabase
      .channel(`responses:${presentationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log('Response added:', payload)
          if (!slideId || payload.new.slide_id === slideId) {
            onResponse?.(payload)
          }
        }
      )
      .subscribe()

    // Subscribe to slide changes
    const slidesChannel = supabase
      .channel(`slides:${presentationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slides',
          filter: `presentation_id=eq.${presentationId}`
        },
        (payload) => {
          console.log('Slide changed:', payload)
          onSlideChange?.(payload)
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(presentationChannel)
      supabase.removeChannel(responsesChannel)
      supabase.removeChannel(slidesChannel)
    }
  }, [presentationId, slideId, onPresentationUpdate, onResponse, onSlideChange, onControl])
}
