import { json } from '@sveltejs/kit';
import { updSels } from '$lib/db';
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

    const updRow = await request.json();
    const type = updRow.type ?? updRow.id;
    if (!type) {
      return json({ success: false, error: 'Selection type is required.' }, { status: 400 });
    }
    const meals = Array.isArray(updRow.meals)
      ? updRow.meals.map((value) => String(value).trim()).filter(Boolean)
      : String(updRow.meals ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

    const updatedData = await updSels(type, meals, user.id);
    return json({ success: true, data: updatedData });
  } catch (error) {
    console.error('sels-upd failed:', error);
    return json({ success: false, error: 'Unable to update selections' }, { status: 500 });
  }
}
