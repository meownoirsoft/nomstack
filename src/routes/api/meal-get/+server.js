import { json } from '@sveltejs/kit';
import { getAllMeals, getLunches, getDinners } from '$lib/db';
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

        let meals;
        if (type === 'lunch') {
            meals = await getLunches(user.id);
        } else if (type === 'dinner') {
            meals = await getDinners(user.id);
        } else {
            meals = await getAllMeals(user.id);
        }

        return json(meals);
    } catch (error) {
        console.error('meal-get failed:', error);
        return json({ error: 'Unable to load meals' }, { status: 500 });
    }
}
