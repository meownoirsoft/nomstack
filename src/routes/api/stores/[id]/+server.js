import { json } from '@sveltejs/kit';
import { updateStore, deleteStore } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = params.id;
    const storeData = await request.json();
    const result = await updateStore(storeId, storeData, locals.userId);
    return json(result);
  } catch (error) {
    console.error('Error updating store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ locals, params }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = params.id;
    const result = await deleteStore(storeId, locals.userId);
    return json(result);
  } catch (error) {
    console.error('Error deleting store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
