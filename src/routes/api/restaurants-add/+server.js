import { json } from '@sveltejs/kit';
import { addRestaurant } from '$lib/db';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const restaurant = await request.json();
        const newRestaurant = await addRestaurant(locals.userId, restaurant);

        return json({ success: true, restaurant: newRestaurant });
    } catch (error) {
        console.error('restaurants-add failed:', error);
        return json({ error: 'Unable to add restaurant' }, { status: 500 });
    }
}


