"use client"

import { PresentationList } from "@/components/presentations/presentation-list"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminListPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleCreateNewPresentation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to create a presentation.')
      router.push('/login') // Redirect to login page
      return
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data, error } = await supabase
      .from('presentations')
      .insert({
        title: 'New Presentation',
        code: newCode,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating new presentation:', error)
      alert('Failed to create new presentation.')
      return
    }

    if (data) {
      router.push(`/admin/${data.id}`)
    }
  }

  return (
    <PresentationList onCreateNew={handleCreateNewPresentation} />
  )
}