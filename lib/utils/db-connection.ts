// Database Connection Verification and Health Check

import { createClient } from '@/lib/supabase/client'
import { DATABASE_CONFIG } from '@/lib/config/app-config'
import { DatabaseError, logger, retryOperation } from '@/lib/utils/error-handler'

export interface ConnectionStatus {
    connected: boolean
    message: string
    timestamp: Date
    latency?: number
}

export class DatabaseConnection {
    private static instance: DatabaseConnection
    private supabase = createClient()
    private isConnected: boolean = false
    private lastCheck: Date | null = null

    private constructor() { }

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection()
        }
        return DatabaseConnection.instance
    }

    async verifyConnection(): Promise<ConnectionStatus> {
        const startTime = Date.now()

        try {
            // Check environment variables
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                throw new DatabaseError('NEXT_PUBLIC_SUPABASE_URL is not configured')
            }

            if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                throw new DatabaseError('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
            }

            // Try to ping database with a simple query
            const { data, error } = await Promise.race([
                this.supabase.from('presentations').select('id').limit(1),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), DATABASE_CONFIG.timeout)
                )
            ])

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
                console.error('[SERVER] Database query failed:', error.message);
                console.error('[SERVER] Full error details:', JSON.stringify(error, null, 2));
                throw new DatabaseError(`Database query failed: ${error.message}`)
            }

            const latency = Date.now() - startTime
            this.isConnected = true
            this.lastCheck = new Date()

            logger.success(`Database connected (${latency}ms)`)

            return {
                connected: true,
                message: 'Database connected successfully',
                timestamp: new Date(),
                latency
            }
        } catch (error) {
            this.isConnected = false
            const message = error instanceof Error ? error.message : 'Unknown database error'

            logger.error('Database connection failed', error)

            return {
                connected: false,
                message,
                timestamp: new Date()
            }
        }
    }

    async verifyWithRetry(maxAttempts: number = 3): Promise<ConnectionStatus> {
        return await retryOperation(
            () => this.verifyConnection(),
            maxAttempts,
            DATABASE_CONFIG.retryDelay
        )
    }

    getConnectionStatus(): boolean {
        return this.isConnected
    }

    getLastCheckTime(): Date | null {
        return this.lastCheck
    }

    // Health check for presentations table
    async checkPresentationsTable(): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('presentations')
                .select('id')
                .limit(1)

            if (error && error.code !== 'PGRST116') {
                logger.error('Presentations table check failed', error)
                return false
            }

            logger.info('Presentations table is accessible')
            return true
        } catch (error) {
            logger.error('Presentations table check error', error)
            return false
        }
    }

    // Health check for slides table
    async checkSlidesTable(): Promise<boolean> {
        try {
            const { error } = await this.supabase
                .from('slides')
                .select('id')
                .limit(1)

            if (error && error.code !== 'PGRST116') {
                logger.error('Slides table check failed', error)
                return false
            }

            logger.info('Slides table is accessible')
            return true
        } catch (error) {
            logger.error('Slides table check error', error)
            return false
        }
    }

    // Comprehensive health check
    async healthCheck(): Promise<{
        overall: boolean
        checks: {
            connection: boolean
            presentations: boolean
            slides: boolean
        }
        timestamp: Date
    }> {
        const connectionStatus = await this.verifyConnection()
        const presentationsOk = await this.checkPresentationsTable()
        const slidesOk = await this.checkSlidesTable()

        const overall = connectionStatus.connected && presentationsOk && slidesOk

        return {
            overall,
            checks: {
                connection: connectionStatus.connected,
                presentations: presentationsOk,
                slides: slidesOk
            },
            timestamp: new Date()
        }
    }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance()

// Helper function for components
export async function ensureDatabaseConnection(): Promise<void> {
    const status = await dbConnection.verifyConnection()

    if (!status.connected) {
        throw new DatabaseError(status.message)
    }
}

// Check credentials helper
export function checkCredentials(): { valid: boolean; missing: string[] } {
    const missing: string[] = []

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        missing.push('NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    return {
        valid: missing.length === 0,
        missing
    }
}
