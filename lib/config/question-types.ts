/**
 * Central Configuration for Question Types
 * 
 * To add a new question type:
 * 1. Add the type to SlideType union
 * 2. Add configuration to QUESTION_TYPE_CONFIG
 * 3. Create component in components/presentations/question-types/
 * 4. That's it! The rest works automatically.
 */

export type SlideType =
    | 'choice'              // Unified choice (single or multiple based on settings)
    | 'word_cloud'
    | 'text'
    | 'question_only'
    | 'scale'
    | 'ranking'
    | 'qa'
    | 'quiz'
    | 'guess_number'

// Legacy type support (for backward compatibility)
export type LegacySlideType = 'single_choice' | 'multiple_choice'

export interface QuestionTypeConfig {
    // Display
    label: string
    description: string
    icon?: string

    // Behavior
    requiresOptions: boolean  // Does it need options array?
    allowsMultipleAnswers: boolean  // Can one user submit multiple times?

    // Response handling
    responseType: 'choice' | 'text' | 'number' | 'scale'
    aggregationType: 'count' | 'list' | 'average' | 'wordcloud'

    // Validation
    validateResponse?: (response: any, slide: any) => boolean

    // Processing
    processResponse?: (response: any, slide: any) => any
}

export const QUESTION_TYPE_CONFIG: Record<SlideType, QuestionTypeConfig> = {
    choice: {
        label: 'Choice Question',
        description: 'Single or multiple choice (based on settings)',
        icon: '☑',
        requiresOptions: true,
        allowsMultipleAnswers: false,
        responseType: 'choice',
        aggregationType: 'count',
        validateResponse: (response: any, slide: any) => {
            // Check if multiple answers allowed
            const allowMultiple = slide.settings?.allowMultiple ?? false

            if (allowMultiple) {
                return Array.isArray(response.value) &&
                    response.value.every((v: string) => slide.options?.includes(v))
            } else {
                return typeof response.value === 'string' &&
                    slide.options?.includes(response.value)
            }
        },
        processResponse: (response: any, slide: any) => {
            const allowMultiple = slide.settings?.allowMultiple ?? false

            if (allowMultiple) {
                return {
                    value: Array.isArray(response.value) ? response.value : [response.value]
                }
            } else {
                return { value: response.value }
            }
        }
    },

    word_cloud: {
        label: 'Word Cloud',
        description: 'Participants submit words/tags',
        icon: '☁',
        requiresOptions: false,
        allowsMultipleAnswers: false,
        responseType: 'text',
        aggregationType: 'wordcloud',
        validateResponse: (response) => {
            return typeof response.value === 'string' && response.value.trim().length > 0
        },
        processResponse: (response) => ({
            value: response.value.trim()
        })
    },

    text: {
        label: 'Open Text',
        description: 'Participants write free text',
        icon: '✎',
        requiresOptions: false,
        allowsMultipleAnswers: false,
        responseType: 'text',
        aggregationType: 'list',
        validateResponse: (response) => {
            return typeof response.value === 'string' && response.value.trim().length > 0
        },
        processResponse: (response) => ({
            value: response.value.trim()
        })
    },

    question_only: {
        label: 'Question Only',
        description: 'Display question without collecting responses',
        icon: '?',
        requiresOptions: false,
        allowsMultipleAnswers: false,
        responseType: 'text',
        aggregationType: 'count',
        validateResponse: () => false, // No responses allowed
    },

    scale: {
        label: 'Scale Rating',
        description: 'Participants rate on a scale',
        icon: '⚖',
        requiresOptions: false,
        allowsMultipleAnswers: false,
        responseType: 'number',
        aggregationType: 'average',
        validateResponse: (response, slide) => {
            const min = slide.settings?.minValue ?? 1
            const max = slide.settings?.maxValue ?? 5
            return typeof response.value === 'number' &&
                response.value >= min &&
                response.value <= max
        },
        processResponse: (response) => ({
            value: Number(response.value)
        })
    },

    ranking: {
        label: 'Ranking',
        description: 'Participants rank options in order',
        icon: '↕',
        requiresOptions: true,
        allowsMultipleAnswers: false,
        responseType: 'choice',
        aggregationType: 'list',
        validateResponse: (response, slide) => {
            return Array.isArray(response.value) &&
                response.value.length === slide.options?.length
        },
        processResponse: (response) => ({
            value: response.value
        })
    },

    qa: {
        label: 'Q&A',
        description: 'Participants ask questions',
        icon: '💬',
        requiresOptions: false,
        allowsMultipleAnswers: true,
        responseType: 'text',
        aggregationType: 'list',
        validateResponse: (response) => {
            return typeof response.value === 'string' && response.value.trim().length > 0
        },
        processResponse: (response) => ({
            value: response.value.trim()
        })
    },

    quiz: {
        label: 'Quiz',
        description: 'Question with correct answer',
        icon: '🎯',
        requiresOptions: true,
        allowsMultipleAnswers: false,
        responseType: 'choice',
        aggregationType: 'count',
        validateResponse: (response, slide) => {
            return typeof response.value === 'string' &&
                slide.options?.includes(response.value)
        },
        processResponse: (response, slide) => ({
            value: response.value,
            isCorrect: response.value === slide.correctAnswer
        })
    },

    guess_number: {
        label: 'Guess Number',
        description: 'Participants guess a number',
        icon: '🔢',
        requiresOptions: false,
        allowsMultipleAnswers: false,
        responseType: 'number',
        aggregationType: 'average',
        validateResponse: (response, slide) => {
            const min = slide.settings?.minValue ?? 0
            const max = slide.settings?.maxValue ?? 100
            return typeof response.value === 'number' &&
                response.value >= min &&
                response.value <= max
        },
        processResponse: (response) => ({
            value: Number(response.value)
        })
    }
}

/**
 * Helper functions
 */

export function getQuestionTypeConfig(type: SlideType): QuestionTypeConfig {
    return QUESTION_TYPE_CONFIG[type]
}

export function validateQuestionResponse(
    type: SlideType,
    response: any,
    slide: any
): boolean {
    const config = QUESTION_TYPE_CONFIG[type]
    if (!config.validateResponse) return true
    return config.validateResponse(response, slide)
}

export function processQuestionResponse(
    type: SlideType,
    response: any,
    slide: any
): any {
    const config = QUESTION_TYPE_CONFIG[type]
    if (!config.processResponse) return response
    return config.processResponse(response, slide)
}

export function shouldCountAsVote(type: SlideType): boolean {
    const config = QUESTION_TYPE_CONFIG[type]
    return config.aggregationType === 'count' || config.aggregationType === 'wordcloud'
}

export function isChoiceBasedQuestion(type: SlideType): boolean {
    return QUESTION_TYPE_CONFIG[type].responseType === 'choice'
}

export function isTextBasedQuestion(type: SlideType): boolean {
    return QUESTION_TYPE_CONFIG[type].responseType === 'text'
}

export function isNumberBasedQuestion(type: SlideType): boolean {
    return QUESTION_TYPE_CONFIG[type].responseType === 'number'
}
