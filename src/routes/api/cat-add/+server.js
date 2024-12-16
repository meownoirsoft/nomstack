import { json } from '@sveltejs/kit';
import { addCat } from '$lib/db';

export async function POST({ request }) {
    const newRow = await request.json();

    try {
      const updatedData = await addCat(newRow.name);
      return json({ success: true, data: updatedData });
    } catch (error) {
      console.error(error);
      return json({ success: false, data: 'Error adding cat' });
    }
}