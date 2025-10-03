import { json } from '@sveltejs/kit';
import { deleteRestaurant } from '$lib/db';
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
            return json({ error: 'Unauthorized' }, { status: 500 });
        }

        const { id } = await request.json();
        await deleteRestaurant(user.id, id);
        
        return json({ success: true });
    } catch (error) {
        console.error('restaurants-del failed:', error);
        return json({ error: 'Unable to delete restaurant' }, { status: 500 });
    }
}


