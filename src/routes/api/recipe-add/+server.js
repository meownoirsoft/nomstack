import { json } from '@sveltejs/kit';
import { addRecipe } from '$lib/db.js';

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mealId, recipe } = await request.json();

    if (!mealId) {
      return json({ error: 'Meal ID is required' }, { status: 400 });
    }

    if (!recipe) {
      return json({ error: 'Recipe data is required' }, { status: 400 });
    }

    const newRecipe = await addRecipe(mealId, recipe, locals.userId);

    return json({
      success: true,
      recipe: newRecipe
    });
  } catch (error) {
    console.error('Error adding recipe:', error);
    return json(
      {
        error: 'Failed to add recipe',
        details: error.message
      },
      { status: 500 }
    );
  }
}
