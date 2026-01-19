import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { UI_TEXT } from "@/lib/config/app-config"
import { validatePresentationCode } from "@/lib/utils/error-handler"

export function JoinForm({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)

    const validation = validatePresentationCode(code)

    if (!validation.valid) {
      setError(validation.error || UI_TEXT.errors.validation.invalidCode)
      return
    }

    onJoin(code.trim())
  }

  const handleChange = (value: string) => {
    setCode(value.toUpperCase())
    if (error) setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={UI_TEXT.joinForm.placeholder}
          className={`w-full rounded-xl border-2 ${error ? 'border-red-500' : 'border-gray-200'
            } p-4 text-center text-2xl font-bold tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-4 ${error ? 'focus:ring-red-100' : 'focus:ring-indigo-100'
            } transition-all`}
          maxLength={8}
          aria-label="Presentation code"
          aria-invalid={!!error}
          aria-describedby={error ? "code-error" : "code-hint"}
        />
        {error ? (
          <p id="code-error" className="text-sm text-red-600 mt-2 text-center font-medium">
            {error}
          </p>
        ) : (
          <p id="code-hint" className="text-sm text-gray-500 mt-2 text-center">
            {UI_TEXT.joinForm.hint}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={code.length < 3}
        className="group w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        aria-label={UI_TEXT.joinForm.button}
      >
        {UI_TEXT.joinForm.button}
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  )
}
