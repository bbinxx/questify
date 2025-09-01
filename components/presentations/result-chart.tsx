"use client"

export function ResultChart({ question, options, counts }: { question: string; options: string[]; counts: number[] }) {
  // Add error handling for undefined counts
  if (!counts || !Array.isArray(counts)) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600">No results available</p>
        </div>
      </div>
    )
  }
  
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-center text-2xl font-bold">{question}</h2>
      <div className="space-y-4">
        {options.map((opt, i) => {
          const c = counts[i] ?? 0
          const pct = total > 0 ? (c / total) * 100 : 0
          return (
            <div key={i} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{opt}</span>
                <span className="text-sm text-gray-600">
                  {c} votes ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-center text-gray-600">Total Responses: {total}</div>
    </div>
  )
}
