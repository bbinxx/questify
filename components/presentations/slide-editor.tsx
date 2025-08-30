"use client"

import { Trash2 } from "lucide-react"
import { useState } from "react"

export type SlideElements = {
  question: string
  options: string[]
}

export type SlideRecord = {
  id: string
  presentation_id: string
  position: number
  elements: SlideElements
}

export function SlideEditor({
  slide,
  onUpdate,
  onDelete,
}: {
  slide: SlideRecord
  onUpdate: (slideId: string, updated: SlideElements) => Promise<void>
  onDelete: (slideId: string) => Promise<void>
}) {
  const [local, setLocal] = useState<SlideElements>(slide.elements)

  return (
    <div className="mb-4 rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-semibold">Slide {slide.position + 1}</h3>
        <button
          onClick={() => onDelete(slide.id)}
          className="p-1 text-red-500 hover:text-red-700"
          aria-label="Delete slide"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Question</label>
        <input
          type="text"
          value={local.question}
          onChange={(e) => setLocal((s) => ({ ...s, question: e.target.value }))}
          onBlur={() => onUpdate(slide.id, local)}
          className="w-full rounded-md border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your question..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Options</label>
        {local.options.map((option, idx) => (
          <input
            key={idx}
            type="text"
            value={option}
            onChange={(e) =>
              setLocal((s) => {
                const next = [...s.options]
                next[idx] = e.target.value
                return { ...s, options: next }
              })
            }
            onBlur={() => onUpdate(slide.id, local)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            placeholder={`Option ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
