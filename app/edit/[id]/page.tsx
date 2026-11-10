import QuizEditor from '@/app/components/QuizEditor'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
    if (!await getSessionUserId()) redirect('/login')
    return <QuizEditor quizId={(await params).id} />
}
