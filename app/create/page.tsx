import QuizEditor from '@/app/components/QuizEditor'
import { getSessionUserId } from '@/lib/session'
import { redirect } from 'next/navigation'
export default async function CreatePage() {
    if (!await getSessionUserId()) redirect('/login')
    return <QuizEditor />
}
