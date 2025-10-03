import { json } from '@sveltejs/kit';
import { delMeal } from '$lib/db';
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
    const delId = await request.json();

    const deleteData = await delMeal(delId, user.id);
    return json({ success: true, data: deleteData });
  } catch (error) {
    console.error('meal-del failed:', error);
    return json({ success: false, error: 'Error deleting meal' }, { status: 500 });
  }
}
