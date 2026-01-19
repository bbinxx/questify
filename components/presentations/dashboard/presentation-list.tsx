import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Presentation } from '@/app/page'
import { BarChart3, Copy, Edit3, Plus, Eye, Calendar, TrendingUp, AlertCircle, Users, Trash2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { UI_TEXT, ROUTES } from '@/lib/config/app-config'
import { withErrorHandling, logger } from '@/lib/utils/error-handler'
import { dbConnection } from '@/lib/utils/db-connection'

interface PresentationListProps {
  onCreateNew: () => void
}

export function PresentationList({ onCreateNew }: PresentationListProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbConnected, setDbConnected] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPresentations()
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    const status = await dbConnection.verifyConnection()
    setDbConnected(status.connected)

    if (!status.connected) {
      setError(status.message)
      logger.error('Database connection failed', status.message)
    }
  }

  const fetchPresentations = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await withErrorHandling(async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return []

      const { data, error } = await supabase
        .from('presentations')
        .select('*, slides(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Presentation[]
    }, UI_TEXT.errors.database.fetch)

    if (fetchError) {
      setError(fetchError)
      logger.error('Failed to fetch presentations', fetchError)
    } else if (data) {
      setPresentations(data)
      logger.success(`Loaded ${data.length} presentations`)
    }

    setLoading(false)
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      // You could add a toast notification here
      logger.info(`Code copied: ${code}`)
      alert(UI_TEXT.dashboard.card.copySuccess)
    } catch (err) {
      logger.error('Failed to copy code', err)
      alert('Failed to copy code. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{UI_TEXT.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !dbConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error || UI_TEXT.errors.database.connection}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                fetchPresentations()
                checkDatabaseConnection()
              }}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-semibold"
            >
              Try Again
            </button>
            <Link
              href={ROUTES.home}
              className="block text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{UI_TEXT.dashboard.title}</h1>
              <p className="text-gray-600 mt-1">{UI_TEXT.dashboard.subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={ROUTES.home}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {UI_TEXT.dashboard.backButton}
              </Link>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut()
                    window.location.href = ROUTES.home
                  } catch (error) {
                    console.error('Error signing out:', error)
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-colors"
                title="Sign out"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                onClick={onCreateNew}
                className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white transition-all hover:bg-indigo-700 shadow-lg hover:shadow-xl font-semibold"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                {UI_TEXT.dashboard.createButton}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {presentations.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{UI_TEXT.dashboard.empty.title}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {UI_TEXT.dashboard.empty.subtitle}
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-white transition-all hover:bg-indigo-700 shadow-lg font-semibold"
            >
              <Plus size={20} />
              {UI_TEXT.dashboard.empty.button}
            </button>
          </div>
        ) : (
          /* Presentations Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presentations.map((presentation) => (
              <div
                key={presentation.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 overflow-hidden"
              >
                {/* Card Header with Status */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{presentation.title}</h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Calendar size={14} />
                        <span>{new Date(presentation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${presentation.is_active
                        ? "bg-green-400/20 text-green-100 border border-green-300/30"
                        : "bg-white/20 text-white/80 border border-white/30"
                        }`}
                    >
                      {presentation.is_active ? UI_TEXT.dashboard.card.status.live : UI_TEXT.dashboard.card.status.inactive}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Code Section */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Copy size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">{UI_TEXT.dashboard.card.code}</div>
                        <code className="text-lg font-bold text-gray-900">{presentation.code}</code>
                      </div>
                    </div>
                    <button
                      onClick={() => copyCode(presentation.code)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                      title="Copy code"
                      aria-label={`Copy code ${presentation.code}`}
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <BarChart3 size={16} />
                        <span className="text-xs font-medium">{UI_TEXT.dashboard.card.slides}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{presentation.slides.length}</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Calendar size={16} />
                        <span className="text-xs font-medium">Updated</span>
                      </div>
                      <div className="text-sm font-bold text-purple-900">
                        {new Date(presentation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions - 4 Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
                    <Link
                      href={ROUTES.edit(presentation.id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-3 text-white transition-all hover:bg-indigo-700 font-semibold text-xs shadow-md hover:shadow-lg"
                    >
                      <Edit3 size={14} />
                      Edit
                    </Link>
                    <Link
                      href={ROUTES.present(presentation.id)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-green-600 py-3 text-white transition-all hover:bg-green-700 font-semibold text-xs shadow-md hover:shadow-lg"
                    >
                      <Eye size={14} />
                      Present
                    </Link>
                    <button
                      onClick={() => {
                        const participantUrl = `${window.location.origin}/p/${presentation.code}`
                        navigator.clipboard.writeText(participantUrl).then(() => {
                          alert(`✅ Participant link copied!\n\n${participantUrl}\n\nShare this link with your audience.`)
                          logger.info(`Copied participant link: ${participantUrl}`)
                        }).catch((err) => {
                          logger.error('Failed to copy link', err)
                          alert('Failed to copy link. Please try again.')
                        })
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl bg-purple-600 py-3 text-white transition-all hover:bg-purple-700 font-semibold text-xs shadow-md hover:shadow-lg"
                      title="Copy participant link"
                    >
                      <Copy size={14} />
                      Link
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to delete this presentation? This action cannot be undone.')) return

                        try {
                          const { error } = await supabase
                            .from('presentations')
                            .delete()
                            .eq('id', presentation.id)

                          if (error) throw error

                          setPresentations(prev => prev.filter(p => p.id !== presentation.id))
                          logger.success('Presentation deleted successfully')
                        } catch (err) {
                          logger.error('Failed to delete presentation', err)
                          alert('Failed to delete presentation. Please try again.')
                        }
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl bg-red-600 py-3 text-white transition-all hover:bg-red-700 font-semibold text-xs shadow-md hover:shadow-lg"
                      title="Delete presentation"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}