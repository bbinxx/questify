"use client"

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminPresentationView } from '@/components/presentations/admin/admin-presentation-view'
import { Presentation } from '@/app/page'
import { ROUTES } from '@/lib/config/app-config'

export default function ManageEditorPage() {
  const params = useParams<{ id: string }>()
  const presentationId = params.id
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ensureAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to access this page.')
        router.push(ROUTES.login)
        return
      }

      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('presentations')
        .select('*, slides(*)')
        .eq('id', presentationId)
        .limit(1)

      if (error) {
        console.error('Error fetching presentation:', error)
        setError(error.message)
      } else if (data && data.length > 0) {
        const presentationData = data[0] as any
        setPresentation({
          ...presentationData,
          slides: presentationData.slides || [],
          current_slide: presentationData.current_slide || 0,
        } as Presentation)
      }
      setLoading(false)
    }

    if (presentationId) {
      ensureAuthAndFetch()
    }
  }, [presentationId, supabase, router])

  const handleBack = () => {
    router.push(ROUTES.manage)
  }

  if (loading) return <div className="p-8">Loading presentation...</div>
  if (error) return <div className="p-8 text-red-500">Error loading presentation: {error}</div>
  if (!presentation) return <div className="p-8">No presentation found.</div>

  return (
    <AdminPresentationView initialPresentation={presentation} onBack={handleBack} />
  )
}
