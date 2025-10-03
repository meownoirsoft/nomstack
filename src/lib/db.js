import { supabaseAdmin } from '$lib/server/supabaseClient.js';

// Helper function to get user ID from request context
function getUserId(request) {
  // This will be passed from the API endpoints
  return request.userId;
}

const LUNCH_FLAG = 'lunch';
const DINNER_FLAG = 'dinner';
const SPECIAL_VALUE_MAP = new Map([
  ['12', LUNCH_FLAG],
  ['lunch', LUNCH_FLAG],
  ['dinner', DINNER_FLAG],
  ['13', DINNER_FLAG]
]);

function splitFlags(values = []) {
  const flags = [];
  const categories = [];
  for (const value of values) {
    if (!value) {
      continue;
    }
    const normalized = String(value).toLowerCase();
    const mappedFlag = SPECIAL_VALUE_MAP.get(normalized);
    if (mappedFlag) {
      flags.push(mappedFlag);
    } else {
      categories.push(String(value));
    }
  }
  return { flags, categories };
}

async function resolveSourceId(abbrev, userId) {
  if (!abbrev) {
    return null;
  }
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('id')
    .eq('user_id', userId)
    .eq('abbrev', abbrev)
    .limit(1);

  if (error) {
    throw new Error(`Failed to resolve source: ${error.message}`);
  }

  return data?.[0]?.id ?? null;
}

async function loadCategoriesMap(mealIds) {
  if (!mealIds.length) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('meal_categories')
    .select('meal_id, category_id')
    .in('meal_id', mealIds);

  if (error) {
    throw new Error(`Failed to load meal categories: ${error.message}`);
  }

  const map = new Map();
  for (const entry of data ?? []) {
    const items = map.get(entry.meal_id) ?? [];
    items.push(entry.category_id);
    map.set(entry.meal_id, items);
  }
  return map;
}

async function loadFlagsMap(mealIds) {
  if (!mealIds.length) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('meal_flags')
    .select('meal_id, flag')
    .in('meal_id', mealIds);

  if (error) {
    throw new Error(`Failed to load meal flags: ${error.message}`);
  }

  const map = new Map();
  for (const entry of data ?? []) {
    const items = map.get(entry.meal_id) ?? [];
    items.push(entry.flag);
    map.set(entry.meal_id, items);
  }
  return map;
}

async function loadSourcesMap(meals) {
  const sourceIds = Array.from(new Set(meals.map((meal) => meal.source_id).filter(Boolean)));
  if (!sourceIds.length) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('id, name, abbrev')
    .in('id', sourceIds);

  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }

  const map = new Map();
  for (const source of data ?? []) {
    map.set(source.id, source);
  }
  return map;
}

function mapMealRow(row, sourceMap, categoryMap, flagsMap) {
  const categories = categoryMap.get(row.id) ?? [];
  const flags = flagsMap.get(row.id) ?? [];
  const source = row.source_id ? sourceMap.get(row.source_id) : null;

  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? '',
    source: source?.abbrev ?? '',
    source_name: source?.name ?? null,
    cats: categories,
    flags
  };
}

export async function getAllMeals(userId) {
  const { data, error } = await supabaseAdmin
    .from('meals')
    .select('id, name, notes, source_id')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    throw new Error(`Failed to load meals: ${error.message}`);
  }

  const meals = data ?? [];
  const mealIds = meals.map((meal) => meal.id);
  const [categoryMap, flagsMap, sourceMap] = await Promise.all([
    loadCategoriesMap(mealIds),
    loadFlagsMap(mealIds),
    loadSourcesMap(meals)
  ]);

  return meals.map((meal) => mapMealRow(meal, sourceMap, categoryMap, flagsMap));
}

export async function getLunches(userId) {
  const meals = await getAllMeals(userId);
  return meals.filter((meal) => meal.flags.includes(LUNCH_FLAG));
}

export async function getDinners(userId) {
  const meals = await getAllMeals(userId);
  return meals.filter((meal) => meal.flags.includes(DINNER_FLAG));
}

export async function addMeal(name, sourceAbbrev, cats = [], notes = '', userId) {
  const { flags, categories } = splitFlags(cats);
  const sourceId = await resolveSourceId(sourceAbbrev, userId);

  const { data, error } = await supabaseAdmin
    .from('meals')
    .insert({
      user_id: userId,
      name,
      notes: notes ?? null,
      source_id: sourceId
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to add meal: ${error.message}`);
  }

  const mealId = data.id;

  if (categories.length) {
    const categoryRows = categories.map((categoryId) => ({ meal_id: mealId, category_id: categoryId }));
    const { error: catError } = await supabaseAdmin.from('meal_categories').insert(categoryRows);
    if (catError) {
      throw new Error(`Failed to link categories: ${catError.message}`);
    }
  }

  if (flags.length) {
    const flagRows = flags.map((flag) => ({ meal_id: mealId, flag }));
    const { error: flagError } = await supabaseAdmin.from('meal_flags').insert(flagRows);
    if (flagError) {
      throw new Error(`Failed to link flags: ${flagError.message}`);
    }
  }

  return mealId;
}

export async function updMeal(id, name, sourceAbbrev, cats = [], notes = '', userId) {
  const { flags, categories } = splitFlags(cats);
  const sourceId = await resolveSourceId(sourceAbbrev, userId);

  const { error } = await supabaseAdmin
    .from('meals')
    .update({
      name,
      notes: notes ?? null,
      source_id: sourceId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update meal: ${error.message}`);
  }

  await supabaseAdmin.from('meal_categories').delete().eq('meal_id', id);
  await supabaseAdmin.from('meal_flags').delete().eq('meal_id', id);

  if (categories.length) {
    const categoryRows = categories.map((categoryId) => ({ meal_id: id, category_id: categoryId }));
    const { error: catError } = await supabaseAdmin.from('meal_categories').insert(categoryRows);
    if (catError) {
      throw new Error(`Failed to relink categories: ${catError.message}`);
    }
  }

  if (flags.length) {
    const flagRows = flags.map((flag) => ({ meal_id: id, flag }));
    const { error: flagError } = await supabaseAdmin.from('meal_flags').insert(flagRows);
    if (flagError) {
      throw new Error(`Failed to relink flags: ${flagError.message}`);
    }
  }

  return true;
}

