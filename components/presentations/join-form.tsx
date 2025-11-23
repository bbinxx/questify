import { useState } from "react"

export function JoinForm({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("")

  const handleSubmit = () => {
    if (code.trim()) {
      onJoin(code.trim())
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-center text-2xl font-semibold">Join Presentation</h2>
      <div className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter presentation code"
          className="w-full rounded-md border border-gray-300 p-4 text-center text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="w-full rounded-md bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Join Presentation
        </button>
      </div>
    </div>
  )
}
