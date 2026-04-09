import { json } from '@sveltejs/kit';
import { getAllCats } from '$lib/db';

export function GET({ locals }) {
	const cats = getAllCats(locals.user.id);
	return json(cats);
}
