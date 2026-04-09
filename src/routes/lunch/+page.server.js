import { getLunches, getLunchSels } from '$lib/db';

export async function load({ locals }) {
	const userId = locals.user.id;
	const meals = getLunches(userId);
	const sels = getLunchSels(userId);
	const raw = sels[0]?.meals ?? '';
	const selsArr = raw
		.split(',')
		.filter(Boolean)
		.map((meal) => parseInt(meal, 10))
		.filter((n) => !Number.isNaN(n));
	return { meals, sels: selsArr };
}
