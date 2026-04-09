import { json } from '@sveltejs/kit';
import { updMeal } from '$lib/db';

export async function POST({ request, locals }) {
	const userId = locals.user.id;
	try {
		const updRow = await request.json();

		const updatedData = await updMeal(userId, updRow.id, updRow.name, updRow.source, updRow.cats, updRow.notes);
		return json({ success: true, data: updatedData });
	} catch (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
