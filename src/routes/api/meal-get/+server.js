import { json } from '@sveltejs/kit';
import { getAllMeals, getLunches, getDinners } from '$lib/db';

export async function GET({ url, locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = url.searchParams.get('type');
    if (type === 'lunch') {
        return json(await getLunches(locals.userId));
    }
    if (type === 'dinner') {
        return json(await getDinners(locals.userId));
    }
    return json(await getAllMeals(locals.userId));
}