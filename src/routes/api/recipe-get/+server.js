import { json } from '@sveltejs/kit';
import { getRecipe } from '$lib/db.js';

export async function GET({ url, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealId = url.searchParams.get('mealId');
    if (!mealId) {
      return json({ error: 'Meal ID is required' }, { status: 400 });
    }

    const recipe = await getRecipe(mealId, locals.userId);

    return json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Error getting recipe:', error);
    return json(
      {
        error: 'Failed to get recipe',
        details: error.message
      },
      { status: 500 }
    );
  }
}
