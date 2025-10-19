import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

export async function POST({ params, request }) {
  try {
    const { mealPlanId } = params;
    const { expires_at } = await request.json();

    if (!mealPlanId) {
      return json({ success: false, error: 'Meal plan ID is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Verify user owns the meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('id, user_id')
      .eq('id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (mealPlanError || !mealPlan) {
      return json({ success: false, error: 'Meal plan not found' }, { status: 404 });
    }

    // Generate new secure token
    const shareToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    const shareUrl = `/shared/${shareToken}`;

    // Update existing share link or create new one
    const { data: shareLink, error: regenerateError } = await supabase
      .from('share_links')
      .upsert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        share_token: shareToken,
        share_url: shareUrl,
        expires_at: expires_at || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (regenerateError) {
      console.error('Error regenerating share link:', regenerateError);
      return json({ success: false, error: 'Failed to regenerate share link' }, { status: 500 });
    }

    return json({ success: true, data: shareLink });
  } catch (error) {
    console.error('Error in share link regeneration:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
