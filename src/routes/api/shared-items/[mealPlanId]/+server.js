import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  try {
    const { mealPlanId } = params;

    if (!mealPlanId) {
      return json({ success: false, error: 'Meal plan ID is required' }, { status: 400 });
    }

    // Create a Supabase client with service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get shared items for this meal plan
    const { data: sharedItems, error: sharedItemsError } = await supabaseAdmin
      .from('shared_list_items')
      .select(`
        *,
        share_links!inner(meal_plan_id)
      `)
      .eq('share_links.meal_plan_id', mealPlanId)
      .order('created_at');

    if (sharedItemsError) {
      console.error('Error fetching shared items:', sharedItemsError);
      return json({ success: false, error: 'Failed to load shared items' }, { status: 500 });
    }

    console.log('Fetched shared items:', sharedItems);
    console.log('Shared items with created_by:', sharedItems?.map(item => ({ id: item.id, name: item.name, created_by: item.created_by })));

    // Ensure created_by is set for all items (handle existing items that might be null)
    const itemsWithDefaults = sharedItems?.map(item => ({
      ...item,
      created_by: item.created_by || 'Unknown'
    })) || [];

    return json({ success: true, data: itemsWithDefaults });
  } catch (error) {
    console.error('Error in shared items fetch:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
