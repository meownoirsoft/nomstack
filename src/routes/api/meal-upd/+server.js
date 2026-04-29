import { json } from '@sveltejs/kit';
import { updMeal } from '$lib/db';

export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const updRow = await request.json();

    const updatedData = await updMeal(updRow.id, updRow.name, updRow.source, updRow.cats, updRow.notes, locals.userId);
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
