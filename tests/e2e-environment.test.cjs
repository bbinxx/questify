const test = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./load-ts.cjs')
const { environment } = require('./e2e/environment.cjs')

test('integration environment cannot inherit cloud credentials or point at a live project', () => {
    const env = environment({ PATH: '/bin', FIREBASE_SERVICE_ACCOUNT: 'production-secret', GOOGLE_APPLICATION_CREDENTIALS: '/private/key', R2_ENDPOINT: 'https://live.example', NODE_OPTIONS: '--require /unsafe' })
    assert.equal(env.FIREBASE_SERVICE_ACCOUNT, '')
    assert.equal(env.GOOGLE_APPLICATION_CREDENTIALS, '')
    assert.equal(env.GCLOUD_PROJECT, 'demo-questify-e2e')
    assert.equal(env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8088')
    assert.equal(env.R2_ENDPOINT, 'http://127.0.0.1:4569')
    assert.equal(env.NODE_OPTIONS, undefined)
})
test('storage client supports an isolated S3-compatible endpoint and path-style URLs', async () => {
    const previous = process.env.R2_ENDPOINT
    process.env.R2_ENDPOINT = 'http://127.0.0.1:4569'
    try {
        const { r2Client } = loadTs('lib/r2.ts')
        const endpoint = await r2Client.config.endpoint()
        assert.equal(endpoint.hostname, '127.0.0.1')
        assert.equal(endpoint.port, 4569)
        assert.equal(r2Client.config.forcePathStyle, true)
        r2Client.destroy()
    } finally { if (previous === undefined) delete process.env.R2_ENDPOINT; else process.env.R2_ENDPOINT = previous }
})

test('storage readiness requires credentials and a bucket before signing or uploading', () => {
    const names = ['R2_ENDPOINT', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'CLOUDFLARE_R2_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME']
    const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))
    try {
        for (const name of names) process.env[name] = ''
        process.env.R2_BUCKET_NAME = 'configured-bucket'
        let module = loadTs('lib/r2.ts')
        assert.equal(module.r2Configured, false)
        module.r2Client.destroy()
        Object.assign(process.env, { R2_ENDPOINT: 'http://127.0.0.1:4569', R2_ACCESS_KEY_ID: 'local', R2_SECRET_ACCESS_KEY: 'local' })
        module = loadTs('lib/r2.ts')
        assert.equal(module.r2Configured, true)
        module.r2Client.destroy()
    } finally { for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name] } }
})
