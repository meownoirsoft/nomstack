/**
 * PostgREST-style query builder backed by `pg`. Drop-in replacement for the
 * Supabase JS admin client used in the original codebase, so existing routes
 * keep working with minimal changes.
 */
import { getPool } from './sql.js';

function qi(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

function buildWhere(filters, paramOffset) {
  const params = [];
  let p = paramOffset;
  const parts = [];
  for (const f of filters) {
    if (f.kind === 'eq') {
      parts.push(`${qi(f.col)} = $${p++}`);
      params.push(f.val);
    } else if (f.kind === 'in') {
      if (!f.vals?.length) {
        parts.push('FALSE');
      } else {
        parts.push(`${qi(f.col)} = ANY($${p++})`);
        params.push(f.vals);
      }
    } else if (f.kind === 'isNull') {
      parts.push(`${qi(f.col)} IS NULL`);
    } else if (f.kind === 'isNotNull') {
      parts.push(`${qi(f.col)} IS NOT NULL`);
    } else if (f.kind === 'ilike') {
      parts.push(`${qi(f.col)} ILIKE $${p++}`);
      params.push(f.val);
    } else if (f.kind === 'neq') {
      parts.push(`${qi(f.col)} <> $${p++}`);
      params.push(f.val);
    } else if (f.kind === 'gt') {
      parts.push(`${qi(f.col)} > $${p++}`);
      params.push(f.val);
    } else if (f.kind === 'lt') {
      parts.push(`${qi(f.col)} < $${p++}`);
      params.push(f.val);
    }
  }
  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  return { clause, params, nextP: p };
}

class PgBuilder {
  constructor(table) {
    this.table = table;
    this.mode = 'select';
    this.columns = '*';
    this.filters = [];
    this.orderBy = null;
    this.limitN = null;
    /** @type {Record<string, unknown>[] | null} */
    this.insertRows = null;
    /** @type {Record<string, unknown> | null} */
    this.updatePayload = null;
    /** @type {Record<string, unknown> | null} */
    this.upsertRow = null;
    /** After insert/update: RETURNING clause */
    this.returning = null;
  }

  get pool() {
    return getPool();
  }

  select(cols = '*') {
    if (this.mode === 'insert' || this.mode === 'update') {
      this.returning = cols;
      return this;
    }
    this.mode = 'select';
    this.columns = cols;
    return this;
  }

  insert(rows) {
    this.mode = 'insert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(row, opts = {}) {
    this.mode = 'upsert';
    this.upsertRow = row;
    this.upsertOnConflict = opts.onConflict || 'id';
    return this;
  }

  update(payload) {
    this.mode = 'update';
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.mode = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push({ kind: 'eq', col, val });
    return this;
  }

  in(col, vals) {
    this.filters.push({ kind: 'in', col, vals });
    return this;
  }

  is(col, val) {
    if (val === null) {
      this.filters.push({ kind: 'isNull', col });
    } else {
      this.filters.push({ kind: 'eq', col, val });
    }
    return this;
  }

  not(col, op, val) {
    if (op === 'is' && val === null) {
      this.filters.push({ kind: 'isNotNull', col });
    } else if (op === 'eq') {
      this.filters.push({ kind: 'neq', col, val });
    }
    return this;
  }

  ilike(col, val) {
    this.filters.push({ kind: 'ilike', col, val });
    return this;
  }

  neq(col, val) {
    this.filters.push({ kind: 'neq', col, val });
    return this;
  }

  gt(col, val) {
    this.filters.push({ kind: 'gt', col, val });
    return this;
  }

  lt(col, val) {
    this.filters.push({ kind: 'lt', col, val });
    return this;
  }

  order(col, opts = {}) {
    this.orderBy = { col, ascending: opts.ascending !== false };
    return this;
  }

  limit(n) {
    this.limitN = n;
    return this;
  }

  single() {
    return this._finish().then((r) => {
      if (r.error) return r;
      const rows = r.data;
      if (rows == null && r.error == null) return { data: null, error: null };
      if (!Array.isArray(rows)) {
        return { data: rows, error: null };
      }
      if (!rows.length) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'No rows' }
        };
      }
      if (rows.length > 1) {
        return { data: null, error: { message: 'Multiple rows' } };
      }
      return { data: rows[0], error: null };
    });
  }

  maybeSingle() {
    return this._finish().then((r) => {
      if (r.error) return r;
      const rows = r.data;
      if (!Array.isArray(rows)) return { data: rows, error: null };
      if (!rows.length) return { data: null, error: null };
      if (rows.length > 1) return { data: null, error: { message: 'Multiple rows' } };
      return { data: rows[0], error: null };
    });
  }

  then(onFulfilled, onRejected) {
    return this._finish().then(onFulfilled, onRejected);
  }

  async _finish() {
    const t = qi(this.table);
    try {
      if (this.mode === 'upsert') {
        return await this._doUpsert(t);
      }
      if (this.mode === 'insert') {
        return await this._doInsert(t);
      }
      if (this.mode === 'update') {
        return await this._doUpdate(t);
      }
      if (this.mode === 'delete') {
        return await this._doDelete(t);
      }
      return await this._doSelect(t);
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  }

  async _doUpsert(t) {
    const row = this.upsertRow;
    const keys = Object.keys(row);
    const vals = keys.map((k) => row[k]);
    const cols = keys.map(qi).join(', ');
    const ph = keys.map((_, i) => `$${i + 1}`).join(', ');
    const conflictCol = this.upsertOnConflict || 'id';
    const updates = keys
      .filter((k) => k !== conflictCol)
      .map((k) => `${qi(k)} = EXCLUDED.${qi(k)}`)
      .join(', ');
    const sql = `
      INSERT INTO ${t} (${cols})
      VALUES (${ph})
      ON CONFLICT (${qi(conflictCol)}) DO UPDATE SET ${updates || `${qi(keys[0])} = EXCLUDED.${qi(keys[0])}`}
    `;
    await this.pool.query(sql, vals);
    return { data: null, error: null };
  }

  async _doInsert(t) {
    const rows = this.insertRows;
    if (!rows?.length) return { data: null, error: null };
    const keys = Object.keys(rows[0]);
    const cols = keys.map(qi).join(', ');
    const params = [];
    let p = 1;
    const groups = [];
    for (const row of rows) {
      const ph = keys.map(() => `$${p++}`);
      keys.forEach((k) => params.push(row[k]));
      groups.push(`(${ph.join(', ')})`);
    }
    let sql = `INSERT INTO ${t} (${cols}) VALUES ${groups.join(', ')}`;
    if (this.returning) {
      sql += ` RETURNING ${this.returning}`;
    }
    const res = await this.pool.query(sql, params);
    if (this.returning) {
      return { data: res.rows, error: null };
    }
    return { data: null, error: null };
  }

  async _doUpdate(t) {
    const keys = Object.keys(this.updatePayload);
    const params = [];
    let p = 1;
    const sets = keys
      .map((k) => {
        params.push(this.updatePayload[k]);
        return `${qi(k)} = $${p++}`;
      })
      .join(', ');
    let sql = `UPDATE ${t} SET ${sets}`;
    const w = buildWhere(this.filters, p);
    sql += w.clause ? ` ${w.clause}` : '';
    params.push(...w.params);
    if (this.returning) {
      sql += ` RETURNING ${this.returning}`;
    }
    const res = await this.pool.query(sql, params);
    if (this.returning) {
      return { data: res.rows, error: null };
    }
    return { data: null, error: null };
  }

  async _doDelete(t) {
    let sql = `DELETE FROM ${t}`;
    const w = buildWhere(this.filters, 1);
    sql += w.clause ? ` ${w.clause}` : '';
    await this.pool.query(sql, w.params);
    return { data: null, error: null };
  }

  async _doSelect(t) {
    let sql = `SELECT ${this.columns} FROM ${t}`;
    const w = buildWhere(this.filters, 1);
    sql += w.clause ? ` ${w.clause}` : '';
    if (this.orderBy) {
      sql += ` ORDER BY ${qi(this.orderBy.col)} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
    }
    if (this.limitN != null) {
      sql += ` LIMIT ${Number(this.limitN)}`;
    }
    const res = await this.pool.query(sql, w.params);
    return { data: res.rows, error: null };
  }
}

export const supabaseAdmin = {
  from(table) {
    return new PgBuilder(table);
  }
};
