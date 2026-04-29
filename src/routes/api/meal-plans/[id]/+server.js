import { json } from '@sveltejs/kit';
import { deleteMealPlan, updateMealPlan } from '$lib/db';

export async function PATCH({ params, request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;
    const updates = await request.json();

    const result = await updateMealPlan(planId, updates, locals.userId);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('meal-plans PATCH failed:', error);
    return json({ success: false, error: 'Unable to update meal plan' }, { status: 500 });
  }
}

export async function DELETE({ params, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;

    const result = await deleteMealPlan(planId, locals.userId);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('meal-plans DELETE failed:', error);
    return json({ success: false, error: 'Unable to delete meal plan' }, { status: 500 });
  }
}