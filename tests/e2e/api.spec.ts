import { test, expect, signup, choice, createDeck, slide } from './helpers'

test('API authentication, validation, ownership, publication and CRUD', async ({ page, browser, request }) => {
    for (const method of ['get', 'post', 'put', 'delete'] as const) {
        const response = await request[method]('/api/quiz')
        expect(response.status()).toBe(401)
    }
    expect((await request.post('/api/sessions', { data: {} })).status()).toBe(401)
    await signup(page)
    const { gameId } = await createDeck(page)
    const first = await (await page.request.get(`/api/quiz?id=${gameId}`)).json()
    expect(first.questions).toHaveLength(1)
    expect(first.versionId).toBeTruthy()
    expect((await page.request.post('/api/quiz', { data: { title: '', questions: [choice()] } })).status()).toBe(400)
    expect((await page.request.post('/api/quiz', { data: { title: 'Invalid', questions: [{ ...choice(), correct: 9 }] } })).status()).toBe(400)
    expect((await page.request.post('/api/quiz', { data: '{bad', headers: { 'content-type': 'application/json' } })).status()).toBe(400)
    expect((await page.request.post('/api/sessions', { data: { score: 999999 } })).status()).toBe(405)
    expect((await page.request.get('/api/media/invalid', { maxRedirects: 0 })).status()).toBe(400)
    const other = await browser.newContext({ baseURL: 'http://127.0.0.1:3210' })
    try {
        await signup(await other.newPage())
        expect((await other.request.get(`/api/quiz?id=${gameId}`)).status()).toBe(404)
        expect((await other.request.put('/api/quiz', { data: { id: gameId, title: 'Stolen', questions: [choice()] } })).status()).toBe(400)
        expect((await other.request.delete(`/api/quiz?id=${gameId}`)).status()).toBe(400)
    } finally { await other.close() }
    const updated = await page.request.put('/api/quiz', { data: { id: gameId, title: 'New publication', questions: [slide()] } })
    expect(updated.status()).toBe(200)
    const second = await (await page.request.get(`/api/quiz?id=${gameId}`)).json()
    expect(second.versionId).not.toBe(first.versionId)
    expect(second.questions[0].type).toBe('TEXT_SLIDE')
    expect((await page.request.delete(`/api/quiz?id=${gameId}`)).status()).toBe(200)
    expect((await page.request.get(`/api/quiz?id=${gameId}`)).status()).toBe(404)
    await page.context().clearCookies()
    await page.context().addCookies([{ name: 'questify_session', value: 'forged.user.cookie', domain: '127.0.0.1', path: '/' }])
    expect((await page.request.get('/api/quiz')).status()).toBe(401)
})
