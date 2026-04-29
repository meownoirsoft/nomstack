import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

const DEFAULT_SOURCES = [
	{ name: 'Instagram', abbrev: 'ig' },
	{ name: 'Pinterest', abbrev: 'pin' },
	{ name: 'Google Drive', abbrev: 'gdrive' },
	{ name: 'Facebook', abbrev: 'fb' },
	{ name: 'Saved Link', abbrev: 'link' },
	{ name: 'AllRecipes', abbrev: 'ar' }
];

const DEFAULT_STORES = [
	{ name: 'Grocery Store', color: '#3b82f6' },
	{ name: 'Costco', color: '#ef4444' },
	{ name: 'Farmers Market', color: '#22c55e' }
];

const DEFAULT_CATEGORIES = [
	{ name: 'Breakfast', color: '#f59e0b', sort_order: 1 },
	{ name: 'Lunch', color: '#10b981', sort_order: 2 },
	{ name: 'Dinner', color: '#8b5cf6', sort_order: 3 },
	{ name: 'Snack', color: '#f97316', sort_order: 4 },
	{ name: 'Dessert', color: '#ec4899', sort_order: 5 },
	{ name: 'Side', color: '#84cc16', sort_order: 6 },
	{ name: 'Quick & Easy', color: '#ef4444', sort_order: 7 },
	{ name: 'Slow Cooker', color: '#6b7280', sort_order: 8 },
	{ name: 'Vegetarian', color: '#22c55e', sort_order: 9 },
	{ name: 'Kid Friendly', color: '#eab308', sort_order: 10 },
	{ name: 'Healthy', color: '#06b6d4', sort_order: 11 },
	{ name: 'Comfort Food', color: '#a855f7', sort_order: 12 }
];

const SAMPLE_MEALS = [
	{ name: 'Scrambled Eggs & Toast', notes: 'Quick and easy breakfast classic' },
	{ name: 'Grilled Chicken Salad', notes: 'Light and healthy lunch option' },
	{ name: 'Spaghetti & Meatballs', notes: 'Family favorite comfort food' },
	{ name: 'Slow Cooker Beef Stew', notes: 'Perfect for busy weeknights' },
	{ name: 'Greek Yogurt Parfait', notes: 'Healthy snack with berries and granola' }
];

const DEFAULT_MEAL_FILTERS = [
	{ name: 'Breakfast', category_key: 'breakfast', is_system: true, order: 1 },
	{ name: 'Lunch', category_key: 'lunch', is_system: true, order: 2 },
	{ name: 'Dinner', category_key: 'dinner', is_system: true, order: 3 },
	{ name: 'Snack', category_key: 'snack', is_system: true, order: 4 },
	{ name: 'Dessert', category_key: 'dessert', is_system: true, order: 5 },
	{ name: 'Side', category_key: 'side', is_system: true, order: 6 },
	{ name: 'Healthy', category_key: 'healthy', is_system: true, order: 7 },
	{ name: 'Quick & Easy', category_key: 'quick-easy', is_system: true, order: 8 },
	{ name: 'Kid Friendly', category_key: 'kid-friendly', is_system: true, order: 9 },
	{ name: 'Vegetarian', category_key: 'vegetarian', is_system: true, order: 10 }
];

function categoryKey(name) {
	return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
}

async function userHasSeedDataServer(userId) {
	const { data, error } = await supabaseAdmin
		.from('categories')
		.select('id')
		.eq('user_id', userId)
		.limit(1);
	if (error) return false;
	return data && data.length > 0;
}

async function getStats(userId) {
	const tables = ['categories', 'meals', 'meal_plans'];
	const counts = {};
	for (const t of tables) {
		const { data } = await supabaseAdmin.from(t).select('id').eq('user_id', userId);
		counts[t] = (data || []).length;
	}
	return {
		categories: counts.categories,
		meals: counts.meals,
		mealPlans: counts.meal_plans,
		hasData: counts.categories > 0
	};
}

