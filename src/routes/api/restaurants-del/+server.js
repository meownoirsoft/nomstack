import { json } from '@sveltejs/kit';
import { deleteRestaurant } from '$lib/db';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();
        await deleteRestaurant(locals.userId, id);

        return json({ success: true });
    } catch (error) {
        console.error('restaurants-del failed:', error);
        return json({ error: 'Unable to delete restaurant' }, { status: 500 });
    }
}


