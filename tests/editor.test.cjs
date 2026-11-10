const test = require('node:test')
const assert = require('node:assert/strict')
const { editorQuestion, quizQuestion } = require('../lib/editor.js')
test('editing preserves typed, poll and true/false types, points and media', () => {
    for (const type of ['TYPE_ANSWER', 'POLL', 'TRUE_FALSE']) {
        const stored = { id: '1', text: 'Question', options: '["Yes","No"]', correct: 0, timeLimit: 20, type, points: 'Double points', mediaUrl: '/api/media/media/host/image.png' }
        const saved = quizQuestion(editorQuestion(stored, 0))
        assert.equal(saved.type, type)
        assert.equal(saved.points, 'Double points')
        assert.equal(saved.mediaUrl, stored.mediaUrl)
    }
})

test('short stored answer arrays retain four editable slots', () => {
    const question = editorQuestion({ text: 'Q', options: '["A","B"]', correct: 0, timeLimit: 20 }, 0)
    assert.deepEqual(question.answers, ['A', 'B', '', ''])
})

test('reordering retains activity identity and never mutates the source list', () => {
    const { moveActivity } = require('../lib/editor.js')
    const source = [{ id: 'intro' }, { id: 'quiz' }, { id: 'closing' }]
    const moved = moveActivity(source, 'quiz', -1)
    assert.deepEqual(moved.map(q => q.id), ['quiz', 'intro', 'closing'])
    assert.deepEqual(source.map(q => q.id), ['intro', 'quiz', 'closing'])
    assert.equal(moved[0], source[1])
    assert.deepEqual(moveActivity(source, 'intro', -1), source)
})
