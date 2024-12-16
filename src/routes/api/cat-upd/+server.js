import { json } from '@sveltejs/kit';
import { updCats } from '$lib/db';

export async function POST({ request }) {
    const updRows = await request.json();
    const updatedData = [];
    try {
        updRows.cats.forEach(updRow => {
            updCats(updRow.id, updRow.name);
            updatedData.push(updRow);
        });
        return json({ success: true, data: updatedData });
    } catch (error) {
        console.error(error);
        return json({ success: false, data: 'Error updating cats' });
    }
}