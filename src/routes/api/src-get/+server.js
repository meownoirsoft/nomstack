import { json } from '@sveltejs/kit';
import { getAllSrcs } from '$lib/db';

export function GET({ locals }) {
	const srcs = getAllSrcs(locals.user.id);
	return json(srcs);
}
