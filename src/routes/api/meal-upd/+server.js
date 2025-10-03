import { json } from '@sveltejs/kit';
import { updMeal } from '$lib/db';
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

    // Parse the request body
    const updRow = await request.json();

    const updatedData = await updMeal(updRow.id, updRow.name, updRow.source, updRow.cats, updRow.notes, user.id);
    return json({ success: true, data: updatedData });
  } catch (error) {
    console.error('meal-upd failed:', error);
    return json({ success: false, error: 'Error updating meal' }, { status: 500 });
  }
}
