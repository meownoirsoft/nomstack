import { json } from '@sveltejs/kit';
import { updateRowInJson } from '$lib/helpers/jsonHelper.js';

export async function POST({ request }) {
  try {
    // Parse the request body
    const updRows = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/cats.json';
    let updatedData = [];
    updRows.cats.forEach(updRow => {
        updateRowInJson(filePath, updRow);
        updatedData.push(updRow);
    });

    // Respond with the updated data
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}