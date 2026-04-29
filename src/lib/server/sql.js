import pg from 'pg';
import { env } from '$env/dynamic/private';

/** @type {pg.Pool | null} */
let pool = null;

export function getPool() {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!pool) {
    const ssl = url.includes('localhost') ? false : { rejectUnauthorized: false };
    pool = new pg.Pool({
      connectionString: url,
      max: 15,
      ssl
    });
  }
  return pool;
}
