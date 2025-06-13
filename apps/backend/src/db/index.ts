import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 'postgres://itouharuki@localhost:5432/accorto'

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
})

// Create a Drizzle client
export const db = drizzle(pool, { schema })

// Export the pool for direct queries if needed
export { pool }
