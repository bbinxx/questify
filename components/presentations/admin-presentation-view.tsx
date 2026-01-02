import { useEffect, useState } from 'react'
import { Presentation, Slide } from '@/app/page'
import { ChevronLeft, Plus, Play, MoreVertical, LayoutGrid, MonitorPlay, BarChart3, Settings, Save, Square, Users } from 'lucide-react'
import { SlideEditor } from './slide-editor'
import { useSocket } from '@/hooks/use-socket'
import { createClient } from '@/lib/supabase/client'

import { ResultChart } from './result-chart'
import useSWR from 'swr'
import { useMemo } from 'react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AdminPresentationViewProps {
  initialPresentation: Presentation
  onBack: () => void
}

export function AdminPresentationView({
  initialPresentation,
  onBack,
}: AdminPresentationViewProps) {
  const [presentation, setPresentation] = useState<Presentation>(initialPresentation)
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialPresentation.current_slide)
  const [showResults, setShowResults] = useState(initialPresentation.show_results)
  const [participantCount, setParticipantCount] = useState(0)
  const supabase = createClient()

  // Select first slide on load
  useEffect(() => {
    if (presentation.slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(presentation.slides[0].id)
    }
  }, [presentation.slides, selectedSlideId])

  const selectedSlide = presentation.slides.find(s => s.id === selectedSlideId)

  // State for holding live results in memory (received via socket)
  const [resultsData, setResultsData] = useState<any>(null)

  // Socket integration
  const { emit, userId } = useSocket({
    onRoomJoined: (data) => {
      console.log('Admin: Room joined', data)
      // Initialize results from room state
      setResultsData(data.currentVotes)
      setParticipantCount(data.participantCount)
    },
    onParticipantJoined: (data) => {
      console.log('Admin: Participant joined', data)
      setParticipantCount(data.participantCount)
    },
    onParticipantLeft: (data) => {
      console.log('Admin: Participant left', data)
      setParticipantCount(data.participantCount)
    },
    onVotesUpdated: (data) => {
      console.log('Admin: Votes updated', data)
      // Update local state specific to the slide
      setResultsData((prev: any) => ({
        ...prev,
        [data.slideId]: data.votes
      }))
    },
    onError: (data) => {
      console.error('Socket error:', data.message)
    },
    onSaveComplete: (data: any) => {
      alert(`Session saved! ${data.count} responses archived.`)
    }
  })

  // Compute chart data from local state instead of SWR
  const chartData = useMemo(() => {
    if (!selectedSlide || !resultsData) return []

    // resultsData is now { [slideId]: [{option, count}, ...] }
    const slideVotes = resultsData[selectedSlide.id]

    if (Array.isArray(slideVotes)) {
      return slideVotes
    }

    // Fallback/Empty
    return []
  }, [selectedSlide, resultsData])

  useEffect(() => {
    emit('join-room', {
      presentationId: presentation.id,
      roomCode: presentation.code,
      userId: userId,
      userRole: 'presenter',
    })
  }, [emit, presentation.id, presentation.code, userId])

  const updateSlideInDb = async (slideId: string, updates: Partial<Slide>) => {
    const { error } = await supabase.from('slides').update(updates).eq('id', slideId)
    if (error) console.error('Error updating slide in DB:', error)
  }

  const addSlideToDb = async (newSlide: Omit<Slide, 'id'>) => {
    const { data, error } = await supabase
      .from('slides')
      .insert({ ...newSlide, presentation_id: presentation.id })
      .select()
      .single()
    if (error) {
      console.error('Error adding slide to DB:', error)
      return null
    }
    return data as Slide
  }

  const deleteSlideFromDb = async (slideId: string) => {
    const { error } = await supabase.from('slides').delete().eq('id', slideId)
    if (error) console.error('Error deleting slide from DB:', error)
  }

  const handleUpdateSlide = async (slideId: string, updates: Partial<Slide>) => {
    setPresentation(prev => {
      const updatedSlides = prev.slides.map(s =>
        s.id === slideId ? { ...s, ...updates } : s
      )
      return { ...prev, slides: updatedSlides }
    })
    await updateSlideInDb(slideId, updates)
  }

  const handleAddSlide = async (type: Slide['type'] = "multiple_choice") => {
    // Construct payload strictly for DB (excluding 'responses')
    const slidePayload = {
      question: "New Slide",
      type: type,
      options: type === 'text' || type === 'word_cloud' || type === 'question_only' ? [] : ["Option 1", "Option 2"],
      settings: { allowMultiple: false, showResults: true },
      order: presentation.slides.length,
      presentation_id: presentation.id
    }

    const { data, error } = await supabase
      .from('slides')
      .insert(slidePayload)
      .select()
      .single()

    if (error) {
      console.error('Error adding slide to DB:', error)
      return
    }

    const addedSlide = data as Slide
    // Initialize responses locally
    addedSlide.responses = []

    if (addedSlide) {
      setPresentation(prev => ({
        ...prev,
        slides: [...prev.slides, addedSlide]
      }))
      setSelectedSlideId(addedSlide.id)
    }
  }

  // Function to update presentation metadata (like title)
  const updatePresentationInDb = async (updates: Partial<Presentation>) => {
    const { error } = await supabase
      .from('presentations')
      .update(updates)
      .eq('id', presentation.id)
    if (error) console.error('Error updating presentation in DB:', error)
  }

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return
    await deleteSlideFromDb(slideId)
    setPresentation(prev => {
      const filteredSlides = prev.slides.filter(s => s.id !== slideId)
      return { ...prev, slides: filteredSlides }
    })
    if (selectedSlideId === slideId) {
      setSelectedSlideId(null) // Effect will select first if available
    }
  }

  const handleDuplicateSlide = async (slideId: string) => {
    const slideToDuplicate = presentation.slides.find(s => s.id === slideId)
    if (slideToDuplicate) {
      const newSlide: Omit<Slide, 'id'> = {
        ...slideToDuplicate,
        question: `${slideToDuplicate.question} (Copy)`,
        order: presentation.slides.length,
      }
      const addedSlide = await addSlideToDb(newSlide)
      if (addedSlide) {
        setPresentation(prev => ({
          ...prev,
          slides: [...prev.slides, addedSlide]
        }))
        setSelectedSlideId(addedSlide.id)
      }
    }
  }

  const handleEndPresentation = async () => {
    if (confirm("End the presentation? This will close the session and clear unsaved data.")) {

      if (confirm("Save results to history before closing?")) {
        emit('save-session-data', { presentationId: presentation.id })
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      try {
        const updates = { is_active: false }

        // Optimistic update
        setPresentation(prev => ({ ...prev, ...updates }))

        // Notify server
        emit('presenter-control', {
          presentationId: presentation.id,
          action: 'end-presentation'
        })

        // Persist
        await updatePresentationInDb(updates)

        // Navigate away
        window.location.href = '/manage' // Fallback if router not available, or use router if exists.
      } catch (error) {
        console.error('Failed to end presentation:', error)
      }
    }
  }

  const handlePresent = async () => {
    if (!presentation.is_active) {
      const updates = { is_active: true }
      setPresentation(prev => ({ ...prev, ...updates }))
      await updatePresentationInDb(updates)
    }
    window.open(window.location.href + '/present', '_blank')
  }

  /* selectedSlide already declared above */

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* LEFT SIDEBAR: Slides List */}
      <div className="w-64 bg-white border-r flex flex-col z-10 shadow-sm">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <LayoutGrid size={18} /> Slides
          </h2>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{presentation.slides.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {presentation.slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => { setSelectedSlideId(slide.id); setCurrentSlideIndex(index); }}
              className={`group relative p-3 rounded-xl cursor-pointer border-2 transition-all duration-200 ${selectedSlideId === slide.id
                ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-100'
                : 'border-white bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedSlideId === slide.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>
                  {index + 1}
                </div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
                  {slide.type.replace('_', ' ')}
                </div>
              </div>
              <div className="font-medium text-gray-800 text-sm line-clamp-2 pl-9">
                {slide.question || "New Slide"}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50/50">
          <button
            onClick={() => handleAddSlide('multiple_choice')}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus size={18} /> New Slide
          </button>
        </div>
      </div>

      {/* CENTER: Canvas/Preview */}
      <div className="flex-1 bg-gray-100/50 flex flex-col min-w-0 relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors p-2 hover:bg-gray-100 rounded-lg shrink-0">
              <ChevronLeft size={20} /> <span className="text-sm font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2 shrink-0"></div>

            <input
              value={presentation.title}
              onChange={(e) => setPresentation(prev => ({ ...prev, title: e.target.value }))}
              onBlur={() => updatePresentationInDb({ title: presentation.title })}
              className="font-bold text-gray-800 text-lg bg-transparent border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded px-2 py-1 transition-all w-full max-w-md truncate"
              placeholder="Presentation Title"
            />

            <span className="hidden sm:inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border border-gray-200 shrink-0">
              {presentation.code}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 mr-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${presentation.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              {presentation.is_active ? 'Live' : 'Draft'}
            </div>

            <div className="text-sm text-gray-500 mr-4 flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Users size={14} className="text-indigo-600" />
              <span className="font-semibold text-gray-700">{participantCount}</span>
              <span className="text-xs text-gray-400">joined</span>
            </div>

            <button
              onClick={() => {
                const btn = document.activeElement as HTMLElement
                btn?.blur()
                updatePresentationInDb({ title: presentation.title })
                alert("Presentation saved successfully!")
              }}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 flex items-center gap-2 transition-all mr-2"
              title="Save current state"
            >
              <Save size={18} /> <span className="hidden sm:inline">Save</span>
            </button>

            {presentation.is_active ? (
              <button
                onClick={handleEndPresentation}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Square size={18} fill="currentColor" /> End
              </button>
            ) : (
              <button
                onClick={handlePresent}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <MonitorPlay size={18} /> Present
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          {selectedSlide ? (
            <div className="w-full max-w-5xl aspect-video bg-white rounded-xl shadow-2xl ring-1 ring-black/5 flex flex-col md:flex-row overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
              {/* Preview Content */}
              <div className="flex-1 p-12 flex flex-col justify-center items-center text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 leading-tight">
                  {selectedSlide.question}
                </h2>

                {/* Live Result Chart */}
                <div className="w-full">
                  <ResultChart slide={selectedSlide} votesData={chartData} showTitle={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a slide to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Editor */}
      <div className="w-96 bg-white border-l flex flex-col h-full shadow-lg z-20">
        <div className="h-16 flex items-center px-6 border-b bg-gray-50/50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Settings size={18} /> Editor
          </h2>
        </div>
        {selectedSlide ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SlideEditor
              slide={selectedSlide}
              onUpdate={handleUpdateSlide}
              onDelete={handleDeleteSlide}
              onDuplicate={handleDuplicateSlide}
              variant="sidebar"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <p>No slide selected</p>
          </div>
        )}
      </div>
    </div>
  )
}