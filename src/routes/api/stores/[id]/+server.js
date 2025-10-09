import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { updateStore, deleteStore } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = params.id;
    const storeData = await request.json();
    const result = await updateStore(storeId, storeData);
    return json(result);
  } catch (error) {
    console.error('Error updating store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = params.id;
    const result = await deleteStore(storeId);
    return json(result);
  } catch (error) {
    console.error('Error deleting store:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
