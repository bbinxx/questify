import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const userId = cookies().get('userId')?.value
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { gameId, roomCode, startedAt, endedAt, players, stats } = body

        if (!gameId || !roomCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const sessionId = await DatabaseService.saveSession({
            gameId,
            hostId: userId,
            roomCode,
            startedAt,
            endedAt,
            players,
            stats
        })

        return NextResponse.json({ success: true, sessionId })
    } catch (error) {
        console.error('Save session API error:', error)
        return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
    }
}
