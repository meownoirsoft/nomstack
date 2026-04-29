import { json } from '@sveltejs/kit';
import { deleteRecipe } from '$lib/db.js';

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await request.json();

    if (!recipeId) {
      return json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    await deleteRecipe(recipeId, locals.userId);

    return json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return json({
      error: 'Failed to delete recipe',
      details: error.message
    }, { status: 500 });
  }
}
