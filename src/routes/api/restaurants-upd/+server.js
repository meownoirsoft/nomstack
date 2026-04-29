import { json } from '@sveltejs/kit';
import { updateRestaurant } from '$lib/db';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const restaurant = await request.json();
        const updatedRestaurant = await updateRestaurant(locals.userId, restaurant);

        return json({ success: true, restaurant: updatedRestaurant });
    } catch (error) {
        console.error('restaurants-upd failed:', error);
        return json({ error: 'Unable to update restaurant' }, { status: 500 });
    }
}


