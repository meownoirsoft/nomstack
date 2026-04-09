import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';

/**
 * @param {import('better-sqlite3').Database} db
 */
export function runMigrate(db) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at INTEGER NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at INTEGER NOT NULL
		);
	`);

	const mealTable = db
		.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='meals'`)
		.get();
	if (!mealTable) {
		db.exec(`
			CREATE TABLE meals (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT,
				source TEXT,
				cats TEXT,
				notes TEXT,
				user_id INTEGER REFERENCES users(id)
			);
			CREATE TABLE cats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT,
				user_id INTEGER REFERENCES users(id)
			);
			CREATE TABLE sels (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				type TEXT,
				meals TEXT,
				user_id INTEGER REFERENCES users(id)
			);
			CREATE TABLE sources (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT,
				user_id INTEGER REFERENCES users(id)
			);
		`);
	}

	const hasColumn = (table, col) => {
		const rows = db.prepare(`PRAGMA table_info(${table})`).all();
		return rows.some((r) => r.name === col);
	};

	for (const table of ['meals', 'cats', 'sels', 'sources']) {
		const exists = db
			.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
			.get(table);
		if (!exists) {
			continue;
		}
		if (!hasColumn(table, 'user_id')) {
			db.exec(`ALTER TABLE ${table} ADD COLUMN user_id INTEGER REFERENCES users(id)`);
		}
	}

	let orphanCount = 0;
	for (const table of ['meals', 'cats', 'sels', 'sources']) {
		const exists = db
			.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
			.get(table);
		if (!exists) continue;
		orphanCount += db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE user_id IS NULL`).get().c;
	}
	const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get();

	if (orphanCount > 0 && userCount.c === 0) {
		const pwd = env.MIGRATION_OWNER_PASSWORD;
		if (!pwd) {
			throw new Error(
				'Existing rows need a user. Set MIGRATION_OWNER_PASSWORD in .env to create an "owner" account and assign legacy data to that user.'
			);
		}
		const hash = bcrypt.hashSync(pwd, 12);
		const now = Date.now();
		const info = db
			.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
			.run('owner', hash, now);
		const uid = Number(info.lastInsertRowid);
		for (const table of ['meals', 'cats', 'sels', 'sources']) {
			const t = db
				.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
				.get(table);
			if (!t) continue;
			db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`).run(uid);
		}
	}

	ensureDefaultSelsForUsers(db);
}

/**
 * @param {import('better-sqlite3').Database} db
 */
function ensureDefaultSelsForUsers(db) {
	const users = db.prepare('SELECT id FROM users').all();
	const types = ['all', 'lunch', 'dinner'];
	for (const { id } of users) {
		for (const type of types) {
			const row = db.prepare('SELECT 1 AS x FROM sels WHERE user_id = ? AND type = ?').get(id, type);
			if (!row) {
				db.prepare('INSERT INTO sels (type, meals, user_id) VALUES (?, ?, ?)').run(type, '', id);
			}
		}
	}
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {number} userId
 */
export function ensureDefaultSelsForUser(db, userId) {
	const types = ['all', 'lunch', 'dinner'];
	for (const type of types) {
		const row = db.prepare('SELECT 1 AS x FROM sels WHERE user_id = ? AND type = ?').get(userId, type);
		if (!row) {
			db.prepare('INSERT INTO sels (type, meals, user_id) VALUES (?, ?, ?)').run(type, '', userId);
		}
	}
}
