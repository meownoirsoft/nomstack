import { json } from '@sveltejs/kit';
import { addMeal } from '$lib/db';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function POST({ request }) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newRow = await request.json();
        const mealId = await addMeal(newRow.name, newRow.source, newRow.cats, newRow.notes, user.id);
        return json({ success: true, data: { id: mealId } });
    } catch (error) {
      console.error('meal-add failed:', error);
      return json({ success: false, error: 'Error adding meal' }, { status: 500 });
    }
}
