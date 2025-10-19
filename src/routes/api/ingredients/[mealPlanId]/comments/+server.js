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

    // Get comments for all ingredients in this meal plan
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('shared_comments')
      .select(`
        id,
        ingredient_id,
        comment,
        created_by,
        created_at,
        share_links!inner(meal_plan_id)
      `)
      .eq('share_links.meal_plan_id', mealPlanId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments for meal plan:', commentsError);
      return json({ success: false, error: 'Failed to load comments' }, { status: 500 });
    }

    // Group comments by ingredient_id
    const commentsByIngredient = comments.reduce((acc, comment) => {
      if (!acc[comment.ingredient_id]) {
        acc[comment.ingredient_id] = [];
      }
      acc[comment.ingredient_id].push({
        id: comment.id,
        comment: comment.comment,
        created_by: comment.created_by,
        created_at: comment.created_at
      });
      return acc;
    }, {});

    return json({ success: true, data: commentsByIngredient });
  } catch (error) {
    console.error('Error in getCommentsForMealPlan API:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
