import { redirect } from '@sveltejs/kit';
import { countUsers } from '$lib/auth.js';
import { env } from '$env/dynamic/private';

export function load({ locals }) {
	if (locals.user) {
		throw redirect(303, '/');
	}
	const allow =
		countUsers() === 0 || env.ALLOW_REGISTRATION === 'true' || env.ALLOW_REGISTRATION === '1';
	if (!allow) {
		throw redirect(303, '/login');
	}
	return {};
}
