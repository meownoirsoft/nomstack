import { json } from '@sveltejs/kit';
import { addRowToJson } from '$lib/helpers/jsonHelper.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function POST({ request }) {
    // Parse the request body
    const newRow = await request.json();

    // Path to the JSON file
    const filePath = 'src/lib/data/cats.json';

    if (existsSync(filePath)) {
      console.log('File exists:', filePath);
      const updatedData = addRowToJson(filePath, newRow);
      // Respond with the updated data
      return json({ success: true, data: updatedData });
    } else {
        console.error('File does not exist:', filePath);
        return json({ success: false, data: 'File does not exist' });
    }
    
}