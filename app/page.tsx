"use client"

import { useState } from "react"
import Link from "next/link"
import { JoinForm } from "@/components/presentations/participant/join-form"
import { ArrowRight, BarChart3, Users, Zap, CheckCircle, Sparkles, Shield } from 'lucide-react'
import { APP_CONFIG, UI_TEXT, ROUTES } from "@/lib/config/app-config"

export type Slide = {
  id: string
  question: string
  type: 'multiple_choice' | 'word_cloud' | 'question_only' | 'text' | 'single_choice' | 'scale' | 'ranking' | 'qa' | 'quiz'
  options: string[]
  responses: number[]
  settings: {
    allowMultiple?: boolean
    showResults?: boolean
    timeLimit?: number
    maxLength?: number
    required?: boolean
  }
  order: number
}

export type Presentation = {
  id: string
  title: string
  code: string
  created_at: string
  is_active: boolean
  current_slide: number
  show_results: boolean
  slides: Slide[]
  settings?: {
    allowAnonymous?: boolean
    showResults?: boolean
    timeLimit?: number
  }
}

const iconMap: Record<string, any> = {
  zap: Zap,
  chart: BarChart3,
  users: Users,
  shield: Shield
}

export default function LandingPage() {
  const { landing } = UI_TEXT
  const [joinCode, setJoinCode] = useState("")

  const handleJoinPresentation = async (code: string) => {
    window.location.href = ROUTES.join(code.trim().toUpperCase())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {APP_CONFIG.name}
            </span>
          </Link>
          <Link
            href={ROUTES.manage}
            className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Join the session
            </h1>
            <p className="text-lg text-gray-500">
              Enter the code provided by the presenter to start.
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
            <JoinForm onJoin={handleJoinPresentation} />
          </div>

          <p className="text-xs text-gray-400">
            Protected by Questify Secure Systems.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.</p>
      </footer>
    </div>
  )
}