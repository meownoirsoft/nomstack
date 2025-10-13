// Seed data for new users
import { supabase } from '$lib/supabaseClient.js';

// Default sources for new users
const DEFAULT_SOURCES = [
  { name: 'Instagram', abbrev: 'ig' },
  { name: 'Pinterest', abbrev: 'pin' },
  { name: 'Google Drive', abbrev: 'gdrive' },
  { name: 'Facebook', abbrev: 'fb' },
  { name: 'Saved Link', abbrev: 'link' },
  { name: 'AllRecipes', abbrev: 'ar' }
];

// Default stores for new users
const DEFAULT_STORES = [
  { name: 'Grocery Store', color: '#3b82f6' },
  { name: 'Costco', color: '#ef4444' },
  { name: 'Farmers Market', color: '#22c55e' }
];

// Default categories for new users
const DEFAULT_CATEGORIES = [
  { name: 'Breakfast', color: '#f59e0b', sort_order: 1 },
  { name: 'Lunch', color: '#10b981', sort_order: 2 },
  { name: 'Dinner', color: '#8b5cf6', sort_order: 3 },
  { name: 'Snack', color: '#f97316', sort_order: 4 },
  { name: 'Quick & Easy', color: '#ef4444', sort_order: 5 },
  { name: 'Slow Cooker', color: '#6b7280', sort_order: 6 },
  { name: 'Vegetarian', color: '#22c55e', sort_order: 7 },
  { name: 'Kid Friendly', color: '#eab308', sort_order: 8 },
  { name: 'Healthy', color: '#06b6d4', sort_order: 9 },
  { name: 'Comfort Food', color: '#a855f7', sort_order: 10 }
];

// Sample meals for new users
const SAMPLE_MEALS = [
  {
    name: 'Scrambled Eggs & Toast',
    notes: 'Quick and easy breakfast classic',
    category_ids: ['breakfast', 'quick-easy']
  },
  {
    name: 'Grilled Chicken Salad',
    notes: 'Light and healthy lunch option',
    category_ids: ['lunch', 'healthy']
  },
  {
    name: 'Spaghetti & Meatballs',
    notes: 'Family favorite comfort food',
    category_ids: ['dinner', 'kid-friendly', 'comfort-food']
  },
  {
    name: 'Slow Cooker Beef Stew',
    notes: 'Perfect for busy weeknights',
    category_ids: ['dinner', 'slow-cooker', 'comfort-food']
  },
  {
    name: 'Greek Yogurt Parfait',
    notes: 'Healthy snack with berries and granola',
    category_ids: ['snack', 'healthy']
  },
  {
    name: 'Turkey & Cheese Sandwich',
    notes: 'Simple lunch that kids love',
    category_ids: ['lunch', 'kid-friendly', 'quick-easy']
  },
  {
    name: 'Vegetarian Stir Fry',
    notes: 'Quick and colorful dinner',
    category_ids: ['dinner', 'vegetarian', 'quick-easy']
  },
  {
    name: 'Overnight Oats',
    notes: 'Make ahead breakfast',
    category_ids: ['breakfast', 'healthy']
  },
  {
    name: 'Chicken Noodle Soup',
    notes: 'Comforting and healing',
    category_ids: ['dinner', 'comfort-food']
  },
  {
    name: 'Apple Slices & Peanut Butter',
    notes: 'Simple and satisfying snack',
    category_ids: ['snack', 'kid-friendly']
  }
];

// Default meal filters for new users
const DEFAULT_MEAL_FILTERS = [
  { name: 'All Meals', category_id: null, is_system: true, order: 1 },
  { name: 'Breakfast', category_id: 'breakfast', is_system: true, order: 2 },
  { name: 'Lunch', category_id: 'lunch', is_system: true, order: 3 },
  { name: 'Dinner', category_id: 'dinner', is_system: true, order: 4 },
  { name: 'Snacks', category_id: 'snack', is_system: true, order: 5 },
  { name: 'Quick & Easy', category_id: 'quick-easy', is_system: true, order: 6 },
  { name: 'Kid Friendly', category_id: 'kid-friendly', is_system: true, order: 7 },
  { name: 'Vegetarian', category_id: 'vegetarian', is_system: true, order: 8 }
];

// Default meal plan for new users
const DEFAULT_MEAL_PLAN = {
  title: 'My First Meal Plan',
  start_date: new Date().toISOString().split('T')[0], // Today
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
};

/**
 * Set up seed data for a new user
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object>} - Result object with success status and created data
 */
