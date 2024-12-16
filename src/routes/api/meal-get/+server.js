import { json } from '@sveltejs/kit';
import { getAllMeals, getLunches, getDinners } from '$lib/db';

export function GET({url}) {
    const searchParams = url.searchParams;
    const type = searchParams.get('type');
    if (!type) {
        const meals = getAllMeals(type);
        return json(meals);
    }else if(type === 'lunch'){
        const meals = getLunches(type);
        return json(meals);
    }else if(type === 'dinner'){
        const meals = getDinners(type);
        return json(meals);
    }
}