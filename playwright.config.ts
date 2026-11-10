import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 2,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: { baseURL: 'http://127.0.0.1:3210', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure', reducedMotion: 'reduce' },
    projects: [
        { name: 'chromium', testIgnore: '**/api.spec.ts', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', testIgnore: '**/api.spec.ts', use: { ...devices['Desktop Firefox'] } },
        { name: 'mobile-chromium', testIgnore: '**/api.spec.ts', use: { ...devices['Pixel 7'] } },
        { name: 'api', testMatch: '**/api.spec.ts', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'node tests/e2e/start-stack.cjs',
        url: 'http://127.0.0.1:3210/login',
        reuseExistingServer: false,
        timeout: 240_000,
        stdout: 'pipe', stderr: 'pipe',
        gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    },
})
