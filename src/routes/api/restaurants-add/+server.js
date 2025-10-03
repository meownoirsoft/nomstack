import { json } from '@sveltejs/kit';
import { addRestaurant } from '$lib/db';
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

        const restaurant = await request.json();
        const newRestaurant = await addRestaurant(user.id, restaurant);
        
        return json({ success: true, restaurant: newRestaurant });
    } catch (error) {
        console.error('restaurants-add failed:', error);
        return json({ error: 'Unable to add restaurant' }, { status: 500 });
    }
}


