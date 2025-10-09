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

async function getSelectionsByType(type, userId, planId = null) {
  let query = supabaseAdmin
    .from('meal_plan_selections')
    .select('meal_id, position')
    .eq('user_id', userId)
    .eq('plan_type', type);

  // If planId is provided, filter by plan_id
  if (planId) {
    query = query.eq('plan_id', planId);
  } else {
    // If no planId, get only records without plan_id (legacy system)
    query = query.is('plan_id', null);
  }

  const { data, error } = await query.order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to load selections (${type}): ${error.message}`);
  }

  const meals = (data ?? [])
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((entry) => entry.meal_id);

  return [{ type, meals }];
}

export async function getAllSels(userId, planId = null) {
  return getSelectionsByType('all', userId, planId);
}

export async function getLunchSels(userId, planId = null) {
  return getSelectionsByType('lunch', userId, planId);
}

export async function getDinnerSels(userId, planId = null) {
  return getSelectionsByType('dinner', userId, planId);
}

export async function updSels(type, meals = [], userId, planId = null) {
  // Build delete query
  let deleteQuery = supabaseAdmin
    .from('meal_plan_selections')
    .delete()
    .eq('user_id', userId)
    .eq('plan_type', type);

  // If planId is provided, also filter by plan_id
  if (planId) {
    deleteQuery = deleteQuery.eq('plan_id', planId);
  } else {
    // If no planId, delete only records without plan_id (legacy system)
    deleteQuery = deleteQuery.is('plan_id', null);
  }

  const { error: deleteError } = await deleteQuery;
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
    position: index + 1,
    plan_id: planId
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

// Recipe functions
export async function getRecipe(mealId) {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select('*')
    .eq('meal_id', mealId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No recipe found, return null
      return null;
    }
    throw new Error(`Failed to load recipe: ${error.message}`);
  }

  return data;
}

export async function addRecipe(mealId, recipe) {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .insert([{
      meal_id: mealId,
      title: recipe.title || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '',
      prep_time: recipe.prep_time || 0,
      cook_time: recipe.cook_time || 0,
      servings: recipe.servings || 1,
      notes: recipe.notes || ''
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add recipe: ${error.message}`);
  }

  // After adding the recipe, check if there are any active meal plans that include this meal
  try {
    // Get the user_id from the meal
    const { data: meal } = await supabaseAdmin
      .from('meals')
      .select('user_id')
      .eq('id', mealId)
      .single();

    if (meal) {
      // Get all active meal plans for this user
      const { data: mealPlans } = await supabaseAdmin
        .from('meal_plans')
        .select('id')
        .eq('user_id', meal.user_id)
        .eq('status', 'active');

      if (mealPlans && mealPlans.length > 0) {
        // Check if this meal is selected in any of these plans
        for (const plan of mealPlans) {
          const { data: selections } = await supabaseAdmin
            .from('selections')
            .select('meals')
            .eq('user_id', meal.user_id)
            .eq('type', 'all')
            .single();

          if (selections && selections.meals && selections.meals.includes(mealId)) {
            // This meal is selected in an active plan, generate ingredients
            try {
              await generateIngredientsFromRecipe(meal.user_id, plan.id, data.id);
            } catch (refreshError) {
              console.error(`Error generating ingredients for new recipe in plan ${plan.id}:`, refreshError);
            }
          }
        }
      }
    }
  } catch (refreshError) {
    console.error('Error checking meal plans for new recipe:', refreshError);
    // Don't fail the recipe creation if ingredient generation fails
  }

  return data;
}

