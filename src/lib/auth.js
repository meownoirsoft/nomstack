import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import db from '$lib/db.js';
import { ensureDefaultSelsForUser } from '$lib/migrate.js';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(password) {
	return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password, passwordHash) {
	return bcrypt.compareSync(password, passwordHash);
}

/**
 * @param {string | undefined} sessionToken
 * @returns {{ id: number, username: string } | null}
 */
export function getUserFromSessionToken(sessionToken) {
	if (!sessionToken) return null;
	const row = db
		.prepare(
			`SELECT u.id AS id, u.username AS username
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`
		)
		.get(sessionToken, Date.now());
	return row ?? null;
}

/**
 * @param {number} userId
 * @returns {string} session id (opaque token)
 */
export function createSession(userId) {
	const id = randomUUID();
	const expiresAt = Date.now() + SESSION_MS;
	db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
		id,
		userId,
		expiresAt
	);
	return id;
}

/**
 * @param {string | undefined} sessionToken
 */
export function destroySession(sessionToken) {
	if (!sessionToken) return;
	db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionToken);
}

export function countUsers() {
	const row = db.prepare('SELECT COUNT(*) AS c FROM users').get();
	return row.c;
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {number} new user id
 */
export function createUser(username, password) {
	const name = username.trim();
	if (!name) throw new Error('Username required');
	const hash = hashPassword(password);
	const now = Date.now();
	const info = db
		.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
		.run(name, hash, now);
	const userId = Number(info.lastInsertRowid);
	ensureDefaultSelsForUser(db, userId);
	return userId;
}

/**
 * @param {string} username
 * @returns {{ id: number, password_hash: string } | undefined}
 */
export function getUserByUsername(username) {
	return db
		.prepare('SELECT id, password_hash FROM users WHERE username = ?')
		.get(username.trim());
}