export async function setupNewUserSeedData(userId) {
  try {
    console.log('Setting up seed data for new user:', userId);
    
    const result = {
      success: true,
      sources: [],
      categories: [],
      meals: [],
      mealFilters: [],
      mealPlan: null,
      errors: []
    };

    // 1. Create user profile if it doesn't exist
    console.log('Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: 'User', // Default display name
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      result.errors.push(`Profile: ${profileError.message}`);
    } else {
      console.log('Profile created/updated:', profile);
    }

    // 2. Create default sources
    console.log('Creating default sources...');
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .insert(
        DEFAULT_SOURCES.map(source => ({
          user_id: userId,
          name: source.name,
          abbrev: source.abbrev
        }))
      )
      .select();

    if (sourcesError) {
      console.error('Error creating sources:', sourcesError);
      result.errors.push(`Sources: ${sourcesError.message}`);
    } else {
      result.sources = sources || [];
      console.log(`Created ${result.sources.length} sources`);
    }

    // 3. Create default stores
    console.log('Creating default stores...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .insert(
        DEFAULT_STORES.map(store => ({
          user_id: userId,
          name: store.name,
          color: store.color
        }))
      )
      .select();

    if (storesError) {
      console.error('Error creating stores:', storesError);
      result.errors.push(`Stores: ${storesError.message}`);
    } else {
      result.stores = stores || [];
      console.log(`Created ${result.stores.length} default stores`);
    }

    // 4. Create default categories
    console.log('Creating default categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(
        DEFAULT_CATEGORIES.map(cat => ({
          user_id: userId,
          name: cat.name,
          color: cat.color,
          sort_order: cat.sort_order
        }))
      )
      .select();

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError);
      result.errors.push(`Categories: ${categoriesError.message}`);
    } else {
      result.categories = categories || [];
      console.log(`Created ${result.categories.length} categories`);
    }

    // 4. Create sample meals
    console.log('Creating sample meals...');
    const mealInserts = SAMPLE_MEALS.map(meal => ({
      user_id: userId,
      name: meal.name,
      notes: meal.notes
    }));

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .insert(mealInserts)
      .select();

    if (mealsError) {
      console.error('Error creating meals:', mealsError);
      result.errors.push(`Meals: ${mealsError.message}`);
    } else {
      result.meals = meals || [];
      console.log(`Created ${result.meals.length} sample meals`);
    }

    // 5. Create default meal filters
    console.log('Creating default meal filters...');
    const filterInserts = DEFAULT_MEAL_FILTERS.map(filter => {
      // Find the category ID for this filter
      const category = result.categories.find(cat => 
        cat.name.toLowerCase().replace(/\s+/g, '-') === filter.category_id
      );
      
      return {
        user_id: userId,
        name: filter.name,
        category_id: category?.id || null,
        is_system: filter.is_system,
        order: filter.order
      };
    });

    const { data: mealFilters, error: filtersError } = await supabase
      .from('meal_filters')
      .insert(filterInserts)
      .select();

    if (filtersError) {
      console.error('Error creating meal filters:', filtersError);
      result.errors.push(`Meal Filters: ${filtersError.message}`);
    } else {
      result.mealFilters = mealFilters || [];
      console.log(`Created ${result.mealFilters.length} meal filters`);
    }

    // 6. Create a default meal plan
    console.log('Creating default meal plan...');
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        title: DEFAULT_MEAL_PLAN.title,
        start_date: DEFAULT_MEAL_PLAN.start_date,
        end_date: DEFAULT_MEAL_PLAN.end_date
      })
      .select()
      .single();

    if (mealPlanError) {
      console.error('Error creating meal plan:', mealPlanError);
      result.errors.push(`Meal Plan: ${mealPlanError.message}`);
    } else {
      result.mealPlan = mealPlan;
      console.log('Created default meal plan:', mealPlan.title);
    }

    // 7. Create some sample meal plan selections
    if (result.mealPlan && result.meals.length > 0) {
      console.log('Creating sample meal plan selections...');
      const selections = [];
      
      // Add a few meals to the meal plan
      const selectedMeals = result.meals.slice(0, 5); // Take first 5 meals
      selectedMeals.forEach(meal => {
        selections.push({
          plan_id: result.mealPlan.id,
          meal_id: meal.id
        });
      });

      const { error: selectionsError } = await supabase
        .from('meal_plan_selections')
        .insert(selections);

      if (selectionsError) {
        console.error('Error creating meal plan selections:', selectionsError);
        result.errors.push(`Meal Plan Selections: ${selectionsError.message}`);
      } else {
        console.log(`Created ${selections.length} meal plan selections`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
      console.warn('Some seed data creation failed:', result.errors);
    } else {
      console.log('✅ Seed data setup completed successfully!');
    }

    return result;

  } catch (error) {
    console.error('Error setting up seed data:', error);
    return {
      success: false,
      categories: [],
      meals: [],
      mealFilters: [],
      mealPlan: null,
      errors: [`General error: ${error.message}`]
    };
  }
}

/**
 * Check if a user already has seed data
 * @param {string} userId - The user's UUID
 * @returns {Promise<boolean>} - True if user has existing data
 */
export async function userHasSeedData(userId) {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking seed data:', error);
      return false;
    }

    return categories && categories.length > 0;
  } catch (error) {
    console.error('Error checking seed data:', error);
    return false;
  }
}

/**
 * Get seed data statistics for a user
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object>} - Statistics about user's data
 */
export async function getSeedDataStats(userId) {
  try {
    const [categoriesResult, mealsResult, mealPlansResult] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('meals').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('meal_plans').select('id', { count: 'exact' }).eq('user_id', userId)
    ]);

    return {
      categories: categoriesResult.count || 0,
      meals: mealsResult.count || 0,
      mealPlans: mealPlansResult.count || 0,
      hasData: (categoriesResult.count || 0) > 0
    };
  } catch (error) {
    console.error('Error getting seed data stats:', error);
    return {
      categories: 0,
      meals: 0,
      mealPlans: 0,
      hasData: false
    };
  }
}
