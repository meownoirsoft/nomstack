import { json } from '@sveltejs/kit';
import { updSels } from '$lib/db';

export async function POST({ request }) {
  try {
    const updRow = await request.json();
    const updatedData = updSels(updRow.type, updRow.meals);
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}