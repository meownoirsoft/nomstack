import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { deleteRecipe } from '$lib/db.js';

export async function POST({ request }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await request.json();
    
    if (!recipeId) {
      return json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    await deleteRecipe(parseInt(recipeId));
    
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
