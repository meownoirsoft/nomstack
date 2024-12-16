import { json } from '@sveltejs/kit';
import { addMeal } from '$lib/db';

export async function POST({ request }) {
    const newRow = await request.json();
    try {
      const updatedData = await addMeal(newRow.name, newRow.source, newRow.cats, newRow.notes);
      return json({ success: true, data: updatedData });
    } catch (error) {
      console.error(error);
      return json({ success: false, data: 'Error adding meal' });
    }
}