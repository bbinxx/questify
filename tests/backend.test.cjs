const test = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./load-ts.cjs')

test('analytics route has valid JSX', () => {
    loadTs('app/dashboard/analytics/page.tsx', {
        '@/lib/db': {}, '@/lib/session': {}, '@/app/actions/auth': {},
        'next/headers': {}, 'next/navigation': {}, 'next/link': {},
    })
})

test('quiz update rejects another host before any mutation', async () => {
    let updated = false
    const actions = loadTs('app/actions/quiz.ts', {
        '@/lib/db': { DatabaseService: { getGame: async () => ({ hostId: 'owner' }), updateGame: async () => { updated = true } } },
        '@/lib/session': { getSessionUserId: async () => 'attacker' },
        'next/headers': { cookies: () => ({ get: () => ({ value: 'attacker' }) }) },
        '@/lib/validation': require('../lib/validation.js'),
    })
    const result = await actions.updateQuiz('quiz', 'Title', [{ text: 'Q', answers: ['A', 'B'], correctAnswer: 0, timeLimit: 20 }])
    assert.equal(result.success, false)
    assert.equal(updated, false)
})

test('signup accepts email-style usernames and establishes a session', async () => {
    let createdUsername, sessionUser
    const auth = loadTs('app/actions/auth.ts', {
        '@/lib/db': { DatabaseService: { getUserByUsername: async () => null, createUser: async username => { createdUsername = username; return { id: 'new-user' } } } },
        '@/lib/session': { setSession: id => { sessionUser = id }, clearSession() {}, sessionConfigured: () => true },
        'bcryptjs': { hash: async () => 'password-hash' },
        'next/navigation': { redirect() {} },
    })
    const form = new FormData()
    form.set('username', 'admin@invite.app'); form.set('password', 'valid-password')
    assert.equal((await auth.signup({}, form)).success, true)
    assert.equal(createdUsername, 'admin@invite.app')
    assert.equal(sessionUser, 'new-user')
})

test('missing session configuration cannot create an orphan account', async () => {
    let created = false
    const auth = loadTs('app/actions/auth.ts', {
        '@/lib/db': { DatabaseService: { createUser: async () => { created = true } } },
        '@/lib/session': { sessionConfigured: () => false }, 'bcryptjs': {}, 'next/navigation': {},
    })
    const form = new FormData(); form.set('username', 'admin@invite.app'); form.set('password', 'valid-password')
    assert.equal((await auth.signup({}, form)).success, false)
    assert.equal(created, false)
})

test('concurrent signup cannot reserve the same username twice', async () => {
    const records = new Map()
    let serial = Promise.resolve()
    const db = {
        collection: name => ({ doc: id => ({ path: `${name}/${id || 'generated'}`, id: id || 'generated' }) }),
        runTransaction: task => {
            const pending = serial.then(() => task({
                get: async ref => ({ exists: records.has(ref.path) }),
                create: (ref, data) => records.set(ref.path, data),
            }))
            serial = pending.catch(() => {})
            return pending
        },
    }
    const { DatabaseService } = loadTs('lib/db.ts', { './firebase': { db }, './firebase-admin': {}, './presentations': require('../lib/presentations.js') })
    const attempts = await Promise.allSettled([DatabaseService.createUser('same@email.app', 'hash'), DatabaseService.createUser('same@email.app', 'hash')])
    assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1)
})

test('session wrappers await request cookies and clear legacy identity cookies', async () => {
    const jar = new Map()
    const session = loadTs('lib/session.ts', {
        'next/headers': { cookies: async () => ({
            set(name, value) { jar.set(name, value); return this },
            delete(name) { jar.delete(name); return this },
            get(name) { return { value: jar.get(name) } },
        }) },
        './session-token': { SESSION_COOKIE: 'session', SESSION_DURATION: 604800, createSessionToken: () => 'signed-token', verifySessionToken: token => token === 'signed-token' ? 'host' : null },
    })
    jar.set('userId', 'untrusted')
    await session.setSession('host')
    assert.equal(jar.has('userId'), false)
    assert.equal(await session.getSessionUserId(), 'host')
    await session.clearSession()
    assert.equal(jar.size, 0)
})

test('invalid activity input is explained before a publication write', async () => {
    let writes = 0
    const { createQuiz } = loadTs('app/actions/quiz.ts', {
        '@/lib/db': { DatabaseService: { createGame: async () => { writes++ } } },
        '@/lib/session': { getSessionUserId: async () => 'host' },
        '@/lib/validation': require('../lib/validation'),
    })
    const result = await createQuiz('Deck', [{ text: 'Q', answers: ['A', 'B'], correctAnswer: -1, timeLimit: 20 }])
    assert.match(result.error, /correct answer/i)
    assert.equal(writes, 0)
})
