import { test as base, expect, type Page, type Browser, type TestInfo } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWoQAAAAASUVORK5CYII=', 'base64')
export const test = base.extend<{ runtimeChecks: void }>({
    runtimeChecks: [async ({ context }, use) => {
        const errors: string[] = []
        context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
        // The QR image is the only third-party UI request. Keep tests offline.
        await context.route('https://api.qrserver.com/**', route => route.fulfill({ contentType: 'image/png', body: png }))
        await use()
        expect(errors, 'uncaught browser exceptions').toEqual([])
    }, { auto: true }],
})
export { expect }
export async function signup(page: Page) {
    const username = `pw-${randomUUID()}@test.invalid`
    const password = 'playwright-local-password-2026'
    await page.goto('/signup')
    await page.getByLabel('Username or email').fill(username)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    return { username, password }
}
export const choice = (text = 'Which answer is correct?') => ({ text, type: 'MULTIPLE_CHOICE', answers: ['Correct', 'Wrong'], correct: 0, timeLimit: 20, points: 'Standard' })
export const slide = (text = 'Welcome') => ({ text, type: 'TEXT_SLIDE', body: 'Read this slide together.' })
export async function createDeck(page: Page, questions: Array<ReturnType<typeof choice> | ReturnType<typeof slide>> = [choice()], title = `Test deck ${randomUUID()}`) {
    const response = await page.request.post('/api/quiz', { data: { title, questions } })
    expect(response.status(), await response.text()).toBe(201)
    const { gameId } = await response.json()
    return { gameId: gameId as string, title }
}
export async function activityType(page: Page, type: string) {
    const mobile = (page.viewportSize()?.width || 1280) < 1024
    if (mobile) await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByLabel('Activity type').selectOption(type)
    if (mobile) await page.getByRole('button', { name: 'Close settings', exact: true }).click()
}
export async function publish(page: Page) {
    await page.getByRole('button', { name: 'Save and publish presentation', exact: true }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/dashboard$/)
}

export async function guestContext(browser: Browser, info: TestInfo) {
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = info.project.use
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3210', viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, reducedMotion: 'reduce' })
    await context.route('https://api.qrserver.com/**', route => route.fulfill({ contentType: 'image/png', body: png }))
    return context
}
