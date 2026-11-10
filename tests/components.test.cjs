const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const loadTs = require('./load-ts.cjs')

test('content slides expose headings, preserve plain text and never interpret injected HTML', () => {
    const ContentSlide = loadTs('app/components/activities/ContentSlide.tsx', { '../game/QuestionMedia': () => null }).default
    const html = renderToStaticMarkup(React.createElement(ContentSlide, { title: 'Welcome', body: '<script>alert(1)</script>\nSecond line' }))
    assert.match(html, /aria-label="Presentation slide"/)
    assert.match(html, /<h1[^>]*>Welcome<\/h1>/)
    assert.match(html, /&lt;script&gt;/)
    assert.doesNotMatch(html, /<script>/)
    assert.match(html, /whitespace-pre-wrap/)
})

test('mixed editor offers text-slide creation, accessible reordering and publishing controls', () => {
    const Editor = loadTs('app/components/QuizEditor.tsx', {
        'next/navigation': { useRouter: () => ({ push() {} }) },
        '@/app/actions/quiz': {}, '@/lib/editor': require('../lib/editor'),
        '@/lib/activities/registry': require('../lib/activities/registry'),
        '@/lib/validation': require('../lib/validation'),
        '@/app/components/game/QuestionMedia': () => null,
    }).default
    const html = renderToStaticMarkup(React.createElement(Editor))
    assert.match(html, /value="TEXT_SLIDE"/)
    assert.match(html, /Move up/)
    assert.match(html, /Move down/)
    assert.match(html, /Save &amp; publish/)
    assert.match(html, /aria-label="Quiz title"/)
})

test('poll-only session reports show response totals without a false accuracy score or leaderboard', async () => {
    const Page = loadTs('app/dashboard/analytics/page.tsx', {
        '@/lib/db': { DatabaseService: {
            getUserById: async () => ({ username: 'Host' }),
            getHostSessions: async () => [{ id: 'report', roomCode: 'ABC123', startedAt: '2026-11-10T12:00:00Z', endedAt: '2026-11-10T12:01:00Z', players: [],
                stats: { totalQuestions: 0, global: { totalAnswered: 0, correctCount: 0 }, perQuestion: [{ activityId: 'poll', kind: 'poll', scored: false, text: 'Lunch?', totalAnswered: 2, correctCount: 0, options: ['A', 'B'], answerCounts: { 0: 1, 1: 1 } }] } }],
        } },
        '@/lib/session': { getSessionUserId: async () => 'host' },
        '@/app/actions/auth': { logout() {} },
        'next/navigation': {}, 'next/link': props => React.createElement('a', props),
    }).default
    const html = renderToStaticMarkup(await Page())
    assert.match(html, /Poll · unscored/)
    assert.match(html, /2 responses/)
    assert.doesNotMatch(html, />0%</)
    assert.doesNotMatch(html, /Leaderboard Snapshot/)
})
