import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { regenerateIngredientsForMealPlan } from '$lib/db.js';

export async function POST({ request, locals }) {
  try {
    const { plan_id } = await request.json();
    
    if (!plan_id) {
      return json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await regenerateIngredientsForMealPlan(userId, plan_id);
    
    return json(result);
  } catch (error) {
    console.error('Error regenerating ingredients:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
