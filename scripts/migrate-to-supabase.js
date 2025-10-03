#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_USER_ID'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.SUPABASE_USER_ID;
const SQLITE_PATH = process.env.NOMSTACK_SQLITE_PATH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'nomstack.db');
const SHOULD_PURGE = process.argv.includes('--purge');

const SPECIAL_CAT_IDS = new Set([12, 13]);
const FLAG_MAP = new Map([
  [12, 'lunch'],
  [13, 'dinner']
]);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const db = new Database(SQLITE_PATH, { readonly: true });

function loadSources() {
  return db.prepare('SELECT id, name, abbrev FROM sources ORDER BY id').all();
}

function loadCategories() {
  return db.prepare('SELECT id, name FROM cats ORDER BY id').all();
}

function loadMeals() {
  return db.prepare('SELECT id, name, source, cats, notes FROM meals ORDER BY id').all();
}

function loadSelections() {
  return db.prepare('SELECT id, type, meals FROM sels ORDER BY id').all();
}

async function assertProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', USER_ID)
    .limit(1);

  if (error) {
    console.error('Failed to verify profile row:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No profile row found for user ${USER_ID}. Insert into public.profiles before migrating.`);
    process.exit(1);
  }
}

async function purgeExistingData() {
  console.log('Purging existing Supabase data for user:', USER_ID);
  const tables = [
    { name: 'meal_plan_selections', filter: ['user_id', USER_ID] },
    { name: 'meal_flags', filter: ['meal_id', null] },
    { name: 'meal_categories', filter: ['meal_id', null] },
    { name: 'meals', filter: ['user_id', USER_ID] },
    { name: 'eat_out_roulette', filter: ['user_id', USER_ID] },
    { name: 'categories', filter: ['user_id', USER_ID] },
    { name: 'sources', filter: ['user_id', USER_ID] }
  ];

  for (const table of tables) {
    if (table.filter[0] === 'meal_id') {
      // meal_flags and meal_categories will be cleared via cascading delete from meals
      continue;
    }
    const { error } = await supabase.from(table.name).delete().eq(table.filter[0], table.filter[1]);
    if (error) {
      console.error(`Failed to purge ${table.name}:`, error.message);
      process.exit(1);
    }
  }
}

async function upsertSources(rows) {
  const map = new Map();
  for (const row of rows) {
    const { data: existingData, error: existingError } = await supabase
      .from('sources')
      .select('id, abbrev')
      .eq('user_id', USER_ID)
      .eq('abbrev', row.abbrev)
      .limit(1);

    if (existingError) {
      console.error('Failed to query existing source:', row, existingError.message);
      process.exit(1);
    }

    let targetId = existingData?.[0]?.id;
    if (!targetId) {
      const { data, error } = await supabase
        .from('sources')
        .insert({ user_id: USER_ID, name: row.name, abbrev: row.abbrev })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to insert source:', row, error.message);
        process.exit(1);
      }
      targetId = data.id;
    }
    map.set(row.abbrev, targetId);
  }
  console.log(`Synced ${map.size} sources.`);
  return map;
}

async function upsertCategories(rows) {
  const map = new Map();
  for (const row of rows) {
    const { data: existingData, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', USER_ID)
      .eq('name', row.name)
      .limit(1);

    if (existingError) {
      console.error('Failed to query existing category:', row, existingError.message);
      process.exit(1);
    }

    let targetId = existingData?.[0]?.id;
    if (!targetId) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ user_id: USER_ID, name: row.name })
        .select('id')
        .single();
      if (error) {
        console.error('Failed to insert category:', row, error.message);
        process.exit(1);
      }
      targetId = data.id;
    }
    map.set(row.id, targetId);
  }
  console.log(`Synced ${map.size} categories.`);
  return map;
}

function parseCatIds(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => Number.isInteger(v));
}

