'use server'

import { DatabaseService } from '@/lib/db'
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
        const gameId = await DatabaseService.createGame(title, userId, questions);
        return { success: true, gameId }
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
        const quiz = await DatabaseService.getGame(id);

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
        await DatabaseService.updateGame(id, title, questions);
        return { success: true, gameId: id }
    } catch (error) {
        console.error('Update quiz error:', error)
        return { error: 'Failed to update quiz', success: false }
    }
}

export async function deleteQuiz(id: string) {
    const userId = cookies().get('userId')?.value

    if (!userId) {
        return { error: 'Unauthorized', success: false }
    }

    try {
        const quiz = await DatabaseService.getGame(id)
        if (quiz?.hostId !== userId) {
            return { error: 'Unauthorized to delete this quiz', success: false }
        }

        await DatabaseService.deleteGame(id)
        return { success: true }
    } catch (error) {
        console.error('Delete quiz error:', error)
        return { error: 'Failed to delete quiz', success: false }
    }
}
