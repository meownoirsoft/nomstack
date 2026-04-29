import { json } from '@sveltejs/kit';
import { regenerateIngredientsForMealPlan } from '$lib/db.js';

export async function POST({ request, locals }) {
  try {
    const { plan_id } = await request.json();

    if (!plan_id) {
      return json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    if (!locals.userId) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await regenerateIngredientsForMealPlan(locals.userId, plan_id);

    return json(result);
  } catch (error) {
    console.error('Error regenerating ingredients:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
