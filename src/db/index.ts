import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL) {
      const isAwsOrSsl = 
        process.env.DATABASE_URL.includes('amazonaws.com') ||
        process.env.DATABASE_URL.includes('sslmode=require') ||
        process.env.SQL_SSL === 'true';

      global._postgresPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isAwsOrSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      const isAwsOrSsl = 
        (process.env.SQL_HOST && process.env.SQL_HOST.includes('amazonaws.com')) ||
        process.env.SQL_SSL === 'true';

      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: isAwsOrSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
