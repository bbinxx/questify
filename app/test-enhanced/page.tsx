"use client"

import { useState } from 'react'
import { SlideEditor, type SlideRecord, type SlideElements } from '@/components/presentations/slide-editor'

export default function TestEnhancedPage() {
  const [slides, setSlides] = useState<SlideRecord[]>([
    {
      id: 'slide-1',
      presentation_id: 'test',
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
      presentation_id: 'test',
      position: 1,
      elements: {
        question: 'How would you describe your experience?',
        type: 'word_cloud',
        options: [],
        settings: {
          showResults: true
        }
      }
    },
    {
      id: 'slide-3',
      presentation_id: 'test',
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
      presentation_id: 'test',
      position: 3,
      elements: {
        question: 'Tell us about your biggest challenge',
        type: 'text',
        options: [],
        settings: {
          maxLength: 500
        }
      }
    },
    {
      id: 'slide-5',
      presentation_id: 'test',
      position: 4,
      elements: {
        question: 'Important Discussion Point',
        type: 'question_only',
        options: [],
        settings: {}
      }
    }
  ])

  const updateSlide = async (slideId: string, updated: SlideElements) => {
    setSlides(prev => prev.map(slide => 
      slide.id === slideId 
        ? { ...slide, elements: updated }
        : slide
    ))
    console.log('Slide updated:', slideId, updated)
  }

  const deleteSlide = async (slideId: string) => {
    setSlides(prev => prev.filter(slide => slide.id !== slideId))
    console.log('Slide deleted:', slideId)
  }

  const duplicateSlide = async (slideId: string) => {
    const slideToDuplicate = slides.find(s => s.id === slideId)
    if (!slideToDuplicate) return

    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: 'test',
      position: slides.length,
      elements: {
        ...slideToDuplicate.elements,
        question: `${slideToDuplicate.elements.question} (Copy)`
      }
    }

    setSlides(prev => [...prev, newSlide])
    console.log('Slide duplicated:', slideId)
  }

  const addSlide = () => {
    const newSlide: SlideRecord = {
      id: `slide-${Date.now()}`,
      presentation_id: 'test',
      position: slides.length,
      elements: {
        question: 'New Question',
        type: 'multiple_choice',
        options: ['Option 1', 'Option 2'],
        settings: {
          allowMultiple: false,
          showResults: true
        }
      }
    }

    setSlides(prev => [...prev, newSlide])
    console.log('Slide added')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enhanced Slide Editor Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the enhanced slide editor with all question types and functionality.
          </p>
          
          <button
            onClick={addSlide}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Slide
          </button>
        </div>

        <div className="space-y-6">
          {slides.map((slide, index) => (
            <div key={slide.id} className="relative">
              <SlideEditor
                slide={slide}
                onUpdate={updateSlide}
                onDelete={deleteSlide}
                onDuplicate={duplicateSlide}
                isActive={index === 0}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Test Results:</h3>
          <p className="text-blue-700 text-sm">
            • Try changing question types using the selector buttons<br/>
            • Add/remove options for choice questions<br/>
            • Toggle settings for each slide<br/>
            • Duplicate slides to test the copy functionality<br/>
            • Check that all question types render correctly
          </p>
        </div>
      </div>
    </div>
  )
}
