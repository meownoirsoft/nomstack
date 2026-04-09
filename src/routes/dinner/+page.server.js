import { getDinners, getDinnerSels } from '$lib/db';

export async function load({ locals }) {
	const userId = locals.user.id;
	const meals = getDinners(userId);
	const sels = getDinnerSels(userId);
	const raw = sels[0]?.meals ?? '';
	const selsArr = raw
		.split(',')
		.filter(Boolean)
		.map((meal) => parseInt(meal, 10))
		.filter((n) => !Number.isNaN(n));
	return { meals, sels: selsArr };
}
