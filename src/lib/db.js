import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import { runMigrate } from '$lib/migrate.js';

const dbPath = env.SQLITE_PATH ?? env.VITE_DB_PATH;
if (!dbPath) {
	throw new Error('Set SQLITE_PATH in .env (or legacy VITE_DB_PATH) to your SQLite database file path.');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

runMigrate(db);

try {
	const rows = db.prepare('SELECT count(*) AS c FROM meals').get();
	console.log(rows, ' meals in db');
} catch (error) {
	console.error('Failed to connect to the database:', error.message);
}

export default db;

// Meals
export function getAllMeals(userId) {
	return db.prepare(`SELECT * FROM meals WHERE user_id = ? ORDER BY name`).all(userId);
}

export function getLunches(userId) {
	return db
		.prepare(`SELECT * FROM meals WHERE user_id = ? AND cats LIKE '%12%' ORDER BY name`)
		.all(userId);
}

export function getDinners(userId) {
	return db
		.prepare(`SELECT * FROM meals WHERE user_id = ? AND cats LIKE '%13%' ORDER BY name`)
		.all(userId);
}

export function addMeal(userId, name, source, cats, notes) {
	const stmt = db.prepare(
		`INSERT INTO meals (name, source, cats, notes, user_id) VALUES (?,?,?,?,?)`
	);
	try {
		stmt.run(name, source, cats, notes, userId);
		console.log('added meal', name);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export function updMeal(userId, id, name, source, cats, notes) {
	const stmt = db.prepare(
		`UPDATE meals SET name = ?, source = ?, cats = ?, notes = ? WHERE id = ? AND user_id = ?`
	);
	try {
		const info = stmt.run(name, source, cats, notes, id, userId);
		console.log('updated meal', id);
		return info.changes > 0;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export function delMeal(userId, id) {
	const stmt = db.prepare(`DELETE FROM meals WHERE id = ? AND user_id = ?`);
	try {
		const info = stmt.run(id, userId);
		console.log('deleted meal', id);
		return info.changes > 0;
	} catch (error) {
		console.error(error);
		return false;
	}
}

// Cats
export function getAllCats(userId) {
	return db.prepare(`SELECT * FROM cats WHERE user_id = ? ORDER BY name`).all(userId);
}

export function addCat(userId, name) {
	try {
		const stmt = db.prepare(`INSERT INTO cats (name, user_id) VALUES (?, ?)`);
		stmt.run(name, userId);
		console.log('added cat', name);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export function updCats(userId, id, name) {
	try {
		const stmt = db.prepare(`UPDATE cats SET name = ? WHERE id = ? AND user_id = ?`);
		const info = stmt.run(name, id, userId);
		console.log('updated cat', id);
		return info.changes > 0;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export function delCat(userId, id) {
	try {
		const stmt = db.prepare(`DELETE FROM cats WHERE id = ? AND user_id = ?`);
		const info = stmt.run(id, userId);
		console.log('deleted cat', id);
		return info.changes > 0;
	} catch (error) {
		console.error(error);
		return false;
	}
}

// Sels
export function getAllSels(userId) {
	return db
		.prepare(`SELECT * FROM sels WHERE user_id = ? AND type = 'all' ORDER BY type`)
		.all(userId);
}

export function getLunchSels(userId) {
	return db
		.prepare(`SELECT * FROM sels WHERE user_id = ? AND type = 'lunch' ORDER BY type`)
		.all(userId);
}

export function getDinnerSels(userId) {
	return db
		.prepare(`SELECT * FROM sels WHERE user_id = ? AND type = 'dinner' ORDER BY type`)
		.all(userId);
}

export function updSels(userId, type, meals) {
	try {
		const stmt = db.prepare(
			'UPDATE sels SET meals = ? WHERE type = ? AND user_id = ?'
		);
		const info = stmt.run(meals, type, userId);
		console.log('updated sels', type);
		return info.changes > 0;
	} catch (error) {
		console.error(error);
		return false;
	}
}

// Sources
export function getAllSrcs(userId) {
	return db.prepare(`SELECT * FROM sources WHERE user_id = ? ORDER BY name`).all(userId);
}
