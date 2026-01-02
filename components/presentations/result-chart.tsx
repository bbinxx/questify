import { Slide } from '@/app/page'
import { BarChart3 } from 'lucide-react'

interface ResultChartProps {
  slide: Slide
  votesData?: any[] | null
  showTitle?: boolean
}

export function ResultChart({ slide, votesData, showTitle = true }: ResultChartProps) {
  const totalResponses = votesData ? votesData.reduce((sum, vote) => sum + vote.count, 0) : 0

  if (slide.type === 'word_cloud') {
    // For word cloud, votesData will be an array of { option: word, count: number }
    const sortedWords = votesData ? [...votesData].sort((a, b) => b.count - a.count) : []
    const maxCount = sortedWords.length > 0 ? sortedWords[0].count : 1

    return (
      <div className="space-y-6">
        {showTitle && <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>}
        <div className="text-center text-gray-500">
          {sortedWords.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {sortedWords.map((word, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: `${1 + (word.count / maxCount) * 2}rem`, // Scale font size based on count
                    opacity: `${0.5 + (word.count / maxCount) * 0.5}`, // Scale opacity
                  }}
                  className="font-semibold text-gray-800 transition-all duration-300 ease-in-out"
                >
                  {word.option}
                </span>
              ))}
            </div>
          ) : (
            <p>No words submitted yet.</p>
          )}
        </div>
      </div>
    )
  }

  if (slide.type === 'text' || slide.type === 'question_only') {
    return (
      <div className="space-y-6">
        {showTitle && <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>}
        <div className="text-center text-gray-500">
          <p>Text responses would be displayed here (or the answer for question-only slides).</p>
          <p className="text-sm">This section needs to fetch actual text responses from the database.</p>
        </div>
      </div>
    )
  }

  // For multiple_choice and single_choice
  return (
    <div className="space-y-6">
      {showTitle && <h2 className="mb-8 text-center text-2xl font-bold">{slide.question}</h2>}
      <div className="space-y-4">
        {slide.options.map((option, index) => {
          const votesForOption = votesData?.find(vote => vote.option === option)?.count || 0
          const percentage = totalResponses > 0 ? (votesForOption / totalResponses) * 100 : 0
          return (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{option}</span>
                <span className="text-sm text-gray-600">
                  {votesForOption} votes ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className="h-4 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-center text-gray-600">Total Responses: {totalResponses}</div>
    </div>
  )
}