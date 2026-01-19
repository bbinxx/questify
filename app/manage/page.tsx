"use client"

import { PresentationList } from "@/components/presentations/dashboard/presentation-list"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/config/app-config'

export default function ManageListPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleCreateNewPresentation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to create a presentation.')
      router.push(ROUTES.login)
      return
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    // Supabase client typing can be strict in this repo; cast the client to any
    // and the response to any to avoid TypeScript errors while preserving runtime behavior.
    const sb: any = supabase
    const res: any = await sb
      .from('presentations')
      .insert({
        title: 'New Presentation',
        code: newCode,
        user_id: user.id,
      })
      .select()
      .single()

    const data = res?.data
    const error = res?.error

    if (error) {
      console.error('Error creating new presentation:', error)
      alert('Failed to create new presentation.')
      return
    }

    if (data) {
      router.push(ROUTES.edit(data.id))
    }
  }

  return (
    <PresentationList onCreateNew={handleCreateNewPresentation} />
  )
}
