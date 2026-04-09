import { getAllMeals, getDinnerSels, getLunchSels } from '$lib/db';

export async function load({ locals }) {
	const userId = locals.user.id;
	const meals = getAllMeals(userId);
	const selsLunch = getLunchSels(userId);
	const selsDinner = getDinnerSels(userId);
	return {
		meals,
		lunchSels: selsLunch[0]?.meals ?? '',
		dinnerSels: selsDinner[0]?.meals ?? ''
	};
}
