import { json } from '@sveltejs/kit';
import { updateRowInJson } from '$lib/helpers/jsonHelper.js';

export async function POST({ request }) {
  try {
    // Parse the request body
    const updRow = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/selected.json';

    // Add the new row
    const updatedData = updateRowInJson(filePath, updRow);

    // Respond with the updated data
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}