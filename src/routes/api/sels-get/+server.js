import { json } from '@sveltejs/kit';
import { getAllSels, getLunchSels, getDinnerSels } from '$lib/db';

export async function GET({ url, locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    if (!type) {
        const sels = await getAllSels(locals.userId);
        return json(sels);
    }
    if (type === 'lunch') {
        const sels = await getLunchSels(locals.userId);
        return json(sels);
    }
    if (type === 'dinner') {
        const sels = await getDinnerSels(locals.userId);
        return json(sels);
    }
    return json([]);
}