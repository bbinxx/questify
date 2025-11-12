"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { JoinForm } from "@/components/presentations/join-form"
import { createClient } from '@/lib/supabase/client'
import { PresentationList } from "@/components/presentations/presentation-list"
import { AdminPresentationView } from "@/components/presentations/admin-presentation-view"
import { ParticipantPresentationView } from "@/components/presentations/participant-presentation-view"

export type Slide = {
  id: string
  question: string
  type: 'multiple_choice' | 'word_cloud' | 'question_only' | 'text' | 'single_choice'
  options: string[]
  responses: number[]
  settings: {
    allowMultiple?: boolean
    showResults?: boolean
    timeLimit?: number
    maxLength?: number
    required?: boolean
  }
}

export type Presentation = {
  id: string
  title: string
  code: string
  created_at: string
  is_active: boolean
  current_slide_index: number
  slides: Slide[]
  settings?: {
    allowAnonymous?: boolean
    showResults?: boolean
    timeLimit?: number
  }
}

type View = "home" | "admin-list" | "admin" | "viewer"

export default function Page() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [joinCode, setJoinCode] = useState("")
  const [viewerPresentation, setViewerPresentation] = useState<Presentation | null>(null)
  const supabase = createClient()

  const handleJoinPresentation = async (code: string) => {
    const { data, error } = await supabase
      .from('presentations')
      .select('*, slides(*)')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (error) {
      console.error('Error joining presentation:', error)
      alert('Failed to join presentation. Please check the code.')
      return
    }

    if (data) {
      setViewerPresentation({
        ...data,
        slides: data.slides || [],
        current_slide_index: data.current_slide_index || 0,
      } as Presentation)
      setCurrentView("viewer")
    }
  }

  // Views
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Questify - Interactive Presentations</h1>
            <p className="text-gray-600">Create and join interactive presentations with real-time audience engagement</p>
          </div>

          <JoinForm onJoin={handleJoinPresentation} />

          <div className="mt-6 text-center">
            <Link href="/admin" className="font-medium text-blue-600 hover:text-blue-700">
              Admin Panel →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "viewer" && viewerPresentation) {
    return (
      <ParticipantPresentationView
        presentation={viewerPresentation}
        onLeave={() => {
          setViewerPresentation(null)
          setCurrentView("home")
        }}
      />
    )
  }

  // The admin views will be handled by the /admin route and its sub-routes
  return null
}