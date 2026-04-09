import { json } from '@sveltejs/kit';
import { updCats } from '$lib/db';

export async function POST({ request, locals }) {
	const userId = locals.user.id;
	const body = await request.json();
	const cats = body.cats;
	if (!Array.isArray(cats)) {
		return json({ success: false, data: 'Invalid payload' }, { status: 400 });
	}

	try {
		for (const c of cats) {
			await updCats(userId, c.id, c.name);
		}
		return json({ success: true, data: true });
	} catch (error) {
		console.error(error);
		return json({ success: false, data: 'Error updating cat' });
	}
}
