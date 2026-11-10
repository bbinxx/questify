const test = require('node:test')
const assert = require('node:assert/strict')
const fakeFirestore = require('./fake-firestore.cjs')
const { publishPresentation, loadPublishedGame } = require('../lib/presentations.js')
const questions = [{ id: 'first', text: 'Question', options: '["A","B"]', correct: 0, timeLimit: 20, type: 'MULTIPLE_CHOICE', mediaUrl: '', points: 'Standard' }]

test('new publication uses the real Firestore document-reference contract without any network writes', async () => {
    const { Firestore } = require('firebase-admin/firestore')
    const real = new Firestore({ projectId: 'offline-contract-test' })
    let writes = 0
    const db = {
        collection: path => real.collection(path),
        runTransaction: async task => task({ get: async () => ({ exists: false }), create() { writes++ }, set() { writes++ } }),
    }
    const id = await publishPresentation(db, { hostId: 'host', title: 'New', questions })
    assert.equal(typeof id, 'string')
    assert.equal(writes, 2)
})

test('publication creates immutable versions atomically and active snapshots retain old content', async () => {
    const db = fakeFirestore()
    const id = await publishPresentation(db, { hostId: 'host', title: 'First', questions })
    const first = await loadPublishedGame(db, id)
    await publishPresentation(db, { gameId: id, hostId: 'host', title: 'Changed', questions: [{ ...questions[0], text: 'Changed question' }] })
    const latest = await loadPublishedGame(db, id)
    assert.notEqual(first.versionId, latest.versionId)
    assert.equal(first.questions[0].text, 'Question')
    assert.equal(db.records.get(`games/${id}/versions/${first.versionId}`).title, 'First')
    assert.equal(latest.title, 'Changed')
})
test('foreign-host publication leaves both content and versions untouched', async () => {
    const db = fakeFirestore()
    const id = await publishPresentation(db, { hostId: 'host', title: 'Private', questions })
    const before = JSON.stringify([...db.records])
    await assert.rejects(publishPresentation(db, { gameId: id, hostId: 'attacker', title: 'Attack', questions }), /Unauthorized/)
    assert.equal(JSON.stringify([...db.records]), before)
})
test('legacy quizzes stay readable; broken published references fail explicitly', async () => {
    const db = fakeFirestore()
    db.records.set('games/legacy', { hostId: 'host', title: 'Legacy', questions })
    assert.equal((await loadPublishedGame(db, 'legacy')).questions[0].text, 'Question')
    db.records.set('games/broken', { hostId: 'host', publishedVersionId: 'missing' })
    await assert.rejects(loadPublishedGame(db, 'broken'), /version/i)
    assert.equal(await loadPublishedGame(db, 'absent'), null)
})
