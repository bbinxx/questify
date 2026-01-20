import { NextRequest, NextResponse } from 'next/server'

// In-memory storage (replace with database in production)
let quizzes: Quiz[] = []

interface Answer {
    text: string
    isCorrect: boolean
}

interface Question {
    id: string
    text: string
    type: 'quiz' | 'truefalse' | 'poll'
    timeLimit: number
    points: 'none' | 'standard' | 'double'
    answerType: 'single' | 'multi'
    answers: Answer[]
    mediaUrl?: string
}

interface Quiz {
    id: string
    title: string
    questions: Question[]
    createdAt: string
    updatedAt: string
}

// GET - Fetch all quizzes or single quiz by id
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
        const quiz = quizzes.find(q => q.id === id)
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
        }
        return NextResponse.json(quiz)
    }

    return NextResponse.json(quizzes)
}

// POST - Create new quiz
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const newQuiz: Quiz = {
            id: crypto.randomUUID(),
            title: body.title || 'Untitled Quiz',
            questions: body.questions || [{
                id: crypto.randomUUID(),
                text: '',
                type: 'quiz',
                timeLimit: 20,
                points: 'standard',
                answerType: 'single',
                answers: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        quizzes.push(newQuiz)
        return NextResponse.json(newQuiz, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}

// PUT - Update existing quiz
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
        }

        const quizIndex = quizzes.findIndex(q => q.id === id)
        if (quizIndex === -1) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
        }

        quizzes[quizIndex] = {
            ...quizzes[quizIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        }

        return NextResponse.json(quizzes[quizIndex])
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}

// DELETE - Delete quiz
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const quizIndex = quizzes.findIndex(q => q.id === id)
    if (quizIndex === -1) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const deleted = quizzes.splice(quizIndex, 1)[0]
    return NextResponse.json({ message: 'Quiz deleted', quiz: deleted })
}
