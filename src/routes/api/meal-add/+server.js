import { json } from '@sveltejs/kit';
import { addRowToJson } from '$lib/helpers/jsonHelper.js';

export async function POST({ request }) {
  try {
    // Parse the request body
    const newRow = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/meals.json';

    // Add the new row
    const updatedData = addRowToJson(filePath, newRow);

    // Respond with the updated data
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
