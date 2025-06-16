import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Database connection configuration
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
})

// Create a Drizzle client
export const db = drizzle(pool, { schema })

// Export the pool for direct queries if needed
export { pool }
