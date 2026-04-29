import { json } from '@sveltejs/kit';
import { getAllRestaurants } from '$lib/db';

export async function GET({ locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const restaurants = await getAllRestaurants(locals.userId);
        return json(restaurants);
    } catch (error) {
        console.error('restaurants-get failed:', error);
        return json({ error: 'Unable to load restaurants' }, { status: 500 });
    }
}


