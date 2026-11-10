const test = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
test('custom dev server with unset NODE_ENV uses an output directory separate from builds', () => {
    const config = mode => execFileSync(process.execPath, ['--input-type=module', '-e', `process.env.NODE_ENV = ${JSON.stringify(mode)}; const {default: config} = await import('./next.config.mjs'); console.log(config.distDir)`], { encoding: 'utf8' }).trim()
    assert.equal(config(''), '.next-dev')
    assert.equal(config('development'), '.next-dev')
    assert.equal(config('production'), '.next')
})

test('custom Socket.IO server uses a normal production build rather than an incompatible standalone server', async () => {
    const { default: config } = await import('../next.config.mjs')
    assert.notEqual(config.output, 'standalone')
})

test('integration builds can use an isolated output directory', async () => {
    const previous = process.env.QUESTIFY_BUILD_DIR
    process.env.QUESTIFY_BUILD_DIR = '.next-e2e'
    try {
        const { default: config } = await import('../next.config.mjs?isolated-build')
        assert.equal(config.distDir, '.next-e2e')
    } finally { if (previous === undefined) delete process.env.QUESTIFY_BUILD_DIR; else process.env.QUESTIFY_BUILD_DIR = previous }
})
