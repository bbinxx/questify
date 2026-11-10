const { createHmac, timingSafeEqual } = require('node:crypto')

const SESSION_COOKIE = 'questify_session'
const SESSION_DURATION = 60 * 60 * 24 * 7

function validSecret(secret) {
    return typeof secret === 'string' && Buffer.byteLength(secret) >= 32
}

function createSessionToken(userId, secret = process.env.SESSION_SECRET, now = Math.floor(Date.now() / 1000)) {
    if (!validSecret(secret)) throw new Error('SESSION_SECRET must contain at least 32 bytes')
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp: now + SESSION_DURATION, v: 1 })).toString('base64url')
    return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}

function verifySessionToken(token, secret = process.env.SESSION_SECRET, now = Math.floor(Date.now() / 1000)) {
    if (!validSecret(secret) || typeof token !== 'string' || token.length > 2048) return null
    try {
        const parts = token.split('.')
        if (parts.length !== 2) return null
        const expected = createHmac('sha256', secret).update(parts[0]).digest()
        const actual = Buffer.from(parts[1], 'base64url')
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
        const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
        return data.v === 1 && Number.isFinite(data.exp) && data.exp > now &&
            typeof data.sub === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(data.sub) ? data.sub : null
    } catch { return null }
}

function userFromCookie(header = '') {
    const value = header.split(';').map(s => s.trim()).find(s => s.startsWith(`${SESSION_COOKIE}=`))
    return verifySessionToken(value?.slice(SESSION_COOKIE.length + 1))
}

module.exports = { SESSION_COOKIE, SESSION_DURATION, createSessionToken, verifySessionToken, userFromCookie }
