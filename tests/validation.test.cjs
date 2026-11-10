const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeQuiz, validateUpload, mediaKey, publicAnswers } = require('../lib/validation.js')
test('quiz normalization preserves type and rejects invalid questions', () => {
    const q = { text: 'Question', answers: ['Yes', 'No'], correctAnswer: 1, timeLimit: '20 seconds', type: 'TRUE_FALSE' }
    assert.equal(normalizeQuiz('Title', [q]).questions[0].type, 'TRUE_FALSE')
    assert.throws(() => normalizeQuiz('Title', [{ ...q, correctAnswer: 5 }]))
    assert.throws(() => normalizeQuiz('Title', [{ ...q, timeLimit: -1 }]))
    assert.throws(() => normalizeQuiz('Title', [{ ...q, text: '' }]))
    assert.throws(() => normalizeQuiz('Title', [{ ...q, answers: ['yes', ''] }]))
})
test('media rejects active content, oversized uploads and traversal but accepts nested upload keys', () => {
    assert.equal(validateUpload({ size: 20, type: 'image/png', arrayBuffer() {} }), null)
    assert.ok(validateUpload({ size: 20, type: 'image/svg+xml', arrayBuffer() {} }))
    assert.ok(validateUpload({ size: 21 * 1024 * 1024, type: 'video/mp4', arrayBuffer() {} }))
    assert.equal(mediaKey(['media', 'host', 'photo.png']), 'media/host/photo.png')
    assert.equal(mediaKey(['media', '..', 'secret']), null)
    assert.equal(mediaKey(['private', 'credentials']), null)
})
test('answer payloads do not disclose correct answers before results', () => {
    const answers = [{ text: 'secret', correct: true, color: 'bg-blue-500', icon: '△' }]
    assert.equal(publicAnswers({ type: 'TYPE_ANSWER', answers }).length, 0)
    assert.equal(publicAnswers({ type: 'MULTIPLE_CHOICE', answers })[0].correct, undefined)
})
