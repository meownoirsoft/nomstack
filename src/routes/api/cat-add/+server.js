import { json } from '@sveltejs/kit';
import { addCat } from '$lib/db';
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
        const id = await addCat(newRow.name, user.id);
        return json({ success: true, data: { id } });
    } catch (error) {
      console.error('cat-add failed:', error);
      return json({ success: false, error: 'Error adding category' }, { status: 500 });
    }
}
