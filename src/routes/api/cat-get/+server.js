import { json } from '@sveltejs/kit';
import { getAllCats } from '$lib/db';

export async function GET({ locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cats = await getAllCats(locals.userId);
    return json(cats);
}