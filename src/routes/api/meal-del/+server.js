import { json } from '@sveltejs/kit';
import { deleteRowInJson } from '$lib/helpers/jsonHelper.js';

export async function POST({ request }) {
  try {
    // Parse the request body
    const delRow = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/meals.json';

    // Add the new row
    const deleteData = deleteRowInJson(filePath, delRow);

    // Respond with the updated data
    return json({ success: true, data: deleteData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}