export async function updateRecipe(recipeId, recipe) {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .update({
      title: recipe.title || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || '',
      prep_time: recipe.prep_time || 0,
      cook_time: recipe.cook_time || 0,
      servings: recipe.servings || 1,
      notes: recipe.notes || ''
    })
    .eq('id', recipeId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update recipe: ${error.message}`);
  }

  // After updating the recipe, refresh shopping list ingredients for any active meal plans
  try {
    console.log('Recipe updated, checking for active meal plans with this recipe...');
    // Get all active meal plans that have ingredients from this recipe
    const { data: ingredients } = await supabaseAdmin
      .from('ingredients')
      .select('plan_id, user_id')
      .eq('source_recipe_id', recipeId);

    console.log('Found existing ingredients for recipe:', ingredients?.length || 0);
    
    if (ingredients && ingredients.length > 0) {
      // Get unique plan IDs and user IDs
      const planIds = [...new Set(ingredients.map(ing => ing.plan_id))];
      const userIds = [...new Set(ingredients.map(ing => ing.user_id))];

      console.log('Refreshing ingredients for plans:', planIds);

      // Refresh ingredients for each plan
      for (let i = 0; i < planIds.length; i++) {
        const planId = planIds[i];
        const userId = userIds[i];
        try {
          console.log(`Refreshing ingredients for plan ${planId}...`);
          await generateIngredientsFromRecipe(userId, planId, recipeId);
          console.log(`Successfully refreshed ingredients for plan ${planId}`);
        } catch (refreshError) {
          console.error(`Error refreshing ingredients for plan ${planId}:`, refreshError);
          // Continue with other plans even if one fails
        }
      }
    } else {
      console.log('No existing ingredients found for this recipe in any meal plans');
    }
  } catch (refreshError) {
    console.error('Error refreshing shopping list ingredients:', refreshError);
    // Don't fail the recipe update if ingredient refresh fails
  }

  return data;
}

export async function deleteRecipe(recipeId) {
  const { error } = await supabaseAdmin
    .from('recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }

  return { success: true };
}

// ===== SHOPPING LISTS FUNCTIONS =====

// Meal Plans
export async function createMealPlan(userId, planData) {
  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .insert([{
      user_id: userId,
      title: planData.title || 'Meal Plan',
      start_date: planData.start_date,
      end_date: planData.end_date,
      status: planData.status || 'active'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meal plan: ${error.message}`);
  }

  return { success: true, data };
}

export async function getMealPlans(userId, status = 'active') {
  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get meal plans: ${error.message}`);
  }

  return data || [];
}

export async function updateMealPlan(planId, planData) {
  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .update({
      title: planData.title,
      start_date: planData.start_date,
      end_date: planData.end_date,
      status: planData.status
    })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update meal plan: ${error.message}`);
  }

  return { success: true, data };
}

export async function deleteMealPlan(planId) {
  const { error } = await supabaseAdmin
    .from('meal_plans')
    .delete()
    .eq('id', planId);

  if (error) {
    throw new Error(`Failed to delete meal plan: ${error.message}`);
  }

  return { success: true };
}

// Stores
export async function createStore(userId, storeData) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .insert([{
      user_id: userId,
      name: storeData.name,
      section_order: storeData.section_order || []
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create store: ${error.message}`);
  }

  return { success: true, data };
}

export async function getStores(userId) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get stores: ${error.message}`);
  }

  // Sort by section_order if available, otherwise by created_at
  const sortedStores = (data || []).sort((a, b) => {
    // If we have section_order data, use it for sorting
    if (a.section_order && Array.isArray(a.section_order) && a.section_order.length > 0) {
      const aIndex = a.section_order.indexOf(a.name);
      const bIndex = b.section_order.indexOf(b.name);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }
    // Fallback to created_at
    return new Date(a.created_at) - new Date(b.created_at);
  });

  return sortedStores;
}

export async function updateStore(storeId, storeData) {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .update({
      name: storeData.name,
      section_order: storeData.section_order,
      last_used: new Date().toISOString()
    })
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update store: ${error.message}`);
  }

  return { success: true, data };
}

export async function deleteStore(storeId) {
  const { error } = await supabaseAdmin
    .from('stores')
    .delete()
    .eq('id', storeId);

  if (error) {
    throw new Error(`Failed to delete store: ${error.message}`);
  }

  return { success: true };
}

// Shopping Lists
export async function createShoppingList(planId, storeId, title) {
  const { data, error } = await supabaseAdmin
    .from('shopping_lists')
    .insert([{
      plan_id: planId,
      store_id: storeId,
      title: title || 'Shopping List'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create shopping list: ${error.message}`);
  }

  return { success: true, data };
}

