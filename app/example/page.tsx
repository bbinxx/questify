"use client"

import { useState } from 'react'
import { PresentationBuilder } from '@/components/presentations/presentation-builder'
import { MentimeterParticipantView } from '@/components/presentations/mentimeter-participant-view'
import { PresentationIntegrationExample } from '@/components/presentations/presentation-integration-example'
import { 
  Play, 
  Users, 
  Monitor, 
  Smartphone, 
  Plus,
  Settings,
  BarChart3,
  Cloud,
  MessageSquare,
  CheckSquare,
  Circle,
  HelpCircle
} from 'lucide-react'

export default function ExamplePage() {
  const [viewMode, setViewMode] = useState<'builder' | 'presenter' | 'participant'>('builder')
  const [presentation, setPresentation] = useState({
    id: 'example-presentation',
    title: 'Example Interactive Presentation',
    description: 'A demonstration of Questify features',
    code: 'DEMO123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: false,
    current_slide: 0,
    slides: [
      {
        id: 'slide-1',
        presentation_id: 'example-presentation',
        position: 0,
        elements: {
          question: 'What is your favorite programming language?',
          type: 'multiple_choice',
          options: ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript'],
          settings: {
            allowMultiple: true,
            showResults: true
          }
        }
      },
      {
        id: 'slide-2',
        presentation_id: 'example-presentation',
        position: 1,
        elements: {
          question: 'How would you describe your experience with this presentation?',
          type: 'word_cloud',
          options: [],
          settings: {
            showResults: true
          }
        }
      },
      {
        id: 'slide-3',
        presentation_id: 'example-presentation',
        position: 2,
        elements: {
          question: 'What is your preferred development environment?',
          type: 'single_choice',
          options: ['VS Code', 'IntelliJ', 'Sublime Text', 'Vim', 'Other'],
          settings: {
            showResults: true
          }
        }
      },
      {
        id: 'slide-4',
        presentation_id: 'example-presentation',
        position: 3,
        elements: {
          question: 'Tell us about your biggest challenge in software development',
          type: 'text',
          options: [],
          settings: {}
        }
      },
      {
        id: 'slide-5',
        presentation_id: 'example-presentation',
        position: 4,
        elements: {
          question: 'Important Discussion Point',
          type: 'question_only',
          options: [],
          settings: {}
        }
      }
    ],
    settings: {
      allowAnonymous: true,
      showResults: true,
      timeLimit: 60
    }
  })

  const handleSave = async (updatedPresentation: any) => {
    setPresentation(updatedPresentation)
    console.log('Presentation saved:', updatedPresentation)
  }

  const handleStart = async (presentationId: string) => {
    setPresentation(prev => ({ ...prev, is_active: true }))
    setViewMode('presenter')
    console.log('Presentation started:', presentationId)
  }

  const handleDelete = async (presentationId: string) => {
    console.log('Presentation deleted:', presentationId)
  }

  const handleDuplicate = async (presentationId: string) => {
    const duplicated = {
      ...presentation,
      id: `duplicated-${Date.now()}`,
      title: `${presentation.title} (Copy)`,
      code: `COPY${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: false
    }
    setPresentation(duplicated)
    console.log('Presentation duplicated:', duplicated)
  }

  const getCurrentSlide = () => {
    return presentation.slides[presentation.current_slide]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Questify Demo</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Room: {presentation.code}</span>
                <span>•</span>
                <span>{presentation.slides.length} slides</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('builder')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'builder'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Plus size={16} />
                Builder
              </button>
              <button
                onClick={() => setViewMode('presenter')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'presenter'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Monitor size={16} />
                Presenter
              </button>
              <button
                onClick={() => setViewMode('participant')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'participant'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Smartphone size={16} />
                Participant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'builder' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Presentation Builder</h2>
              <p className="text-gray-600 mb-4">
                Create and edit your interactive presentation with multiple question types.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">Multiple Choice</div>
                    <div className="text-sm text-blue-700">Select multiple options</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Circle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Single Choice</div>
                    <div className="text-sm text-green-700">Select one option</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-900">Text Response</div>
                    <div className="text-sm text-purple-700">Free text answers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Cloud className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-orange-900">Word Cloud</div>
                    <div className="text-sm text-orange-700">Word frequency visualization</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Question Only</div>
                    <div className="text-sm text-gray-700">Display for discussion</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewMode('presenter')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Play size={16} />
                Start Presentation
              </button>
            </div>

            <PresentationBuilder
              presentation={presentation}
              onSave={handleSave}
              onDelete={handleDelete}
              onStart={handleStart}
              onDuplicate={handleDuplicate}
            />
          </div>
        )}

        {viewMode === 'presenter' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Presenter View</h2>
              <p className="text-gray-600 mb-4">
                Control your presentation and see live results from participants.
              </p>
            </div>

            <PresentationIntegrationExample
              presentationId={presentation.id}
              roomCode={presentation.code}
              isPresenter={true}
              userName="Demo Presenter"
              userId="presenter-1"
              slides={presentation.slides.map(slide => ({
                id: slide.id,
                title: slide.elements.question,
                content: slide.elements.question,
                type: slide.elements.type,
                options: slide.elements.options
              }))}
              debug={true}
            />
          </div>
        )}

        {viewMode === 'participant' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Participant View</h2>
              <p className="text-gray-600 mb-4">
                Join the presentation and respond to questions in real-time.
              </p>
            </div>

            <MentimeterParticipantView
              presentationId={presentation.id}
              roomCode={presentation.code}
              userName="Demo Participant"
              userId="participant-1"
              currentSlide={getCurrentSlide()}
              onResponseSubmitted={(response) => {
                console.log('Response submitted:', response)
              }}
              debug={true}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Questify Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <BarChart3 className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                <div>Real-time Voting</div>
              </div>
              <div>
                <Cloud className="h-5 w-5 mx-auto mb-2 text-orange-600" />
                <div>Word Clouds</div>
              </div>
              <div>
                <Users className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <div>Live Participants</div>
              </div>
              <div>
                <Settings className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                <div>Multiple Question Types</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
