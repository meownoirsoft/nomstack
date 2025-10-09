import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { updateShoppingList, deleteShoppingList } from '$lib/db.js';

export async function PATCH({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const listData = await request.json();
    const result = await updateShoppingList(listId, listData);
    return json(result);
  } catch (error) {
    console.error('Error updating shopping list:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ request, locals, params }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listId = params.id;
    const result = await deleteShoppingList(listId);
    return json(result);
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
