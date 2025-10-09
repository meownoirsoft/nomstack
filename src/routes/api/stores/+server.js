import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { createStore, getStores, updateStore, deleteStore } from '$lib/db.js';

export async function GET({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stores = await getStores(userId);
    return json({ success: true, data: stores });
  } catch (error) {
    console.error('Error getting stores:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeData = await request.json();
    const result = await createStore(userId, storeData);
    return json(result);
  } catch (error) {
    console.error('Error creating store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
