import { json } from '@sveltejs/kit';
import { updCats } from '$lib/db';

export async function POST({ request, locals }) {
    if (!locals.userId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updRows = await request.json();
    const updatedData = [];
    try {
        for (const updRow of updRows.cats) {
            await updCats(updRow.id, updRow.name, locals.userId);
            updatedData.push(updRow);
        }
        return json({ success: true, data: updatedData });
    } catch (error) {
        console.error(error);
        return json({ success: false, data: 'Error updating cats' });
    }
}