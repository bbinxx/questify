const ACTIVITIES = Object.freeze({
    MULTIPLE_CHOICE: { label: 'Multiple choice', kind: 'quiz', scored: true, hasResponse: true },
    TRUE_FALSE: { label: 'True / false', kind: 'quiz', scored: true, hasResponse: true },
    TYPE_ANSWER: { label: 'Type answer', kind: 'quiz', scored: true, hasResponse: true },
    POLL: { label: 'Poll (no points)', kind: 'poll', scored: false, hasResponse: true },
    TEXT_SLIDE: { label: 'Text slide', kind: 'content', scored: false, hasResponse: false },
})
module.exports = { ACTIVITIES }
