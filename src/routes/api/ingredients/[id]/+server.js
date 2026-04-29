import { json } from '@sveltejs/kit';
import { updateIngredient, deleteIngredient } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientId = params.id;
    const ingredientData = await request.json();
    const result = await updateIngredient(ingredientId, ingredientData, locals.userId);
    return json(result);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ locals, params }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientId = params.id;
    const result = await deleteIngredient(ingredientId, locals.userId);
    return json(result);
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
