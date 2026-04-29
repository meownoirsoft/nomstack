import { json } from '@sveltejs/kit';
import { addMeal } from '$lib/db';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newRow = await request.json();
        const mealId = await addMeal(newRow.name, newRow.source, newRow.cats, newRow.notes, locals.userId);
        return json({ success: true, data: { id: mealId } });
    } catch (error) {
      console.error('meal-add failed:', error);
      return json({ success: false, error: 'Error adding meal' }, { status: 500 });
    }
}
