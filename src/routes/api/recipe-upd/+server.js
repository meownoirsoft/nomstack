import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { updateRecipe } from '$lib/db.js';

export async function POST({ request }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId, recipe } = await request.json();
    
    if (!recipeId) {
      return json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    if (!recipe) {
      return json({ error: 'Recipe data is required' }, { status: 400 });
    }

    const updatedRecipe = await updateRecipe(parseInt(recipeId), recipe);
    
    return json({ 
      success: true, 
      recipe: updatedRecipe 
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return json({ 
      error: 'Failed to update recipe', 
      details: error.message 
    }, { status: 500 });
  }
}