export async function getShoppingLists(planId) {
  const { data, error } = await supabaseAdmin
    .from('shopping_lists')
    .select(`
      *,
      stores (
        id,
        name,
        section_order
      )
    `)
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get shopping lists: ${error.message}`);
  }

  return data || [];
}

export async function updateShoppingList(listId, listData) {
  const { data, error } = await supabaseAdmin
    .from('shopping_lists')
    .update({
      title: listData.title,
      status: listData.status
    })
    .eq('id', listId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update shopping list: ${error.message}`);
  }

  return { success: true, data };
}

export async function deleteShoppingList(listId) {
  const { error } = await supabaseAdmin
    .from('shopping_lists')
    .delete()
    .eq('id', listId);

  if (error) {
    throw new Error(`Failed to delete shopping list: ${error.message}`);
  }

  return { success: true };
}

// Ingredients
export async function createIngredient(userId, ingredientData) {
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .insert([{
      user_id: userId,
      store_id: ingredientData.store_id,
      plan_id: ingredientData.plan_id,
      source_recipe_id: ingredientData.source_recipe_id,
      name: ingredientData.name,
      amount: ingredientData.amount,
      unit: ingredientData.unit,
      category: ingredientData.category,
      is_custom: ingredientData.is_custom || false,
      deemphasized: ingredientData.deemphasized || false,
      checked: ingredientData.checked || false,
      position: ingredientData.position || 0
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ingredient: ${error.message}`);
  }

  return { success: true, data };
}

export async function getIngredients(userId, filters = {}) {
  let query = supabaseAdmin
    .from('ingredients')
    .select('*')
    .eq('user_id', userId);

  if (filters.store_id) {
    query = query.eq('store_id', filters.store_id);
  }

  if (filters.plan_id) {
    query = query.eq('plan_id', filters.plan_id);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query.order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to get ingredients: ${error.message}`);
  }

  return data || [];
}

export async function updateIngredient(ingredientId, ingredientData) {
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .update({
      name: ingredientData.name,
      amount: ingredientData.amount,
      unit: ingredientData.unit,
      category: ingredientData.category,
      store_id: ingredientData.store_id,
      is_custom: ingredientData.is_custom,
      deemphasized: ingredientData.deemphasized,
      checked: ingredientData.checked,
      position: ingredientData.position
    })
    .eq('id', ingredientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update ingredient: ${error.message}`);
  }

  return { success: true, data };
}

export async function moveIngredient(ingredientId, newStoreId) {
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .update({
      store_id: newStoreId
    })
    .eq('id', ingredientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to move ingredient: ${error.message}`);
  }

  return { success: true, data };
}

