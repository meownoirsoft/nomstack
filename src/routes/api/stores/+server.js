import { json } from '@sveltejs/kit';
import { createStore, getStores, updateStore, deleteStore } from '$lib/db.js';

export async function GET({ locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stores = await getStores(locals.userId);
    return json({ success: true, data: stores });
  } catch (error) {
    console.error('Error getting stores:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeData = await request.json();
    const result = await createStore(locals.userId, storeData);
    return json(result);
  } catch (error) {
    console.error('Error creating store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
