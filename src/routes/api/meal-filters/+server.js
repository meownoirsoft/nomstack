import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';
import { createClient } from '@supabase/supabase-js';

export async function GET({ request }) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'No authentication token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token) {
      return json({ success: false, error: 'No authentication token' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Create a Supabase client with the user's auth context
    const supabaseWithAuth = createClient(
      process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get meal filters for user
    const { data: filters, error } = await supabaseWithAuth
      .from('meal_filters')
      .select('*')
      .eq('user_id', user.id)
      .order('"order"');

    if (error) {
      console.error('Error fetching meal filters:', error);
      return json({ success: false, error: 'Failed to fetch meal filters' }, { status: 500 });
    }

    // Always include the default "All" filter at the beginning
    const allFilters = [
      { 
        id: 'all', 
        name: 'All', 
        order: 0, 
        is_default: true,
        user_id: user.id 
      },
      ...(filters || [])
    ];

    return json({ success: true, data: allFilters });
  } catch (error) {
    console.error('Error in meal-filters GET:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    console.log('POST /api/meal-filters: Starting request');
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST /api/meal-filters: No authorization header');
      return json({ success: false, error: 'No authentication token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!token) {
      console.log('POST /api/meal-filters: No token in header');
      return json({ success: false, error: 'No authentication token' }, { status: 401 });
    }

    console.log('POST /api/meal-filters: Token found, getting user');
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.log('POST /api/meal-filters: Invalid token:', userError);
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    console.log('POST /api/meal-filters: User authenticated:', user.id);
    const { filters } = await request.json();
    console.log('POST /api/meal-filters: Filters received:', filters);

    if (!filters || !Array.isArray(filters)) {
      return json({ success: false, error: 'Invalid filters data' }, { status: 400 });
    }

    // Create a Supabase client with the user's auth context
    const supabaseWithAuth = createClient(
      process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Delete existing filters for this user
    console.log('POST /api/meal-filters: Deleting existing filters for user:', user.id);
    const { error: deleteError } = await supabaseWithAuth
      .from('meal_filters')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting existing meal filters:', deleteError);
      return json({ success: false, error: 'Failed to update meal filters' }, { status: 500 });
    }
    console.log('POST /api/meal-filters: Existing filters deleted successfully');

    // Insert new filters (skip only the default "All" filter)
    const filtersToInsert = filters
      .filter(filter => !filter.is_default) // Skip only default filter, include system categories
      .map(filter => ({
        user_id: user.id,
        category_id: filter.category_id || null,
        flag: filter.flag || null,
        name: filter.name,
        "order": filter.order,
        is_system: filter.is_system || false
      }));

    console.log('POST /api/meal-filters: Filters to insert:', filtersToInsert);

    if (filtersToInsert.length > 0) {
      console.log('POST /api/meal-filters: Inserting filters into database');
      const { error: insertError } = await supabaseWithAuth
        .from('meal_filters')
        .insert(filtersToInsert);

      if (insertError) {
        console.error('Error inserting meal filters:', insertError);
        return json({ success: false, error: 'Failed to save meal filters' }, { status: 500 });
      }
      console.log('POST /api/meal-filters: Filters inserted successfully');
    } else {
      console.log('POST /api/meal-filters: No filters to insert (all were default)');
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in meal-filters POST:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
