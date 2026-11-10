function editorQuestion(q, index) {
    const answers = JSON.parse(q.options)
    return { id: q.id || String(index + 1), text: q.text, body: q.body || '', answers: Array.from({ length: 4 }, (_, i) => answers[i] || ''),
        timeLimit: `${q.timeLimit} seconds`, points: q.points || 'Standard',
        answerType: 'Single select', questionType: q.type || 'MULTIPLE_CHOICE',
        selectedAnswers: [q.correct], mediaUrl: q.mediaUrl || '' }
}
function quizQuestion(q) {
    return { id: q.id, text: q.text, body: q.body || '', answers: q.answers, correctAnswer: q.selectedAnswers[0] ?? -1,
        timeLimit: q.timeLimit, type: q.questionType, points: q.points, mediaUrl: q.mediaUrl || '' }
}
function moveActivity(activities, id, direction) {
    const index = activities.findIndex(activity => activity.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= activities.length) return activities
    const reordered = [...activities]
    const [activity] = reordered.splice(index, 1)
    reordered.splice(target, 0, activity)
    return reordered
}
module.exports = { editorQuestion, quizQuestion, moveActivity }
