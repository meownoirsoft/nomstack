import { json } from '@sveltejs/kit';
import { getAllSels, getLunchSels, getDinnerSels } from '$lib/db';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function GET({ url, request }) {
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

        const searchParams = url.searchParams;
        const type = searchParams.get('type');

        let sels;
        if (type === 'lunch') {
            sels = await getLunchSels(user.id);
        } else if (type === 'dinner') {
            sels = await getDinnerSels(user.id);
        } else {
            sels = await getAllSels(user.id);
        }

        return json(sels);
    } catch (error) {
        console.error('sels-get failed:', error);
        return json({ error: 'Unable to load selections' }, { status: 500 });
    }
}
