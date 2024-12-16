import Database from 'better-sqlite3';

const dbPath = import.meta.env.VITE_DB_PATH;
const apiBaseUrl = import.meta.env.VITE_BASE_URL;
console.log('DB Path: ',dbPath)
console.log('API Base URL: ',apiBaseUrl)
const db = new Database(dbPath);

try {
    // Test the connection by executing a simple query
    const rows = db.prepare('SELECT count(*) FROM meals').all();
    console.log(rows,' meals in db');

} catch (error) {
    // Catch any connection errors or query issues
    console.error('Failed to connect to the database:', error.message);
}

// Meals
export function getAllMeals() {
  return db.prepare(`SELECT * FROM meals ORDER BY name`).all();
}

export function getLunches() {
    return db.prepare(`SELECT * FROM meals WHERE cats LIKE '%12%' ORDER BY name`).all();
}

export function getDinners() {
    return db.prepare(`SELECT * FROM meals WHERE cats LIKE '%13%' ORDER BY name`).all();
}

export function addMeal(name, source, cats, notes) {
  const stmt = db.prepare(`INSERT INTO meals (name, source, cats, notes) VALUES (?,?,?,?)`);
  try {
    stmt.run(name, source, cats, notes);
    console.log('added meal', name);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function updMeal(id, name, source, cats, notes) {
    const stmt = db.prepare(`UPDATE meals SET name = ?, source = ?, cats = ?, notes = ? WHERE id = ?`);
    try {
        stmt.run(name, source, cats, notes, id);
        console.log('updated meal', id);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function delMeal(id) {
    const stmt = db.prepare(`DELETE FROM meals WHERE id = ?`);
    try {
        stmt.run(id);
        console.log('deleted meal', id);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


// Cats
export function getAllCats() {
    return db.prepare(`SELECT * FROM cats ORDER BY name`).all();
}

export function addCat(name) {
    try {
        const stmt = db.prepare(`INSERT INTO cats (name) VALUES (?)`);
        stmt.run(name);
        console.log('added cat', name);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export function updCats(id, name) {
    try {
        const stmt = db.prepare(`UPDATE cats SET name = ? WHERE id = ?`);
        stmt.run(name, id);
        console.log('updated cat', id);
        return true;
    }catch (error) {
        console.error(error);
        return false;
    }
}

export function delCat(id) {
    try {
        const stmt = db.prepare(`DELETE FROM cats WHERE id = ?`);
        stmt.run(id);
        console.log('deleted cat', id);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Sels
export function getAllSels() {
    return db.prepare(`SELECT * FROM sels WHERE type = 'all' ORDER BY type`).all();
}

export function getLunchSels() {
    return db.prepare(`SELECT * FROM sels WHERE type = 'lunch' ORDER BY type`).all();
}

export function getDinnerSels() {
    return db.prepare(`SELECT * FROM sels WHERE type = 'dinner' ORDER BY type`).all();
}

export function updSels(type, meals) {
    try {
        const stmt = db.prepare('UPDATE sels SET meals = ? WHERE type = ?');
        stmt.run(meals, type);
        console.log('updated sels', type);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Sources
export function getAllSrcs() {
    return db.prepare(`SELECT * FROM sources ORDER BY name`).all();
}