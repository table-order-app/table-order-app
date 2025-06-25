import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Database connection configuration
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create a PostgreSQL pool with JST timezone
const pool = new Pool({
  connectionString,
  options: '-c timezone=Asia/Tokyo',
})

// Create a Drizzle client
export const db = drizzle(pool, { schema })

// Set timezone for all connections in this pool
pool.on('connect', (client) => {
  client.query('SET timezone = "Asia/Tokyo"')
})

// Export the pool for direct queries if needed
export { pool }
