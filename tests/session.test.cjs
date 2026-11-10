const test = require('node:test')
const assert = require('node:assert/strict')
const { createSessionToken, verifySessionToken } = require('../lib/session-token.js')
const secret = 'test-only-session-secret-with-at-least-32-bytes'
test('session accepts signed identity and rejects tampering, expiration and missing configuration', () => {
    const token = createSessionToken('host', secret, 1000)
    assert.equal(verifySessionToken(token, secret, 1001), 'host')
    assert.equal(verifySessionToken(token + 'x', secret, 1001), null)
    assert.equal(verifySessionToken(token, secret, 1000 + 604801), null)
    assert.equal(verifySessionToken('host', secret), null)
    assert.equal(verifySessionToken(token, undefined), null)
    assert.throws(() => createSessionToken('host', 'short'))
})
