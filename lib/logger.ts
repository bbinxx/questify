import fs from 'fs'
import path from 'path'

const LOG_DIR = path.join(process.cwd(), 'logs')
const SOCKET_LOG_FILE = path.join(LOG_DIR, 'socket.log')
const APP_LOG_FILE = path.join(LOG_DIR, 'app.log')
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log')
const DEBUG_LOG_FILE = path.join(LOG_DIR, 'debug.log')

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
}

// Log deduplication cache
const logCache = new Map<string, { timestamp: number; count: number }>()
const DEDUP_WINDOW_MS = 2000 // 2 seconds window for deduplication

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type LogType = 'SOCKET' | 'APP' | 'ERROR' | 'DEBUG'

interface LogEntry {
    timestamp: string
    level: LogLevel
    type: LogType
    message: string
    data?: any
    stack?: string
    socketId?: string
    userId?: string
    event?: string
}

function formatLogEntry(entry: LogEntry): string {
    const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level}]`,
        `[${entry.type}]`,
    ]

    if (entry.socketId) parts.push(`[Socket:${entry.socketId}]`)
    if (entry.userId) parts.push(`[User:${entry.userId}]`)
    if (entry.event) parts.push(`[Event:${entry.event}]`)

    parts.push(entry.message)

    if (entry.data) {
        parts.push(
            '\n' +
            JSON.stringify(
                entry.data,
                (key, value) => {
                    // Handle circular references
                    if (typeof value === 'object' && value !== null) {
                        if (value instanceof Map) {
                            return Object.fromEntries(value)
                        }
                        if (value instanceof Set) {
                            return Array.from(value)
                        }
                    }
                    return value
                },
                2
            )
        )
    }

    if (entry.stack) {
        parts.push('\nStack:\n' + entry.stack)
    }

    return parts.join(' ')
}

function writeToFile(filePath: string, content: string) {
    try {
        fs.appendFileSync(filePath, content + '\n', 'utf8')
    } catch (err) {
        console.error('Failed to write to log file:', err)
    }
}

function shouldLogMessage(entry: LogEntry): boolean {
    // Skip deduplication for errors - always log them
    if (entry.level === 'ERROR') {
        return true
    }

    // Create cache key from entry (excluding timestamp)
    const cacheKey = `${entry.level}:${entry.type}:${entry.message}:${entry.socketId || ''}:${entry.event || ''}`
    const now = Date.now()
    const cached = logCache.get(cacheKey)

    if (cached && now - cached.timestamp < DEDUP_WINDOW_MS) {
        // Same message within window - increment count but don't log
        cached.count++
        return false
    }

    // New message or outside window
    if (cached && cached.count > 1) {
        // Write suppressed count for the previous batch
        const suppressMsg = `[${new Date().toISOString()}] [INFO] [${entry.type}] Suppressed ${cached.count - 1} duplicate log(s) for: ${entry.message}`
        writeToFile(
            entry.type === 'SOCKET' ? SOCKET_LOG_FILE :
                entry.type === 'DEBUG' ? DEBUG_LOG_FILE : APP_LOG_FILE,
            suppressMsg
        )
    }

    logCache.set(cacheKey, { timestamp: now, count: 1 })
    return true
}

// Clean old entries from cache periodically
setInterval(() => {
    const now = Date.now()
    for (const [key, value] of logCache.entries()) {
        if (now - value.timestamp > DEDUP_WINDOW_MS * 2) {
            logCache.delete(key)
        }
    }
}, DEDUP_WINDOW_MS * 2)

class Logger {
    private writeLog(entry: LogEntry) {
        // Check if we should log this message
        if (!shouldLogMessage(entry)) {
            return
        }

        const formatted = formatLogEntry(entry)

        // Write to type-specific file
        if (entry.type === 'SOCKET') {
            writeToFile(SOCKET_LOG_FILE, formatted)
        } else if (entry.type === 'ERROR') {
            writeToFile(ERROR_LOG_FILE, formatted)
        } else if (entry.type === 'DEBUG') {
            writeToFile(DEBUG_LOG_FILE, formatted)
        } else {
            writeToFile(APP_LOG_FILE, formatted)
        }

        // Always write errors to error log
        if (entry.level === 'ERROR') {
            writeToFile(ERROR_LOG_FILE, formatted)
        }
    }

    debug(message: string, data?: any) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'DEBUG',
            type: 'DEBUG',
            message,
            data,
        })
    }

    info(message: string, data?: any) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            type: 'APP',
            message,
            data,
        })
    }

    warn(message: string, data?: any) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            type: 'APP',
            message,
            data,
        })
    }

    error(message: string, error?: any) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            type: 'ERROR',
            message,
            data: error?.message || error,
            stack: error?.stack,
        })
    }

    // Socket-specific logging
    socketDebug(message: string, data?: any, socketId?: string, userId?: string) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'DEBUG',
            type: 'SOCKET',
            message,
            data,
            socketId,
            userId,
        })
    }

    socketInfo(message: string, data?: any, socketId?: string, userId?: string) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            type: 'SOCKET',
            message,
            data,
            socketId,
            userId,
        })
    }

    socketEvent(
        event: string,
        message: string,
        data?: any,
        socketId?: string,
        userId?: string
    ) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            type: 'SOCKET',
            event,
            message,
            data,
            socketId,
            userId,
        })
    }

    socketError(
        message: string,
        error?: any,
        socketId?: string,
        userId?: string
    ) {
        this.writeLog({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            type: 'SOCKET',
            message,
            data: error?.message || error,
            stack: error?.stack,
            socketId,
            userId,
        })
    }
}

export const logger = new Logger()