export async function toggleIngredient(ingredientId, field) {
  const { data, error } = await supabaseAdmin
    .from('ingredients')
    .select(field)
    .eq('id', ingredientId)
    .single();

  if (error) {
    throw new Error(`Failed to get ingredient: ${error.message}`);
  }

  const newValue = !data[field];

  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from('ingredients')
    .update({
      [field]: newValue
    })
    .eq('id', ingredientId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to toggle ingredient: ${updateError.message}`);
  }

  return { success: true, data: updatedData };
}

export async function deleteIngredient(ingredientId) {
  const { error } = await supabaseAdmin
    .from('ingredients')
    .delete()
    .eq('id', ingredientId);

  if (error) {
    throw new Error(`Failed to delete ingredient: ${error.message}`);
  }

  return { success: true };
}

// Helper function to generate ingredients from recipe
// Comprehensive ingredient category detection
function detectIngredientCategory(ingredientName) {
  const name = ingredientName.toLowerCase().trim();
  
  // Produce - Fresh fruits and vegetables
  const produceKeywords = [
    // Vegetables
    'onion', 'garlic', 'tomato', 'carrot', 'celery', 'pepper', 'bell pepper', 'jalapeño',
    'lettuce', 'spinach', 'kale', 'arugula', 'cabbage', 'broccoli', 'cauliflower',
    'cucumber', 'zucchini', 'squash', 'eggplant', 'potato', 'sweet potato', 'yam',
    'mushroom', 'asparagus', 'green bean', 'snap pea', 'corn', 'avocado',
    // Herbs
    'basil', 'parsley', 'cilantro', 'oregano', 'thyme', 'rosemary', 'sage', 'mint',
    'dill', 'chive', 'tarragon', 'herb', 'herbs',
    // Fruits
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grapefruit', 'berry', 'strawberry',
    'blueberry', 'raspberry', 'blackberry', 'grape', 'peach', 'pear', 'plum',
    'cherry', 'pineapple', 'mango', 'kiwi', 'coconut', 'pomegranate', 'fig',
    'cantaloupe', 'watermelon', 'honeydew'
  ];
  
  // Meat & Seafood
  const meatSeafoodKeywords = [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'duck', 'goose', 'veal',
    'bacon', 'sausage', 'ham', 'prosciutto', 'pepperoni', 'salami',
    'fish', 'salmon', 'tuna', 'cod', 'halibut', 'tilapia', 'mackerel', 'sardine',
    'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster',
    'ground beef', 'ground turkey', 'ground pork', 'chicken breast', 'chicken thigh',
    'ribeye', 'sirloin', 'tenderloin', 'chop', 'steak'
  ];
  
  // Dairy
  const dairyKeywords = [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'eggs', 'sour cream',
    'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'feta',
    'goat cheese', 'cream cheese', 'mascarpone', 'buttermilk', 'half and half',
    'heavy cream', 'whipping cream', 'greek yogurt', 'kefir'
  ];
  
  // Pantry - Dry goods, canned goods, spices, oils
  const pantryKeywords = [
    'flour', 'sugar', 'brown sugar', 'powdered sugar', 'honey', 'maple syrup',
    'salt', 'pepper', 'black pepper', 'sea salt', 'kosher salt',
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
    'vinegar', 'balsamic vinegar', 'apple cider vinegar', 'white vinegar',
    'rice', 'pasta', 'noodle', 'spaghetti', 'penne', 'macaroni', 'linguine',
    'bread', 'breadcrumb', 'cereal', 'oatmeal', 'quinoa', 'barley', 'bulgur',
    'canned', 'can of', 'jar of', 'sauce', 'marinara', 'pesto', 'salsa',
    'spice', 'seasoning', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg',
    'ginger', 'garlic powder', 'onion powder', 'chili powder', 'cayenne',
    'vanilla', 'vanilla extract', 'almond extract', 'baking powder', 'baking soda',
    'cocoa powder', 'chocolate chip', 'raisin', 'nut', 'almond', 'walnut', 'pecan',
    'coconut', 'dried fruit', 'jam', 'jelly', 'peanut butter', 'almond butter'
  ];
  
  // Frozen
  const frozenKeywords = [
    'frozen', 'ice cream', 'sorbet', 'frozen vegetable', 'frozen fruit',
    'frozen berry', 'frozen corn', 'frozen pea', 'frozen spinach'
  ];
  
  // Bakery
  const bakeryKeywords = [
    'bread', 'roll', 'bagel', 'muffin', 'cake', 'cookie', 'croissant', 'biscuit',
    'tortilla', 'pita', 'naan', 'baguette', 'sourdough', 'whole wheat bread',
    'white bread', 'rye bread', 'pumpernickel', 'dinner roll', 'hamburger bun',
    'hot dog bun', 'english muffin', 'crouton'
  ];
  
  // Check each category
  for (const keyword of produceKeywords) {
    if (name.includes(keyword)) return 'Produce';
  }
  
  for (const keyword of meatSeafoodKeywords) {
    if (name.includes(keyword)) return 'Meat & Seafood';
  }
  
  for (const keyword of dairyKeywords) {
    if (name.includes(keyword)) return 'Dairy';
  }
  
  for (const keyword of pantryKeywords) {
    if (name.includes(keyword)) return 'Pantry';
  }
  
  for (const keyword of frozenKeywords) {
    if (name.includes(keyword)) return 'Frozen';
  }
  
  for (const keyword of bakeryKeywords) {
    if (name.includes(keyword)) return 'Bakery';
  }
  
  // If no match found, return Other
  return 'Other';
}

// Helper function to combine ingredient amounts
function combineAmounts(amount1, amount2, unit1, unit2) {
  // If units don't match, return the first amount
  if (unit1 !== unit2) {
    return { amount: amount1, unit: unit1 };
  }
  
  // If no amounts, return empty
  if (!amount1 && !amount2) {
    return { amount: '', unit: unit1 || unit2 };
  }
  
  // If only one has amount, return that one
  if (!amount1) return { amount: amount2, unit: unit2 };
  if (!amount2) return { amount: amount1, unit: unit1 };
  
  // Try to parse and combine amounts
  try {
    const num1 = eval(amount1); // Simple evaluation for fractions like "1/2"
    const num2 = eval(amount2);
    const total = num1 + num2;
    
    // Return as fraction if it's a simple fraction
    if (total === Math.floor(total)) {
      return { amount: total.toString(), unit: unit1 };
    } else {
      // Convert to fraction if possible
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      const denominator = 4; // Common denominator for cooking
      const numerator = Math.round(total * denominator);
      const divisor = gcd(numerator, denominator);
      return { 
        amount: `${numerator / divisor}/${denominator / divisor}`, 
        unit: unit1 
      };
    }
  } catch (e) {
    // If parsing fails, return the first amount
    return { amount: amount1, unit: unit1 };
  }
}

export async function generateIngredientsFromRecipe(userId, planId, recipeId) {
  // Get the recipe
  const { data: recipe, error: recipeError } = await supabaseAdmin
    .from('recipes')
    .select('ingredients')
    .eq('id', recipeId)
    .single();

  if (recipeError || !recipe) {
    throw new Error(`Failed to get recipe: ${recipeError?.message}`);
  }

  if (!recipe.ingredients) {
    return { success: true, data: [] };
  }

  // First, delete existing ingredients from this recipe for this plan
  const { error: deleteError } = await supabaseAdmin
    .from('ingredients')
    .delete()
    .eq('plan_id', planId)
    .eq('source_recipe_id', recipeId);

  if (deleteError) {
    console.error('Error deleting existing ingredients:', deleteError);
    // Continue anyway - we'll just add new ones
  }

  // Parse ingredients and create ingredient records
  const ingredientLines = recipe.ingredients
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('*'));

  const ingredients = [];
  for (let i = 0; i < ingredientLines.length; i++) {
    const line = ingredientLines[i].substring(1).trim(); // Remove the * prefix
    
    // Enhanced parsing to properly extract amount, unit, and ingredient name
    const parts = line.split(' ');
    let amount = '';
    let unit = '';
    let name = line;
    
    // Common units that should be recognized (excluding ingredient names)
    const units = [
      'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp',
      'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'gram', 'grams', 'g',
      'kilogram', 'kilograms', 'kg', 'liter', 'liters', 'l', 'milliliter', 'milliliters', 'ml',
      'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons', 'can', 'cans', 'jar', 'jars',
      'package', 'packages', 'bag', 'bags', 'box', 'boxes', 'bunch', 'bunches', 'head', 'heads',
      'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces', 'whole', 'halves', 'half'
    ];
    
    // Common ingredient names that should NOT be treated as units
    const ingredientNames = [
      'lemon', 'lime', 'orange', 'apple', 'banana', 'onion', 'garlic', 'tomato', 'carrot',
      'celery', 'pepper', 'lettuce', 'spinach', 'basil', 'parsley', 'cilantro', 'oregano',
      'thyme', 'rosemary', 'sage', 'mint', 'dill', 'chive', 'tarragon', 'chicken', 'beef',
      'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'milk', 'cheese',
      'butter', 'cream', 'yogurt', 'egg', 'eggs', 'bread', 'flour', 'sugar', 'salt',
      'pepper', 'oil', 'vinegar', 'rice', 'pasta', 'noodle', 'spaghetti', 'penne'
    ];
    
    // Try to extract amount and unit from the beginning
    if (parts.length > 1) {
      const firstPart = parts[0];
      // Handle mixed numbers like "1 1/2" by checking if first two parts form a mixed number
      if (/^\d+(\/\d+)?$/.test(firstPart) || /^\d+\/\d+$/.test(firstPart)) {
        amount = firstPart;
        
        // Check if this is a mixed number (like "1 1/2")
        if (parts.length > 2 && /^\d+\/\d+$/.test(parts[1])) {
          // Convert mixed number to improper fraction
          const whole = parseInt(firstPart);
          const fractionParts = parts[1].split('/');
          const numerator = parseInt(fractionParts[0]);
          const denominator = parseInt(fractionParts[1]);
          const improperNumerator = whole * denominator + numerator;
          amount = `${improperNumerator}/${denominator}`;
          
          if (parts.length > 3) {
            const thirdPart = parts[2].toLowerCase();
            // Only treat as unit if it's in units list AND not an ingredient name
            if (units.includes(thirdPart) && !ingredientNames.includes(thirdPart)) {
              unit = parts[2];
              name = parts.slice(3).join(' ');
            } else {
              // No recognized unit, so everything after amount is the ingredient name
              name = parts.slice(2).join(' ');
            }
          } else if (parts.length === 3) {
            // Only amount and ingredient name, no unit
            name = parts[2];
          }
        } else if (parts.length > 2) {
          const secondPart = parts[1].toLowerCase();
          // Only treat as unit if it's in units list AND not an ingredient name
          if (units.includes(secondPart) && !ingredientNames.includes(secondPart)) {
            unit = parts[1];
            name = parts.slice(2).join(' ');
          } else {
            // No recognized unit, so everything after amount is the ingredient name
            name = parts.slice(1).join(' ');
          }
        } else if (parts.length === 2) {
          // Only amount and ingredient name, no unit
          name = parts[1];
        }
      }
    }
    
    // Standardize unit abbreviations
    const unitAbbreviations = {
      'tablespoon': 'Tbsp',
      'tablespoons': 'Tbsp',
      'tbsp': 'Tbsp',
      'teaspoon': 'tsp',
      'teaspoons': 'tsp',
      'tsp': 'tsp',
      'pound': 'lb',
      'pounds': 'lb',
      'lbs': 'lb',
      'ounce': 'oz',
      'ounces': 'oz',
      'gram': 'g',
      'grams': 'g',
      'kilogram': 'kg',
      'kilograms': 'kg',
      'liter': 'L',
      'liters': 'L',
      'milliliter': 'mL',
      'milliliters': 'mL',
      'ml': 'mL',
      'pint': 'pt',
      'pints': 'pt',
      'quart': 'qt',
      'quarts': 'qt',
      'gallon': 'gal',
      'gallons': 'gal'
    };
    
    if (unit && unitAbbreviations[unit.toLowerCase()]) {
      unit = unitAbbreviations[unit.toLowerCase()];
    }
    
    // Clean up the ingredient name (remove common descriptors that aren't units)
    name = name.replace(/\b(large|medium|small|extra|fresh|dried|frozen|canned|whole|halves|half)\b/gi, '').trim();

    // Detect category
    const category = detectIngredientCategory(name);

    // Always create separate ingredient records for each recipe
    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .insert([{
        user_id: userId,
        plan_id: planId,
        source_recipe_id: recipeId,
        name: name,
        amount: amount,
        unit: unit,
        category: category,
        is_custom: false,
        position: i
      }])
      .select()
      .single();

    if (error) {
      console.error(`Failed to create ingredient "${name}":`, error);
      continue;
    }

    ingredients.push(data);
  }

  return { success: true, data: ingredients };
}

export async function refreshIngredientsFromRecipes(userId, planId) {
  // Get all recipes that have ingredients in this meal plan
  const { data: ingredients, error: ingredientsError } = await supabaseAdmin
    .from('ingredients')
    .select('source_recipe_id')
    .eq('plan_id', planId)
    .not('source_recipe_id', 'is', null);

  if (ingredientsError) {
    throw new Error(`Failed to get ingredients: ${ingredientsError.message}`);
  }

  // Get unique recipe IDs
  const recipeIds = [...new Set(ingredients.map(ing => ing.source_recipe_id))];
  
  const results = [];
  for (const recipeId of recipeIds) {
    try {
      const result = await generateIngredientsFromRecipe(userId, planId, recipeId);
      results.push(result);
    } catch (error) {
      console.error(`Error refreshing ingredients for recipe ${recipeId}:`, error);
      // Continue with other recipes
    }
  }

  return { success: true, data: results };
}

// New function to regenerate all ingredients for a meal plan with proper merging
export async function regenerateIngredientsForMealPlan(userId, planId) {
  console.log('regenerateIngredientsForMealPlan called with:', { userId, planId });
  
  // First, delete all non-custom ingredients for this plan
  const { error: deleteError } = await supabaseAdmin
    .from('ingredients')
    .delete()
    .eq('plan_id', planId)
    .eq('is_custom', false);

  if (deleteError) {
    throw new Error(`Failed to delete existing ingredients: ${deleteError.message}`);
  }
  
  console.log('Deleted existing ingredients for plan:', planId);

  // Get all selected meals for this plan
  const { data: selections, error: selectionsError } = await supabaseAdmin
    .from('meal_plan_selections')
    .select('meal_id')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .order('position', { ascending: true });

  console.log('Selections query result:', { selections, selectionsError });
  console.log('Plan ID being queried:', planId);

  if (selectionsError || !selections) {
    console.log('No selections found or error:', selectionsError);
    return { success: true, data: [] };
  }

  const selectedMealIds = selections.map(s => s.meal_id);
  console.log('Selected meal IDs for plan', planId, ':', selectedMealIds);
  
  if (selectedMealIds.length === 0) {
    console.log('No meals selected');
    return { success: true, data: [] };
  }

  // Get all recipes for selected meals
  const { data: recipes, error: recipesError } = await supabaseAdmin
    .from('recipes')
    .select('id, ingredients, meal_id')
    .in('meal_id', selectedMealIds);

  console.log('Recipes query result:', { recipes, recipesError });
  console.log('Number of recipes found for selected meals:', recipes?.length || 0);

  if (recipesError) {
    throw new Error(`Failed to get recipes: ${recipesError.message}`);
  }

  if (!recipes || recipes.length === 0) {
    console.log('No recipes found for selected meals');
    return { success: true, data: [] };
  }
  
  console.log('Found recipes:', recipes.length, 'for meals:', selectedMealIds);

  // Collect all ingredients from all recipes
  const allIngredients = [];
  for (const recipe of recipes) {
    if (!recipe.ingredients) continue;

    const ingredientLines = recipe.ingredients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('*'));

    for (let i = 0; i < ingredientLines.length; i++) {
      const line = ingredientLines[i].substring(1).trim(); // Remove the * prefix
      
    // Parse ingredient (same logic as generateIngredientsFromRecipe)
    const parts = line.split(' ');
    let amount = '';
    let unit = '';
    let name = line;
    
      
      const units = [
        'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp',
        'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'gram', 'grams', 'g',
        'kilogram', 'kilograms', 'kg', 'liter', 'liters', 'l', 'milliliter', 'milliliters', 'ml',
        'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons', 'can', 'cans', 'jar', 'jars',
        'package', 'packages', 'bag', 'bags', 'box', 'boxes', 'bunch', 'bunches', 'head', 'heads',
        'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces', 'whole', 'halves', 'half'
      ];
      
      const ingredientNames = [
        'lemon', 'lime', 'orange', 'apple', 'banana', 'onion', 'garlic', 'tomato', 'carrot',
        'celery', 'pepper', 'lettuce', 'spinach', 'basil', 'parsley', 'cilantro', 'oregano',
        'thyme', 'rosemary', 'sage', 'mint', 'dill', 'chive', 'tarragon', 'chicken', 'beef',
        'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'milk', 'cheese',
        'butter', 'cream', 'yogurt', 'egg', 'eggs', 'bread', 'flour', 'sugar', 'salt',
        'pepper', 'oil', 'vinegar', 'rice', 'pasta', 'noodle', 'spaghetti', 'penne'
      ];
      
      if (parts.length > 1) {
        const firstPart = parts[0];
        // Handle mixed numbers like "1 1/2" by checking if first two parts form a mixed number
        if (/^\d+(\/\d+)?$/.test(firstPart) || /^\d+\/\d+$/.test(firstPart)) {
          amount = firstPart;
          
          // Check if this is a mixed number (like "1 1/2")
          if (parts.length > 2 && /^\d+\/\d+$/.test(parts[1])) {
            // Convert mixed number to improper fraction
            const whole = parseInt(firstPart);
            const fractionParts = parts[1].split('/');
            const numerator = parseInt(fractionParts[0]);
            const denominator = parseInt(fractionParts[1]);
            const improperNumerator = whole * denominator + numerator;
            amount = `${improperNumerator}/${denominator}`;
            
            if (parts.length > 3) {
              const thirdPart = parts[2].toLowerCase();
              if (units.includes(thirdPart) && !ingredientNames.includes(thirdPart)) {
                unit = parts[2];
                name = parts.slice(3).join(' ');
              } else {
                name = parts.slice(2).join(' ');
              }
            } else if (parts.length === 3) {
              name = parts[2];
            }
          } else if (parts.length > 2) {
            const secondPart = parts[1].toLowerCase();
            if (units.includes(secondPart) && !ingredientNames.includes(secondPart)) {
              unit = parts[1];
              name = parts.slice(2).join(' ');
            } else {
              name = parts.slice(1).join(' ');
            }
          } else if (parts.length === 2) {
            name = parts[1];
          }
        }
      }
      
      // Standardize unit abbreviations
      const unitAbbreviations = {
        'tablespoon': 'Tbsp', 'tablespoons': 'Tbsp', 'tbsp': 'Tbsp',
        'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsp': 'tsp',
        'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
        'ounce': 'oz', 'ounces': 'oz',
        'gram': 'g', 'grams': 'g',
        'kilogram': 'kg', 'kilograms': 'kg',
        'liter': 'L', 'liters': 'L',
        'milliliter': 'mL', 'milliliters': 'mL', 'ml': 'mL',
        'pint': 'pt', 'pints': 'pt',
        'quart': 'qt', 'quarts': 'qt',
        'gallon': 'gal', 'gallons': 'gal'
      };
      
      if (unit && unitAbbreviations[unit.toLowerCase()]) {
        unit = unitAbbreviations[unit.toLowerCase()];
      }
      
      name = name.replace(/\b(large|medium|small|extra|fresh|dried|frozen|canned|whole|halves|half)\b/gi, '').trim();
      
      allIngredients.push({
        name,
        amount,
        unit,
        source_recipe_id: recipe.id,
        position: i
      });
    }
  }

         // Insert ingredients without combining (let client-side handle combining)
         const ingredientsToInsert = allIngredients.map((ingredient, index) => ({
           user_id: userId,
           plan_id: planId,
           source_recipe_id: ingredient.source_recipe_id,
           name: ingredient.name,
           amount: ingredient.amount,
           unit: ingredient.unit,
           category: detectIngredientCategory(ingredient.name),
           is_custom: false,
           position: index
         }));

  if (ingredientsToInsert.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .insert(ingredientsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to insert merged ingredients: ${error.message}`);
    }

    return { success: true, data };
  }

  return { success: true, data: [] };
}
