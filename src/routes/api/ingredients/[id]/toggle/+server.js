import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { toggleIngredient } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientId = params.id;
    const { field } = await request.json();
    
    if (!field || !['checked', 'deemphasized'].includes(field)) {
      return json({ error: 'field must be "checked" or "deemphasized"' }, { status: 400 });
    }

    const result = await toggleIngredient(ingredientId, field);
    return json(result);
  } catch (error) {
    console.error('Error toggling ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
