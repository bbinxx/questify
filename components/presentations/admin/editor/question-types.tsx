"use client"

import { SlideType as QuestionType } from "@/lib/config/question-types"

interface QuestionTypesProps {
  onAddSlide: (type: QuestionType) => void;
  busy?: boolean;
}

export function QuestionTypes({ onAddSlide, busy = false }: QuestionTypesProps) {
  const questionTypes = [
    { id: "multiple_choice", name: "Multiple Choice" },
    { id: "single_choice", name: "Single Choice" },
    { id: "text", name: "Text" },
    { id: "word_cloud", name: "Word Cloud" },
    { id: "question_only", name: "Question Only" },
  ]

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Question Types</h2>
      <div className="grid grid-cols-1 gap-2">
        {questionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onAddSlide(type.id as QuestionType)}
            disabled={busy}
            className="rounded-md bg-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            {type.name}
          </button>
        ))}
      </div>
    </div>
  )
}