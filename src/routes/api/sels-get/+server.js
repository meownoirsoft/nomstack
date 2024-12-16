import { json } from '@sveltejs/kit';
import { getAllSels, getLunchSels, getDinnerSels } from '$lib/db';

export function GET({url}) {
    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    if (!type) {
        const sels = getAllSels();
        return json(sels);
    }else if(type === 'lunch'){
        const sels = getLunchSels();
        return json(sels);
    }else if(type === 'dinner'){
        const sels = getDinnerSels();
        return json(sels);
    }
}