"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminPresentationView } from '@/components/presentations/admin-presentation-view'
import { Presentation } from '@/app/page'

export default function AdminEditorPage() {
  const params = useParams<{ id: string }>()
  const presentationId = params.id
  const router = useRouter()
  const supabase = createClient()

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPresentation = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('presentations')
        .select('*, slides(*)')
        .eq('id', presentationId)
        .single()

      if (error) {
        console.error('Error fetching presentation:', error)
        setError(error.message)
      } else if (data) {
        setPresentation({
          ...data,
          slides: data.slides || [],
          current_slide_index: data.current_slide_index || 0,
        } as Presentation)
      }
      setLoading(false)
    }

    if (presentationId) {
      fetchPresentation()
    }
  }, [presentationId, supabase])

  const handleBack = () => {
    router.push('/admin')
  }

  if (loading) return <div className="p-8">Loading presentation...</div>
  if (error) return <div className="p-8 text-red-500">Error loading presentation: {error}</div>
  if (!presentation) return <div className="p-8">No presentation found.</div>

  return (
    <AdminPresentationView initialPresentation={presentation} onBack={handleBack} />
  )
}