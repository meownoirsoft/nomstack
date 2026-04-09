import { json } from '@sveltejs/kit';
import { getAllMeals, getDinners, getLunches } from '$lib/db';

export function GET({ url, locals }) {
	const userId = locals.user.id;
	const searchParams = url.searchParams;
	const type = searchParams.get('type');
	if (!type) {
		const meals = getAllMeals(userId);
		return json(meals);
	}
	if (type === 'lunch') {
		const meals = getLunches(userId);
		return json(meals);
	}
	if (type === 'dinner') {
		const meals = getDinners(userId);
		return json(meals);
	}
	return json([]);
}
