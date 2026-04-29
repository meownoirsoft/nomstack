import { json } from '@sveltejs/kit';
import { getAllSrcs } from '$lib/db';

export async function GET({ locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const srcs = await getAllSrcs(locals.userId);
    return json(srcs);
}