const http = require('node:http')
// Minimal local S3 transport fixture. Exercises the real SDK upload and signed
// media redirect; it does not implement S3 authorization or claim R2 parity.
async function startStorage() {
    const objects = new Map()
    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1:4569')
        const key = url.pathname
        if (!key.startsWith('/questify-e2e/media/')) { response.writeHead(404).end(); return }
        if (request.method === 'PUT') {
            const chunks = []
            for await (const chunk of request) chunks.push(chunk)
            objects.set(key, { bytes: Buffer.concat(chunks), type: request.headers['content-type'] })
            response.writeHead(200, { ETag: '"local-fixture"' }).end()
        } else if (request.method === 'GET' && url.searchParams.has('X-Amz-Signature') && objects.has(key)) {
            const object = objects.get(key)
            response.writeHead(200, { 'Content-Type': object.type, 'Content-Length': object.bytes.length }).end(object.bytes)
        } else response.writeHead(404).end()
    })
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4569, '127.0.0.1', resolve) })
    return { close: () => new Promise(resolve => server.close(resolve)) }
}
module.exports = { startStorage }
