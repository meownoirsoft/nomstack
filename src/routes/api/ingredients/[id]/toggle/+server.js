import { json } from '@sveltejs/kit';
import { toggleIngredient } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientId = params.id;
    const { field } = await request.json();

    if (!field || !['checked', 'deemphasized'].includes(field)) {
      return json({ error: 'field must be "checked" or "deemphasized"' }, { status: 400 });
    }

    const result = await toggleIngredient(ingredientId, field, locals.userId);
    return json(result);
  } catch (error) {
    console.error('Error toggling ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
