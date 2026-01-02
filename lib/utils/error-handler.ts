// Error Handling Utilities

import { UI_TEXT } from '../config/app-config'

export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message)
        this.name = 'AppError'
        Error.captureStackTrace(this, this.constructor)
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, code: string = 'DB_ERROR') {
        super(message, code, 500)
        this.name = 'DatabaseError'
    }
}

export class ValidationError extends AppError {
    constructor(message: string, code: string = 'VALIDATION_ERROR') {
        super(message, code, 400)
        this.name = 'ValidationError'
    }
}

export class NetworkError extends AppError {
    constructor(message: string, code: string = 'NETWORK_ERROR') {
        super(message, code, 503)
        this.name = 'NetworkError'
    }
}

export const handleError = (error: unknown): string => {
    console.error('Error occurred:', error)

    if (error instanceof AppError) {
        return error.message
    }

    if (error instanceof Error) {
        // Network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
            return UI_TEXT.errors.network.offline
        }

        // Timeout errors
        if (error.message.includes('timeout')) {
            return UI_TEXT.errors.network.timeout
        }

        // Database errors
        if (error.message.includes('database') || error.message.includes('supabase')) {
            return UI_TEXT.errors.database.connection
        }

        return error.message
    }

    return 'An unexpected error occurred. Please try again.'
}

export const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    errorMessage?: string
): Promise<{ data: T | null; error: string | null }> => {
    try {
        const data = await fn()
        return { data, error: null }
    } catch (error) {
        const message = errorMessage || handleError(error)
        return { data: null, error: message }
    }
}

export const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error
            console.warn(`Attempt ${attempt} failed:`, error)

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt))
            }
        }
    }

    throw lastError || new Error('Operation failed after retries')
}

// Validation utilities
export const validatePresentationCode = (code: string): { valid: boolean; error?: string } => {
    if (!code || code.trim().length === 0) {
        return { valid: false, error: UI_TEXT.errors.validation.required }
    }

    if (code.length < 3) {
        return { valid: false, error: UI_TEXT.errors.validation.tooShort }
    }

    if (code.length > 8) {
        return { valid: false, error: UI_TEXT.errors.validation.tooLong }
    }

    return { valid: true }
}

// Logger utility
export const logger = {
    info: (message: string, data?: any) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[INFO] ${message}`, data || '')
        }
    },
    warn: (message: string, data?: any) => {
        console.warn(`[WARN] ${message}`, data || '')
    },
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error || '')
    },
    success: (message: string, data?: any) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[SUCCESS] ✓ ${message}`, data || '')
        }
    }
}
