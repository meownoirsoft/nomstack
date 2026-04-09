import { getAllCats } from '$lib/db';

export async function load({ locals, url }) {
	const cats = getAllCats(locals.user.id);
	const pathname = url.pathname;
	return { cats, pathname };
}
