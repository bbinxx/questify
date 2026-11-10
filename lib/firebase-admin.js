const { getApps, initializeApp, cert } = require('firebase-admin/app')
const { getFirestore: firestore } = require('firebase-admin/firestore')

function getFirestore() {
    if (!getApps().length) {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        if (raw) {
            // Invalid credentials must fail explicitly; never silently switch projects.
            const account = JSON.parse(raw.trim().replace(/^(['"])(.*)\1$/s, '$2'))
            account.private_key = account.private_key?.replace(/\\n/g, '\n')
            initializeApp({ credential: cert(account) })
        } else {
            initializeApp(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID } : undefined)
        }
    }
    return firestore()
}

async function persistSession(session) {
    const { id, ...data } = session
    if (!id) throw new Error('Session ID required')
    try {
        await getFirestore().collection('sessions').doc(id).create({ ...data, createdAt: new Date().toISOString() })
    } catch (error) {
        if (error.code !== 6 && error.code !== 'already-exists') throw error
    }
    return id
}
module.exports = { getFirestore, persistSession }