export async function delMeal(id, userId) {
  const { error } = await supabaseAdmin
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete meal: ${error.message}`);
  }

  return true;
}

export async function getAllCats(userId) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const categories = (data ?? []).filter((cat) => !['Lunch', 'Dinner'].includes(cat.name));
  return categories;
}

export async function addCat(name, userId) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ user_id: userId, name })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to add category: ${error.message}`);
  }

  return data.id;
}

export async function updCats(id, name, userId) {
  const { error } = await supabaseAdmin
    .from('categories')
    .update({ name })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update category ${id}: ${error.message}`);
  }

  return true;
}

export async function delCat(id, userId) {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete category ${id}: ${error.message}`);
  }

  return true;
}

async function getSelectionsByType(type, userId) {
  const { data, error } = await supabaseAdmin
    .from('meal_plan_selections')
    .select('meal_id, position')
    .eq('user_id', userId)
    .eq('plan_type', type)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to load selections (${type}): ${error.message}`);
  }

  const meals = (data ?? [])
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((entry) => entry.meal_id);

  return [{ type, meals }];
}

export async function getAllSels(userId) {
  return getSelectionsByType('all', userId);
}

export async function getLunchSels(userId) {
  return getSelectionsByType('lunch', userId);
}

export async function getDinnerSels(userId) {
  return getSelectionsByType('dinner', userId);
}

export async function updSels(type, meals = [], userId) {
  const trx = supabaseAdmin
    .from('meal_plan_selections')
    .delete()
    .eq('user_id', userId)
    .eq('plan_type', type);

  const { error: deleteError } = await trx;
  if (deleteError) {
    throw new Error(`Failed to clear selections (${type}): ${deleteError.message}`);
  }

  if (!meals.length) {
    return true;
  }

  const inserts = meals.map((mealId, index) => ({
    user_id: userId,
    plan_type: type,
    meal_id: mealId,
    position: index + 1
  }));

  const { error: insertError } = await supabaseAdmin.from('meal_plan_selections').insert(inserts);
  if (insertError) {
    throw new Error(`Failed to save selections (${type}): ${insertError.message}`);
  }

  return true;
}

export async function getAllSrcs(userId) {
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('id, name, abbrev')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    throw new Error(`Failed to load sources: ${error.message}`);
  }

  return data ?? [];
}

// Restaurant management functions
export async function getAllRestaurants(userId) {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    // If the table doesn't exist yet, return an empty array gracefully
    if (String(error.message).toLowerCase().includes('could not find the table') || error.code === '42P01') {
      console.warn('restaurants table not found yet; returning empty list');
      return [];
    }
    throw new Error(`Failed to load restaurants: ${error.message}`);
  }

  return data ?? [];
}

export async function addRestaurant(userId, restaurant) {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .insert([{
      user_id: userId,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      notes: restaurant.notes,
      rating: restaurant.rating,
      price_range: restaurant.price_range,
      google_place_id: restaurant.google_place_id,
      website: restaurant.website,
      latitude: restaurant.location?.lat,
      longitude: restaurant.location?.lng,
      opening_hours: restaurant.opening_hours,
      current_opening_hours: restaurant.current_opening_hours,
      popular_times: restaurant.popular_times
    }])
    .select()
    .single();

  if (error) {
    if (String(error.message).toLowerCase().includes('could not find the table') || error.code === '42P01') {
      throw new Error('Restaurants feature not initialized. Please run the migration to create the restaurants table.');
    }
    throw new Error(`Failed to add restaurant: ${error.message}`);
  }

  return data;
}

export async function updateRestaurant(userId, restaurant) {
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .update({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      notes: restaurant.notes,
      rating: restaurant.rating,
      price_range: restaurant.price_range,
      google_place_id: restaurant.google_place_id,
      website: restaurant.website,
      latitude: restaurant.location?.lat,
      longitude: restaurant.location?.lng,
      opening_hours: restaurant.opening_hours,
      current_opening_hours: restaurant.current_opening_hours,
      popular_times: restaurant.popular_times
    })
    .eq('id', restaurant.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (String(error.message).toLowerCase().includes('could not find the table') || error.code === '42P01') {
      throw new Error('Restaurants feature not initialized. Please run the migration to create the restaurants table.');
    }
    throw new Error(`Failed to update restaurant: ${error.message}`);
  }

  return data;
}

export async function deleteRestaurant(userId, restaurantId) {
  const { error } = await supabaseAdmin
    .from('restaurants')
    .delete()
    .eq('id', restaurantId)
    .eq('user_id', userId);

  if (error) {
    if (String(error.message).toLowerCase().includes('could not find the table') || error.code === '42P01') {
      throw new Error('Restaurants feature not initialized. Please run the migration to create the restaurants table.');
    }
    throw new Error(`Failed to delete restaurant: ${error.message}`);
  }

  return { success: true };
}
