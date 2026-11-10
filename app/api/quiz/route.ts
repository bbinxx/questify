import { NextRequest, NextResponse } from 'next/server'
import { createQuiz, getQuiz, updateQuiz, deleteQuiz } from '@/app/actions/quiz'
import { DatabaseService } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export async function GET(request: NextRequest) {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (id) {
            const result = await getQuiz(id)
            return NextResponse.json(result.success ? result.quiz : { error: result.error }, { status: result.success ? 200 : 404 })
        }
        const user = await DatabaseService.getUserWithGames(userId)
        return NextResponse.json(user?.games || [])
    } catch {
        return NextResponse.json({ error: 'Unable to load quizzes' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    if (!await getSessionUserId()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const body = await request.json()
        const result = await createQuiz(body.title, body.questions)
        return NextResponse.json(result, { status: result.success ? 201 : 400 })
    } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
}

export async function PUT(request: NextRequest) {
    if (!await getSessionUserId()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const body = await request.json()
        if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 })
        const result = await updateQuiz(body.id, body.title, body.questions)
        return NextResponse.json(result, { status: result.success ? 200 : 400 })
    } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
}

export async function DELETE(request: NextRequest) {
    if (!await getSessionUserId()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 })
    const result = await deleteQuiz(id)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
