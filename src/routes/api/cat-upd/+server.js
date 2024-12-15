import { json } from '@sveltejs/kit';
import { updateRowInJson } from '$lib/helpers/jsonHelper.js';

export async function POST({ request }) {
    // Parse the request body
    const updRows = await request.json();

    const filePath = 'src/lib/data/cats.json';
    if (existsSync(filePath)) {
      console.log('File exists:', filePath);
      let updatedData = [];
      updRows.cats.forEach(updRow => {
          updateRowInJson(filePath, updRow);
          updatedData.push(updRow);
      });
      // Respond with the updated data
      return json({ success: true, data: updatedData });
    } else {
        console.error('File does not exist:', filePath);
        return json({ success: false, data: 'File does not exist' });
    }
    
}