async function setupSeed(userId) {
	const result = {
		success: true,
		sources: [],
		stores: [],
		categories: [],
		meals: [],
		mealFilters: [],
		mealPlan: null,
		errors: []
	};

	// Reset semantics: clicking "Setup Sample Data" wipes the seed-shaped tables
	// for this user and reinserts. Leaves user-created data in restaurants,
	// recipes, ingredients, pantry_items, share_links, etc. alone.
	const tablesToReset = [
		'meal_plan_selections',
		'meal_filters',
		'meal_plans',
		'meals',
		'categories',
		'stores',
		'sources'
	];
	for (const table of tablesToReset) {
		const { error: delErr } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
		if (delErr) result.errors.push(`Reset ${table}: ${delErr.message}`);
	}

	const { data: sources, error: sourcesError } = await supabaseAdmin
		.from('sources')
		.insert(DEFAULT_SOURCES.map((s) => ({ user_id: userId, name: s.name, abbrev: s.abbrev })))
		.select();
	if (sourcesError) result.errors.push(`Sources: ${sourcesError.message}`);
	else result.sources = sources || [];

	const { data: stores, error: storesError } = await supabaseAdmin
		.from('stores')
		.insert(DEFAULT_STORES.map((s) => ({ user_id: userId, name: s.name, color: s.color })))
		.select();
	if (storesError) result.errors.push(`Stores: ${storesError.message}`);
	else result.stores = stores || [];

	const { data: categories, error: categoriesError } = await supabaseAdmin
		.from('categories')
		.insert(
			DEFAULT_CATEGORIES.map((c) => ({
				user_id: userId,
				name: c.name,
				color: c.color,
				sort_order: c.sort_order
			}))
		)
		.select();
	if (categoriesError) result.errors.push(`Categories: ${categoriesError.message}`);
	else result.categories = categories || [];

	const { data: meals, error: mealsError } = await supabaseAdmin
		.from('meals')
		.insert(SAMPLE_MEALS.map((m) => ({ user_id: userId, name: m.name, notes: m.notes })))
		.select();
	if (mealsError) result.errors.push(`Meals: ${mealsError.message}`);
	else result.meals = meals || [];

	const filterInserts = DEFAULT_MEAL_FILTERS.map((filter) => {
		const category = result.categories.find((cat) => categoryKey(cat.name) === filter.category_key);
		return {
			user_id: userId,
			name: filter.name,
			category_id: category?.id || null,
			is_system: filter.is_system,
			order: filter.order
		};
	});
	const { data: mealFilters, error: filtersError } = await supabaseAdmin
		.from('meal_filters')
		.insert(filterInserts)
		.select();
	if (filtersError) result.errors.push(`Meal Filters: ${filtersError.message}`);
	else result.mealFilters = mealFilters || [];

	const today = new Date().toISOString().split('T')[0];
	const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

	const { data: mealPlan, error: mealPlanError } = await supabaseAdmin
		.from('meal_plans')
		.insert({
			user_id: userId,
			title: 'My First Meal Plan',
			start_date: today,
			end_date: weekFromNow
		})
		.select()
		.single();
	if (mealPlanError) result.errors.push(`Meal Plan: ${mealPlanError.message}`);
	else result.mealPlan = mealPlan;

	if (result.mealPlan && result.meals.length > 0) {
		const selections = result.meals.slice(0, 5).map((meal) => ({
			user_id: userId,
			plan_id: result.mealPlan.id,
			meal_id: meal.id
		}));
		const { error: selectionsError } = await supabaseAdmin
			.from('meal_plan_selections')
			.insert(selections);
		if (selectionsError) result.errors.push(`Meal Plan Selections: ${selectionsError.message}`);
	}

	if (result.errors.length > 0) {
		result.success = false;
		console.error('[seed-user-data] errors during setup for user', userId, ':');
		for (const err of result.errors) console.error('  -', err);
	}
	return result;
}

async function addMissingCategories(userId) {
	const { data: existing } = await supabaseAdmin
		.from('categories')
		.select('name')
		.eq('user_id', userId);
	const existingNames = (existing || []).map((c) => c.name);

	const newCategories = [
		{ name: 'Dessert', color: '#ec4899', sort_order: 5 },
		{ name: 'Side', color: '#84cc16', sort_order: 6 }
	];
	const toAdd = newCategories.filter((c) => !existingNames.includes(c.name));
	if (toAdd.length === 0) {
		return { success: true, added: 0, categories: [], message: 'All categories already exist' };
	}

	const { data: added, error: insertError } = await supabaseAdmin
		.from('categories')
		.insert(
			toAdd.map((c) => ({
				user_id: userId,
				name: c.name,
				color: c.color,
				sort_order: c.sort_order
			}))
		)
		.select('id, name');
	if (insertError) {
		return { success: false, error: insertError.message, added: 0, categories: [] };
	}
	return {
		success: true,
		added: added.length,
		categories: added,
		message: `Added ${added.length} new categories`
	};
}

export async function GET({ url, locals }) {
	if (!locals.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const action = url.searchParams.get('action');
	if (action === 'stats') {
		return json(await getStats(locals.userId));
	}
	const hasData = await userHasSeedDataServer(locals.userId);
	return json({ hasData });
}

export async function POST({ request, locals }) {
	if (!locals.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	let body = {};
	try {
		body = await request.json();
	} catch {
		// no-op
	}
	const action = body?.action || 'setup';
	if (action === 'add-missing-categories') {
		return json(await addMissingCategories(locals.userId));
	}
	return json(await setupSeed(locals.userId));
}
