'use client'

import { useState } from 'react'
import { deleteQuiz } from '@/app/actions/quiz'
import { useRouter } from 'next/navigation'

export default function DeleteGameButton({ gameId }: { gameId: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
            return
        }
        
        setIsDeleting(true)
        const res = await deleteQuiz(gameId)
        
        if (res.success) {
            router.refresh()
        } else {
            alert(res.error || 'Failed to delete event')
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30 ml-2 shrink-0 disabled:opacity-50"
            title="Delete Event"
        >
            {isDeleting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-rose-400 rounded-full animate-spin" />
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
        </button>
    )
}
