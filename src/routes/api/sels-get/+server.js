import { json } from '@sveltejs/kit';
import { getAllSels, getDinnerSels, getLunchSels } from '$lib/db';

export function GET({ url, locals }) {
	const userId = locals.user.id;
	const searchParams = url.searchParams;
	const type = searchParams.get('type');
	if (!type) {
		const sels = getAllSels(userId);
		return json(sels);
	}
	if (type === 'lunch') {
		const sels = getLunchSels(userId);
		return json(sels);
	}
	if (type === 'dinner') {
		const sels = getDinnerSels(userId);
		return json(sels);
	}
	return json([]);
}
