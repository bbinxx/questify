const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeQuiz } = require('../lib/validation.js')
const { editorQuestion, quizQuestion } = require('../lib/editor.js')

const quiz = { id: 'quiz-1', text: 'Question', answers: ['A', 'B'], correctAnswer: 0, timeLimit: 20 }
const slide = { id: 'slide-1', type: 'TEXT_SLIDE', text: 'Welcome', body: 'First line\nSecond line' }

test('a mixed deck normalizes content slides without answer or timer requirements', () => {
    const data = normalizeQuiz('Mixed deck', [slide, quiz])
    assert.equal(data.schemaVersion, 1)
    assert.equal(data.questions[0].body, slide.body)
    assert.equal(data.questions[0].type, 'TEXT_SLIDE')
    assert.equal(data.questions[0].options, '[]')
    assert.equal(data.questions[1].id, 'quiz-1')
})
test('normalization preserves activity identity and rejects duplicates', () => {
    assert.equal(normalizeQuiz('Deck', [quiz]).questions[0].id, quiz.id)
    assert.throws(() => normalizeQuiz('Deck', [quiz, { ...quiz }]), /unique|duplicate/i)
})
test('text slides reject unbounded bodies and survive an editor round trip', () => {
    assert.throws(() => normalizeQuiz('Deck', [{ ...slide, body: 'x'.repeat(8001) }]), /body|8000/i)
    const stored = normalizeQuiz('Deck', [slide]).questions[0]
    const saved = quizQuestion(editorQuestion(stored, 0))
    assert.equal(saved.id, slide.id)
    assert.equal(saved.body, slide.body)
    assert.equal(saved.type, 'TEXT_SLIDE')
})
test('registry distinguishes content and polling from scored activities', () => {
    const { ACTIVITIES } = require('../lib/activities/registry.js')
    assert.equal(ACTIVITIES.TEXT_SLIDE.kind, 'content')
    assert.equal(ACTIVITIES.TEXT_SLIDE.hasResponse, false)
    assert.equal(ACTIVITIES.POLL.scored, false)
    assert.equal(ACTIVITIES.MULTIPLE_CHOICE.scored, true)
})
