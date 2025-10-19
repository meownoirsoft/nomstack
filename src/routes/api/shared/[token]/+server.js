import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  try {
    const { token } = params;

    if (!token) {
      return json({ success: false, error: 'Token is required' }, { status: 400 });
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

    // Get share link and verify it's valid
    const { data: shareLink, error: shareError } = await supabaseAdmin
      .from('share_links')
      .select(`
        *,
        meal_plans!inner(title)
      `)
      .eq('share_token', token)
      .single();

    if (shareError || !shareLink) {
      console.error('Share link error:', shareError);
      console.error('Share link data:', shareLink);
      return json({ success: false, error: 'Invalid or expired share link' }, { status: 404 });
    }

    console.log('Share link found:', shareLink);

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return json({ success: false, error: 'Share link has expired' }, { status: 410 });
    }

    // Get ingredients for this meal plan
    const { data: ingredients, error: ingredientsError } = await supabaseAdmin
      .from('ingredients')
      .select(`
        *,
        shared_comments!left(
          id,
          comment,
          created_at
        )
      `)
      .eq('plan_id', shareLink.meal_plan_id)
      .is('store_id', null) // Only show items in the "List" tab
      .order('name');

    if (ingredientsError) {
      console.error('Error fetching ingredients:', ingredientsError);
      console.error('Meal plan ID:', shareLink.meal_plan_id);
      return json({ success: false, error: 'Failed to load shopping list' }, { status: 500 });
    }

    console.log('Ingredients loaded:', ingredients?.length || 0);

    // For the shared page, only show original meal plan items
    // Shared items will appear in the list owner's shopping list
    const allItems = ingredients.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      comments: ingredient.shared_comments || [],
      type: 'ingredient'
    }));

    return json({
      success: true,
      data: {
        meal_plan_title: shareLink.meal_plans.title,
        ingredients: allItems,
        share_link: shareLink
      }
    });
  } catch (error) {
    console.error('Error in shared list fetch:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
