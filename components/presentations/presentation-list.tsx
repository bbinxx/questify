"use client"

import useSWR from "swr"
import { useRouter } from "next/navigation"
import { BarChart3, Copy, Edit3, Plus, Trash2, Pencil, Check, X, Play } from "lucide-react"
import { useState } from "react"

type Presentation = {
  id: string
  title: string
  code: string
  is_active: boolean
  current_slide: number
  show_results: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PresentationList() {
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR<{ presentations: Presentation[] }>("/api/presentations", fetcher)

  const create = async () => {
    await fetch("/api/presentations", { method: "POST" })
    mutate()
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>("")

  const startRename = (p: Presentation) => {
    setEditingId(p.id)
    setEditingTitle(p.title)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const saveRename = async (id: string) => {
    await fetch(`/api/presentations/${id}`, { method: "PATCH", body: JSON.stringify({ title: editingTitle }) })
    setEditingId(null)
    setEditingTitle("")
    mutate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/presentations/${id}`, { method: "DELETE" })
    mutate()
  }

  if (isLoading) return <div className="text-gray-600">Loading…</div>

  const presentations = data?.presentations ?? []

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={create}
          className="flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
        >
          <Plus size={16} />
          New Presentation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {presentations.map((p) => (
          <div key={p.id} className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                {editingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => saveRename(p.id)}
                      className="rounded bg-green-500 p-2 text-white hover:bg-green-600"
                      aria-label="Save title"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="rounded bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold">{p.title}</h3>
                )}
              </div>
              <span
                className={`ml-3 rounded px-2 py-1 text-xs font-medium ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
              >
                {p.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Copy size={16} />
                <code className="rounded bg-gray-100 px-2 py-1">{p.code}</code>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BarChart3 size={16} />
                <span>Use code to join</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <button
                onClick={() => router.push(`/admin/${p.id}`)}
                className="flex items-center justify-center gap-2 rounded-md bg-blue-500 py-2 text-white transition-colors hover:bg-blue-600"
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={() => startRename(p)}
                className="flex items-center justify-center gap-2 rounded-md bg-amber-500 py-2 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                disabled={editingId === p.id}
              >
                <Pencil size={16} />
                Rename
              </button>
              <button
                onClick={() => router.push(`/admin/${p.id}/present`)}
                className="flex items-center justify-center gap-2 rounded-md bg-gray-700 py-2 text-white transition-colors hover:bg-gray-800"
                aria-label="Present"
              >
                <Play size={16} />
                Present
              </button>
              <button
                onClick={() => remove(p.id)}
                className="flex items-center justify-center gap-2 rounded-md bg-red-500 py-2 text-white transition-colors hover:bg-red-600"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
