import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { createIngredient, getIngredients, updateIngredient, deleteIngredient } from '$lib/db.js';

export async function GET({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const filters = {};
    
    if (url.searchParams.get('store_id')) {
      filters.store_id = url.searchParams.get('store_id');
    }
    if (url.searchParams.get('plan_id')) {
      filters.plan_id = url.searchParams.get('plan_id');
    }
    if (url.searchParams.get('category')) {
      filters.category = url.searchParams.get('category');
    }

    const ingredients = await getIngredients(userId, filters);
    return json({ success: true, data: ingredients });
  } catch (error) {
    console.error('Error getting ingredients:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredientData = await request.json();
    const result = await createIngredient(userId, ingredientData);
    return json(result);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
