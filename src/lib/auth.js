import { goto, invalidateAll } from '$app/navigation';
import { setupNewUserSeedData, userHasSeedData } from '$lib/seedData.js';

async function postJson(url, body) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		credentials: 'same-origin',
		body: JSON.stringify(body)
	});
	let data = {};
	try {
		data = await res.json();
	} catch {
		// no-op
	}
	if (!res.ok) {
		throw new Error(data?.error || `Request failed (${res.status})`);
	}
	return data;
}

export async function signIn(email, password) {
	const result = await postJson('/api/login', { email, password });
	await invalidateAll();
	return result;
}

export async function signUp(email, password, displayName) {
	const result = await postJson('/api/signup', { email, password, displayName });
	await invalidateAll();
	return result;
}

export async function signOut() {
	try {
		await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
	} catch (err) {
		console.error('Logout request failed:', err);
	}
	await invalidateAll();
	goto('/login');
}

export async function getCurrentUser() {
	const res = await fetch('/api/me', { credentials: 'same-origin' });
	if (!res.ok) return null;
	const data = await res.json().catch(() => ({}));
	return data?.user ?? null;
}

/**
 * Send a password reset email. Always succeeds (does not reveal whether the
 * email is registered). User clicks the link in the email to land on
 * /reset-password/[token] where they enter the new password.
 */
export async function resetPassword(email) {
	return await postJson('/api/request-password-reset', { email });
}

/** Re-send the email-verification link to the currently logged-in user. */
export async function requestEmailVerification() {
	const res = await fetch('/api/request-verification', {
		method: 'POST',
		credentials: 'same-origin'
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
	return data;
}

export async function handleNewUserSetup(userId) {
	try {
		console.log('Handling new user setup for:', userId);

		const hasData = await userHasSeedData(userId);
		if (hasData) {
			console.log('User already has seed data, skipping setup');
			return { success: true, message: 'User already has data' };
		}

		const result = await setupNewUserSeedData(userId);
		if (result.success) {
			console.log('New user setup completed successfully');
			return {
				success: true,
				message: 'Welcome! Your account has been set up with sample meals and categories.',
				data: result
			};
		}
		console.warn('New user setup completed with errors:', result.errors);
		return {
			success: false,
			message: 'Account created but some setup failed. You can add data manually.',
			errors: result.errors
		};
	} catch (error) {
		console.error('Error in new user setup:', error);
		return {
			success: false,
			message: 'Account created but setup failed. You can add data manually.',
			error: error.message
		};
	}
}

export async function checkUserOnboarding(userId) {
	try {
		const hasData = await userHasSeedData(userId);
		return { needsOnboarding: !hasData, hasData };
	} catch (error) {
		console.error('Error checking user onboarding:', error);
		return {
			needsOnboarding: true,
			hasData: false,
			error: error.message
		};
	}
}
