'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function createQuiz(title: string, questions: any[]) {
    const userId = cookies().get('userId')?.value

    if (!userId) {
        return { error: 'Unauthorized', success: false }
    }

    if (!title) {
        return { error: 'Title is required', success: false }
    }

    if (!questions || questions.length === 0) {
        return { error: 'At least one question is required', success: false }
    }

    try {
        const game = await prisma.game.create({
            data: {
                title,
                hostId: userId,
                status: 'WAITING',
                questions: {
                    create: questions.map((q) => ({
                        text: q.text,
                        options: JSON.stringify(q.answers),
                        correct: q.correctAnswer,
                        timeLimit: parseInt(q.timeLimit) || 20
                    }))
                }
            }
        })
        return { success: true, gameId: game.id }
    } catch (error) {
        console.error('Create quiz error:', error)
        return { error: 'Failed to create quiz', success: false }
    }
}

export async function getQuiz(id: string) {
    const userId = cookies().get('userId')?.value

    if (!userId) {
        return { error: 'Unauthorized', success: false }
    }

    try {
        const quiz = await prisma.game.findUnique({
            where: { id },
            include: {
                questions: true
            }
        })

        if (!quiz) {
            return { error: 'Quiz not found', success: false }
        }

        if (quiz.hostId !== userId) {
            return { error: 'Unauthorized', success: false }
        }

        return { success: true, quiz }
    } catch (error) {
        console.error('Get quiz error:', error)
        return { error: 'Failed to fetch quiz', success: false }
    }
}

export async function updateQuiz(id: string, title: string, questions: any[]) {
    const userId = cookies().get('userId')?.value

    if (!userId) {
        return { error: 'Unauthorized', success: false }
    }

    try {
        // Simple strategy: delete old questions and create new ones
        // In a real app, you'd want to update existing ones to preserve IDs if needed
        await prisma.question.deleteMany({
            where: { gameId: id }
        })

        const game = await prisma.game.update({
            where: { id },
            data: {
                title,
                questions: {
                    create: questions.map((q) => ({
                        text: q.text,
                        options: JSON.stringify(q.answers),
                        correct: q.correctAnswer,
                        timeLimit: parseInt(q.timeLimit) || 20
                    }))
                }
            }
        })

        return { success: true, gameId: game.id }
    } catch (error) {
        console.error('Update quiz error:', error)
        return { error: 'Failed to update quiz', success: false }
    }
}
