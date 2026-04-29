import { json } from '@sveltejs/kit';
import { updSels } from '$lib/db';

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updRow = await request.json();
    const updatedData = await updSels(updRow.type, updRow.meals, locals.userId);
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}