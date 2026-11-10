import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'

// Session results are written only by the authoritative game server.
export async function POST() {
    if (!await getSessionUserId()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Sessions are recorded automatically by the game server' }, { status: 405, headers: { Allow: 'OPTIONS' } })
}
