import { getPool } from './sql.js';

/**
 * Postgres-backed sliding-window rate limit. Returns `{ allowed, attempts, retryAfterMs }`.
 *
 * Atomically upserts the key, resetting the window if it has elapsed and
 * incrementing attempts otherwise. Both the increment and the reset happen
 * in a single statement so two concurrent calls won't race.
 *
 * @param {string} key  Unique identifier (e.g. `login:<ip>`, `signup:<ip>`).
 * @param {number} max  Max attempts allowed within the window.
 * @param {number} windowMs  Window length in ms.
 */
export async function checkRateLimit(key, max, windowMs) {
	const pool = getPool();
	const r = await pool.query(
		`INSERT INTO rate_limits (key, attempts, window_start)
		 VALUES ($1, 1, now())
		 ON CONFLICT (key) DO UPDATE SET
		   attempts = CASE
		     WHEN EXTRACT(EPOCH FROM (now() - rate_limits.window_start)) * 1000 > $2
		       THEN 1
		     ELSE rate_limits.attempts + 1
		   END,
		   window_start = CASE
		     WHEN EXTRACT(EPOCH FROM (now() - rate_limits.window_start)) * 1000 > $2
		       THEN now()
		     ELSE rate_limits.window_start
		   END
		 RETURNING attempts, window_start`,
		[key, windowMs]
	);
	const attempts = r.rows[0]?.attempts ?? 1;
	const windowStart = r.rows[0]?.window_start;
	const elapsed = windowStart ? Date.now() - new Date(windowStart).getTime() : 0;
	const retryAfterMs = Math.max(0, windowMs - elapsed);
	return { allowed: attempts <= max, attempts, retryAfterMs };
}

/** Best-effort GC of expired rate-limit rows. Safe to call from anywhere. */
export async function pruneExpiredRateLimits(maxWindowMs) {
	const pool = getPool();
	await pool.query(
		`DELETE FROM rate_limits
		 WHERE EXTRACT(EPOCH FROM (now() - window_start)) * 1000 > $1`,
		[maxWindowMs]
	);
}
