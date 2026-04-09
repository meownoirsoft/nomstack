import { json } from '@sveltejs/kit';
import { delCat } from '$lib/db';

export async function POST({ request, locals }) {
	const userId = locals.user.id;
	try {
		const delId = await request.json();

		const deleteData = await delCat(userId, delId);
		return json({ success: true, data: deleteData });
	} catch (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
