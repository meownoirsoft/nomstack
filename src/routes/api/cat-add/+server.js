import { json } from '@sveltejs/kit';
import { addRowToJson } from '$lib/helpers/jsonHelper.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__filename)
console.log(__dirname)

export async function POST({ request }) {
  try {
    // Parse the request body
    const newRow = await request.json();

    // Path to the JSON file
    const filePath = path.resolve(__dirname, '../../../lib/data/cats.json');
    // const filePath = 'src/lib/data/cats.json';

    if (existsSync(filePath)) {
      console.log('File exists:', filePath);
      const updatedData = addRowToJson(filePath, newRow);
    } else {
        console.error('File does not exist:', filePath);
    }

    // Respond with the updated data
    return json({ success: true, data: updatedData });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}