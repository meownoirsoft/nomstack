import { json } from '@sveltejs/kit';
import { delMeal } from '$lib/db';

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const delId = await request.json();

    const deleteData = await delMeal(delId, locals.userId);
    return json({ success: true, data: deleteData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
