import { json } from '@sveltejs/kit';
import { createShoppingList, getShoppingLists, updateShoppingList, deleteShoppingList } from '$lib/db.js';

export async function GET({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const planId = url.searchParams.get('plan_id');

    if (!planId) {
      return json({ error: 'plan_id is required' }, { status: 400 });
    }

    const shoppingLists = await getShoppingLists(planId, locals.userId);
    return json({ success: true, data: shoppingLists });
  } catch (error) {
    console.error('Error getting shopping lists:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, store_id, title } = await request.json();

    if (!plan_id || !store_id) {
      return json({ error: 'plan_id and store_id are required' }, { status: 400 });
    }

    const result = await createShoppingList(plan_id, store_id, title);
    return json(result);
  } catch (error) {
    console.error('Error creating shopping list:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
