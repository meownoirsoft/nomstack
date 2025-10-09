import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { refreshIngredientsFromRecipes } from '$lib/db.js';

export async function POST({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id } = await request.json();
    
    if (!plan_id) {
      return json({ error: 'plan_id is required' }, { status: 400 });
    }

    const result = await refreshIngredientsFromRecipes(userId, plan_id);
    return json(result);
  } catch (error) {
    console.error('Error refreshing ingredients:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
