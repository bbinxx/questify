const { ACTIVITIES } = require('./activities/registry')
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const MIME_EXTENSIONS = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
}
function validateUpload(file) {
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') return 'Choose a file'
    if (!MIME_EXTENSIONS[file.type]) return 'Choose a JPEG, PNG, WebP, GIF, MP4, WebM or MOV file'
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_UPLOAD_BYTES) return 'Files must be between 1 byte and 20 MB'
    return null
}
function mediaKey(segments) {
    if (!Array.isArray(segments) || segments.length !== 3 || segments[0] !== 'media') return null
    return segments.every(s => typeof s === 'string' && /^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(s) && s !== '..')
        ? segments.join('/') : null
}
function normalizeQuiz(title, questions) {
    if (typeof title !== 'string' || !title.trim() || title.length > 200) throw new Error('Title must contain 1–200 characters')
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 50) throw new Error('Add between 1 and 50 questions')
    const ids = new Set()
    return { schemaVersion: 1, title: title.trim(), questions: questions.map((q, idx) => {
        if (!q || typeof q.text !== 'string' || !q.text.trim() || q.text.length > 2000) throw new Error(`Question ${idx + 1} needs text (up to 2000 characters)`)
        const type = q.type || q.questionType || 'MULTIPLE_CHOICE'
        if (!Object.hasOwn(ACTIVITIES, type)) throw new Error('Invalid question type')
        const id = q.id ?? String(idx + 1)
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id) || ids.has(id)) throw new Error('Every activity needs a unique ID; duplicate or invalid ID found')
        ids.add(id)
        const mediaUrl = q.mediaUrl || ''
        if (typeof mediaUrl !== 'string' || mediaUrl.length > 2048 || (mediaUrl && !/^https:\/\//.test(mediaUrl) && !/^\/api\/media\/[A-Za-z0-9_./-]+$/.test(mediaUrl))) throw new Error('Invalid media URL')
        if (type === 'TEXT_SLIDE') {
            const body = q.body ?? ''
            if (typeof body !== 'string' || body.length > 8000) throw new Error('Slide body must contain at most 8000 characters')
            return { id, text: q.text.trim(), body, type, mediaUrl, options: '[]', correct: -1, timeLimit: 0, points: 'No points' }
        }
        let answers = typeof q.options === 'string' ? JSON.parse(q.options) : q.answers
        if (!Array.isArray(answers) || answers.some(a => typeof a !== 'string' || a.length > 500)) throw new Error('Invalid answers')
        answers = answers.map(a => a.trim())
        if (type === 'TYPE_ANSWER') answers = answers.slice(0, 1)
        else if (type === 'TRUE_FALSE') answers = answers.slice(0, 2)
        // Optional trailing answer slots are not playable choices.
        while (answers.length && !answers[answers.length - 1]) answers.pop()
        if (answers.length < (type === 'TYPE_ANSWER' ? 1 : 2) || answers.length > 4 || answers.some(a => !a)) throw new Error('Provide all required answers')
        const correct = type === 'TYPE_ANSWER' || type === 'POLL' ? 0 : (q.correct ?? q.correctAnswer)
        if (!Number.isInteger(correct) || correct < 0 || correct >= answers.length) throw new Error('Choose a valid correct answer')
        const timeLimit = typeof q.timeLimit === 'string' ? Number.parseInt(q.timeLimit, 10) : q.timeLimit
        if (!Number.isInteger(timeLimit) || timeLimit < 5 || timeLimit > 240) throw new Error('Time limit must be between 5 and 240 seconds')
        const points = q.points || 'Standard'
        if (!['Standard', 'No points', 'Double points'].includes(points)) throw new Error('Invalid scoring option')
        return { id, text: q.text.trim(), options: JSON.stringify(answers), correct, timeLimit, type, mediaUrl, points: type === 'POLL' ? 'No points' : points }
    }) }
}
function publicAnswers(question) {
    return question.type === 'TYPE_ANSWER' ? [] : question.answers.map(({ text, color, icon }) => ({ text, color, icon }))
}
module.exports = { MAX_UPLOAD_BYTES, MIME_EXTENSIONS, validateUpload, mediaKey, normalizeQuiz, publicAnswers }
