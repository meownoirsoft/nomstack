import { json } from '@sveltejs/kit';
import { consumeEmailVerification } from '$lib/server/session.js';

export async function POST({ request }) {
	let token;
	try {
		const body = await request.json();
		token = body?.token;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const result = await consumeEmailVerification(token);
	if (result.error) {
		return json({ error: result.error }, { status: 400 });
	}
	return json({ success: true });
}
