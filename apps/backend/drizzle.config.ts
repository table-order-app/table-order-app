import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://itouharuki@localhost:5432/accorto',
  },
} satisfies Config;
