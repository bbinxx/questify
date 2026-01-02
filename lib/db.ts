import postgres from 'postgres';

// Database connection for server-side operations
const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create postgres client
export const sql = postgres(connectionString, {
    max: 10, // Maximum number of connections
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
});

export default sql;
