import { json } from '@sveltejs/kit';
import { getAllRestaurants } from '$lib/db';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function GET({ request }) {
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

        const restaurants = await getAllRestaurants(user.id);
        return json(restaurants);
    } catch (error) {
        console.error('restaurants-get failed:', error);
        return json({ error: 'Unable to load restaurants' }, { status: 500 });
    }
}


