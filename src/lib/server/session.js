import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getPool } from './sql.js';

const MIN_PASSWORD_LENGTH = 8;

// Tiny blocklist — extremely common passwords. Not a substitute for a real
// pwned-password check, but blocks the worst offenders without a network call.
const COMMON_PASSWORD_BLOCKLIST = new Set([
  'password',
  'password1',
  'password123',
  'passw0rd',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'abc12345',
  'letmein1',
  'welcome1',
  'iloveyou',
  'admin123',
  'monkey123',
  'football'
]);

/**
 * Validate password strength. Returns null on success or an error message.
 * Rules: ≥8 chars, at least one letter, at least one number, not common.
 * Use the same function in signup and password-reset; do NOT use it in login
 * (we don't want to lock out anyone whose existing password predates this rule).
 */
export function validatePasswordStrength(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must include at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number';
  }
  if (COMMON_PASSWORD_BLOCKLIST.has(password.toLowerCase())) {
    return 'That password is too common — please choose a different one';
  }
  return null;
}

export async function createSessionForUserId(userId) {
  const pool = getPool();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO app_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [id, userId, expiresAt.toISOString()]
  );
  return id;
}

export async function getUserIdForSession(sessionId) {
  if (!sessionId) return null;
  const pool = getPool();
  const r = await pool.query(
    `SELECT user_id FROM app_sessions WHERE id = $1 AND expires_at > now()`,
    [sessionId]
  );
  return r.rows[0]?.user_id ?? null;
}

export async function destroySession(sessionId) {
  if (!sessionId) return;
  const pool = getPool();
  await pool.query(`DELETE FROM app_sessions WHERE id = $1`, [sessionId]);
}

export async function verifyEmailPassword(email, password) {
  const pool = getPool();
  const r = await pool.query(
    `SELECT user_id, password_hash FROM user_password_logins WHERE lower(email) = lower($1)`,
    [email.trim()]
  );
  if (!r.rows.length) return { error: 'Invalid email or password' };
  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if (!ok) return { error: 'Invalid email or password' };
  return { userId: r.rows[0].user_id };
}

export async function registerUser(email, password, displayName) {
  const pool = getPool();
  const hash = await bcrypt.hash(password, 10);
  const userId = randomUUID();
  await pool.query('BEGIN');
  try {
    await pool.query(
      `INSERT INTO profiles (id, display_name, created_at) VALUES ($1, $2, now())`,
      [userId, displayName || 'User']
    );
    await pool.query(
      `INSERT INTO user_password_logins (user_id, email, password_hash) VALUES ($1, $2, $3)`,
      [userId, email.trim(), hash]
    );
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
  return userId;
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function generateToken() {
  // 256 bits of entropy as URL-safe hex.
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Create a one-time verification token for the given user/email. */
export async function createEmailVerification(userId, email) {
  const pool = getPool();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await pool.query(
    `INSERT INTO email_verifications (token, user_id, email, expires_at) VALUES ($1, $2, $3, $4)`,
    [token, userId, email.trim(), expiresAt.toISOString()]
  );
  return token;
}

/** Mark a verification token used and flip the user's email_verified flag. */
export async function consumeEmailVerification(token) {
  if (!token) return { error: 'Missing token' };
  const pool = getPool();
  const r = await pool.query(
    `SELECT user_id, email, expires_at, used_at FROM email_verifications WHERE token = $1`,
    [token]
  );
  const row = r.rows[0];
  if (!row) return { error: 'Invalid token' };
  if (row.used_at) return { error: 'Token already used' };
  if (new Date(row.expires_at) < new Date()) return { error: 'Token expired' };

  await pool.query('BEGIN');
  try {
    await pool.query(
      `UPDATE email_verifications SET used_at = now() WHERE token = $1`,
      [token]
    );
    await pool.query(
      `UPDATE user_password_logins
       SET email_verified = TRUE, email_verified_at = now()
       WHERE user_id = $1 AND lower(email) = lower($2)`,
      [row.user_id, row.email]
    );
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
  return { userId: row.user_id, email: row.email };
}

/** Look up a user by email — returns userId or null without leaking existence. */
export async function findUserIdByEmail(email) {
  if (!email) return null;
  const pool = getPool();
  const r = await pool.query(
    `SELECT user_id FROM user_password_logins WHERE lower(email) = lower($1)`,
    [email.trim()]
  );
  return r.rows[0]?.user_id ?? null;
}

/** Create a password-reset token (valid 1 hour). Caller is responsible for emailing it. */
export async function createPasswordReset(userId) {
  const pool = getPool();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await pool.query(
    `INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt.toISOString()]
  );
  return token;
}

/** Validate a reset token and update the user's password. Returns { userId } or { error }. */
export async function consumePasswordReset(token, newPassword) {
  if (!token) return { error: 'Missing token' };
  const pool = getPool();
  const r = await pool.query(
    `SELECT user_id, expires_at, used_at FROM password_resets WHERE token = $1`,
    [token]
  );
  const row = r.rows[0];
  if (!row) return { error: 'Invalid or expired link' };
  if (row.used_at) return { error: 'This link has already been used' };
  if (new Date(row.expires_at) < new Date()) return { error: 'This link has expired' };

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('BEGIN');
  try {
    await pool.query(
      `UPDATE user_password_logins SET password_hash = $1 WHERE user_id = $2`,
      [hash, row.user_id]
    );
    await pool.query(`UPDATE password_resets SET used_at = now() WHERE token = $1`, [token]);
    // Invalidate all existing sessions on password change.
    await pool.query(`DELETE FROM app_sessions WHERE user_id = $1`, [row.user_id]);
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
  return { userId: row.user_id };
}
