// Transactional disposable adapter: rejected transactions never mutate records.
module.exports = function fakeFirestore() {
    const records = new Map()
    let sequence = 0, tail = Promise.resolve()
    const clone = value => value === undefined ? undefined : structuredClone(value)
    const ref = path => ({
        id: path.split('/').at(-1), path,
        collection: name => collection(`${path}/${name}`),
        get: async () => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => clone(records.get(path)) }),
    })
    const collection = path => ({ doc(...args) {
        if (args.length && (typeof args[0] !== 'string' || !args[0])) throw new Error('Invalid document path; use doc() to generate an ID')
        return ref(`${path}/${args[0] || `generated-${++sequence}`}`)
    } })
    return { records, collection, runTransaction(task) {
        const pending = tail.then(async () => {
            const operations = []
            const result = await task({
                get: r => r.get(),
                create(r, value) { if (records.has(r.path)) throw new Error('already-exists'); operations.push([r.path, clone(value)]) },
                set(r, value, options) { operations.push([r.path, options?.merge ? { ...clone(records.get(r.path)), ...clone(value) } : clone(value)]) },
                update(r, value) { operations.push([r.path, { ...clone(records.get(r.path)), ...clone(value) }]) },
            })
            operations.forEach(([path, value]) => records.set(path, value))
            return result
        })
        tail = pending.catch(() => {})
        return pending
    } }
}
