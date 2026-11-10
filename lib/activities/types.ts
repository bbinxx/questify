export type ActivityType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TYPE_ANSWER' | 'POLL' | 'TEXT_SLIDE'

interface ActivityBase {
    id: string
    text: string
    mediaUrl: string
}
export interface TextActivity extends ActivityBase {
    type: 'TEXT_SLIDE'
    body: string
    options: '[]'
    correct: -1
    timeLimit: 0
    points: 'No points'
}
export interface ResponseActivity extends ActivityBase {
    type: Exclude<ActivityType, 'TEXT_SLIDE'>
    options: string
    correct: number
    timeLimit: number
    points: 'Standard' | 'No points' | 'Double points'
}
export type Activity = TextActivity | ResponseActivity
export interface Presentation {
    schemaVersion: 1
    title: string
    questions: Activity[]
}
export interface ContentSnapshot {
    state: 'CONTENT'
    activityId: string
    questionType: 'TEXT_SLIDE'
    questionText: string
    body: string
    mediaUrl: string
    duration: 0
    qIndex: number
    totalQ: number
}
