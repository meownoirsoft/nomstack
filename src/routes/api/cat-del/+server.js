import { json } from '@sveltejs/kit';
import { deleteRowInJson } from '$lib/helpers/jsonHelper.js';
import { existsSync } from 'fs';

export async function DELETE({ request }) {
    // Parse the request body
    const delRow = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/cats.json';
    if (existsSync(filePath)) {
      console.log('File exists:', filePath);
      const deleteData = deleteRowInJson(filePath, delRow);
      // Respond with the updated data
      return json({ success: true, data: updatedData });
    } else {
        console.error('File does not exist:', filePath);
        return json({ success: false, data: 'File does not exist' });
    }
}