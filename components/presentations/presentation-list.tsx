import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Presentation } from '@/app/page'
import { BarChart3, Copy, Edit3, Plus } from 'lucide-react'
import Link from 'next/link'

interface PresentationListProps {
  onCreateNew: () => void
}

export function PresentationList({ onCreateNew }: PresentationListProps) {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchPresentations = async () => {
      const { data, error } = await supabase
        .from('presentations')
        .select('*, slides(*)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching presentations:', error)
        return
      }
      setPresentations(data as Presentation[])
    }
    fetchPresentations()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <div className="space-x-4">
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
            >
              <Plus size={16} />
              New Presentation
            </button>
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {presentations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">No presentations found. Create one to get started!</p>
            </div>
          ) : (
            presentations.map((presentation) => (
              <div key={presentation.id} className="rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-xl font-semibold">{presentation.title}</h3>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      presentation.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {presentation.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Copy size={16} />
                    <code className="rounded bg-gray-100 px-2 py-1">{presentation.code}</code>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BarChart3 size={16} />
                    <span>{presentation.slides.length} slides</span>
                  </div>
                </div>

                <Link
                  href={`/admin/${presentation.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-500 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  <Edit3 size={16} />
                  Edit Presentation
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}