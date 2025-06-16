import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 'postgres://itouharuki@localhost:5432/accorto';

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString,
});

// Run migrations
const main = async () => {
  console.log('Running migrations...');
  
  const db = drizzle(pool);
  
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  
  console.log('Migrations completed successfully');
  
  await pool.end();
};

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
