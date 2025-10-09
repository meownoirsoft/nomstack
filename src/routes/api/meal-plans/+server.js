import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { createMealPlan, getMealPlans, updateMealPlan, deleteMealPlan } from '$lib/db.js';

export async function GET({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';

    const mealPlans = await getMealPlans(userId, status);
    return json({ success: true, data: mealPlans });
  } catch (error) {
    console.error('Error getting meal plans:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planData = await request.json();
    const result = await createMealPlan(userId, planData);
    return json(result);
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
