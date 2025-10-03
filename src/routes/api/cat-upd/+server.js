import { json } from '@sveltejs/kit';
import { updCats } from '$lib/db';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function POST({ request }) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updRows = await request.json();
        await Promise.all(
            updRows.cats.map((updRow) => updCats(updRow.id, updRow.name, user.id))
        );
        return json({ success: true });
    } catch (error) {
        console.error('cat-upd failed:', error);
        return json({ success: false, error: 'Error updating categories' }, { status: 500 });
    }
}
