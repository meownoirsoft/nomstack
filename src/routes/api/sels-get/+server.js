import { json } from '@sveltejs/kit';
import { getAllSels, getLunchSels, getDinnerSels } from '$lib/db';

export async function GET({ url, locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    const planId = searchParams.get('plan_id') || null;
    if (!type) {
        const sels = await getAllSels(locals.userId, planId);
        return json(sels);
    }
    if (type === 'lunch') {
        const sels = await getLunchSels(locals.userId, planId);
        return json(sels);
    }
    if (type === 'dinner') {
        const sels = await getDinnerSels(locals.userId, planId);
        return json(sels);
    }
    return json([]);
}