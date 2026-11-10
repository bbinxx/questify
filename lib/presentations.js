const { randomUUID } = require('node:crypto')
const { normalizeQuiz } = require('./validation')

/**
 * @param {any} db
 * @param {{gameId?: string, hostId: string, title: string, questions: any[]}} input
 */
async function publishPresentation(db, { gameId, hostId, title, questions }) {
    const normalized = normalizeQuiz(title, questions)
    const games = db.collection('games')
    const game = gameId ? games.doc(gameId) : games.doc()
    const versionId = randomUUID()
    const version = game.collection('versions').doc(versionId)
    const now = new Date().toISOString()
    await db.runTransaction(async transaction => {
        const previous = await transaction.get(game)
        if (gameId && (!previous.exists || previous.data().hostId !== hostId)) throw new Error('Unauthorized')
        const data = { ...normalized, hostId, updatedAt: now }
        transaction.create(version, { ...data, versionId, createdAt: now })
        transaction.set(game, { ...data, publishedVersionId: versionId,
            status: previous.exists ? previous.data().status || 'WAITING' : 'WAITING',
            createdAt: previous.exists ? previous.data().createdAt || now : now }, { merge: true })
    })
    return game.id
}

async function loadPublishedGame(db, gameId) {
    const ref = db.collection('games').doc(gameId)
    const game = await ref.get()
    if (!game.exists) return null
    const data = game.data()
    // Existing quizzes remain readable without a bulk write/migration.
    if (!data.publishedVersionId) return { ...data, id: game.id, versionId: null }
    const published = await ref.collection('versions').doc(data.publishedVersionId).get()
    if (!published.exists || published.data().hostId !== data.hostId) throw new Error('Published version is missing or invalid')
    return { ...published.data(), id: game.id, hostId: data.hostId, versionId: data.publishedVersionId }
}
module.exports = { publishPresentation, loadPublishedGame }
