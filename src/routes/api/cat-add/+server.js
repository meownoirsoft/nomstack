import { json } from '@sveltejs/kit';
import { addCat } from '$lib/db';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newRow = await request.json();
        const id = await addCat(newRow.name, locals.userId);
        return json({ success: true, data: { id } });
    } catch (error) {
      console.error('cat-add failed:', error);
      return json({ success: false, error: 'Error adding category' }, { status: 500 });
    }
}
