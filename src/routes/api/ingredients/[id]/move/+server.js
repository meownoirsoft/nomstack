import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { moveIngredient } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientId = params.id;
    const { store_id } = await request.json();
    
    // Allow null for unassigned ingredients
    if (store_id === undefined) {
      return json({ error: 'store_id is required' }, { status: 400 });
    }

    const result = await moveIngredient(ingredientId, store_id);
    return json(result);
  } catch (error) {
    console.error('Error moving ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
