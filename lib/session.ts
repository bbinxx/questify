import { cookies } from 'next/headers'
import { SESSION_COOKIE, SESSION_DURATION, createSessionToken, verifySessionToken } from './session-token'

export async function getSessionUserId(): Promise<string | null> {
    return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
}

export async function setSession(userId: string) {
    const store = await cookies()
    store.set(SESSION_COOKIE, createSessionToken(userId), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: SESSION_DURATION, path: '/',
    })
    store.delete('userId')
}

export function sessionConfigured(): boolean {
    return typeof process.env.SESSION_SECRET === 'string' && Buffer.byteLength(process.env.SESSION_SECRET) >= 32
}

export async function clearSession() {
    const store = await cookies()
    store.delete(SESSION_COOKIE)
    store.delete('userId')
}