async function upsertMeals(rows, sourceMap, categoryMap) {
  const mealIdMap = new Map();
  for (const row of rows) {
    const sourceId = row.source ? sourceMap.get(row.source) ?? null : null;
    if (row.source && !sourceId) {
      console.warn(`Source abbreviation "${row.source}" not found for meal "${row.name}"; leaving source empty.`);
    }
    const { data: existingData, error: existingError } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', USER_ID)
      .eq('name', row.name)
      .limit(1);

    if (existingError) {
      console.error('Failed to query existing meal:', row.name, existingError.message);
      process.exit(1);
    }

    let targetId = existingData?.[0]?.id;
    if (targetId) {
      const { error } = await supabase
        .from('meals')
        .update({ source_id: sourceId, notes: row.notes ?? null })
        .eq('id', targetId);
      if (error) {
        console.error('Failed to update meal:', row.name, error.message);
        process.exit(1);
      }
      await clearMealLinks(targetId);
    } else {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: USER_ID,
          name: row.name,
          notes: row.notes ?? null,
          source_id: sourceId
        })
        .select('id')
        .single();
      if (error) {
        console.error('Failed to insert meal:', row.name, error.message);
        process.exit(1);
      }
      targetId = data.id;
    }

    const catIds = parseCatIds(row.cats);
    const regularCats = catIds.filter((id) => !SPECIAL_CAT_IDS.has(id));
    const flags = catIds.filter((id) => SPECIAL_CAT_IDS.has(id));

    if (regularCats.length) {
      const inserts = regularCats
        .map((catId) => {
          const mapped = categoryMap.get(catId);
          if (!mapped) {
            console.warn(`Missing category mapping for id ${catId} (meal: ${row.name}), skipping.`);
            return null;
          }
          return { meal_id: targetId, category_id: mapped };
        })
        .filter(Boolean);
      if (inserts.length) {
        const { error } = await supabase.from('meal_categories').insert(inserts);
        if (error) {
          console.error('Failed to insert meal category links:', error.message);
          process.exit(1);
        }
      }
    }

    if (flags.length) {
      const entries = flags.map((flagId) => ({ meal_id: targetId, flag: FLAG_MAP.get(flagId) ?? String(flagId) }));
      const { error } = await supabase.from('meal_flags').insert(entries);
      if (error) {
        console.error('Failed to insert meal flags:', error.message);
        process.exit(1);
      }
    }

    mealIdMap.set(row.id, targetId);
  }
  console.log(`Synced ${mealIdMap.size} meals.`);
  return mealIdMap;
}

async function clearMealLinks(mealId) {
  const tables = ['meal_categories', 'meal_flags'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('meal_id', mealId);
    if (error) {
      console.error(`Failed clearing ${table} for meal ${mealId}:`, error.message);
      process.exit(1);
    }
  }
}

async function insertSelections(rows, mealIdMap) {
  await supabase.from('meal_plan_selections').delete().eq('user_id', USER_ID);
  let total = 0;
  for (const row of rows) {
    const ids = parseCatIds(row.meals);
    if (!ids.length) {
      continue;
    }
    const inserts = ids
      .map((oldId, index) => {
        const mapped = mealIdMap.get(oldId);
        if (!mapped) {
          console.warn(`Skipping selection for meal id ${oldId} (plan ${row.type}) — no mapping.`);
          return null;
        }
        return {
          user_id: USER_ID,
          plan_type: row.type,
          meal_id: mapped,
          position: index + 1
        };
      })
      .filter(Boolean);
    if (inserts.length) {
      const { error } = await supabase.from('meal_plan_selections').insert(inserts);
      if (error) {
        console.error('Failed to insert meal plan selections:', error.message);
        process.exit(1);
      }
      total += inserts.length;
    }
  }
  console.log(`Synced ${total} meal plan selections.`);
}

async function main() {
  console.log('Starting migration using SQLite source:', SQLITE_PATH);
  await assertProfile();
  if (SHOULD_PURGE) {
    await purgeExistingData();
  }

  const sources = loadSources();
  const categories = loadCategories();
  const meals = loadMeals();
  const selections = loadSelections();

  const sourceMap = await upsertSources(sources);
  const categoryMap = await upsertCategories(categories);
  const mealIdMap = await upsertMeals(meals, sourceMap, categoryMap);
  await insertSelections(selections, mealIdMap);

  console.log('Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
