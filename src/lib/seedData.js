// Client-side wrappers around the server-side /api/seed-user-data endpoint.
// userId params are kept for call-site compatibility but ignored — the server
// uses event.locals.userId from the session cookie as the source of truth.

async function getJson(url, init) {
	const res = await fetch(url, { credentials: 'same-origin', ...init });
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

export async function setupNewUserSeedData() {
	try {
		return await getJson('/api/seed-user-data', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'setup' })
		});
	} catch (error) {
		console.error('Error setting up seed data:', error);
		return {
			success: false,
			categories: [],
			meals: [],
			mealFilters: [],
			mealPlan: null,
			errors: [`General error: ${error.message}`]
		};
	}
}

export async function userHasSeedData() {
	try {
		const data = await getJson('/api/seed-user-data');
		return Boolean(data?.hasData);
	} catch (error) {
		console.error('Error checking seed data:', error);
		return false;
	}
}

export async function getSeedDataStats() {
	try {
		return await getJson('/api/seed-user-data?action=stats');
	} catch (error) {
		console.error('Error getting seed data stats:', error);
		return {
			categories: 0,
			meals: 0,
			mealPlans: 0,
			hasData: false
		};
	}
}

export async function addMissingCategoriesToUser() {
	try {
		return await getJson('/api/seed-user-data', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ action: 'add-missing-categories' })
		});
	} catch (error) {
		console.error('Error adding missing categories:', error);
		return {
			success: false,
			error: error.message,
			added: 0,
			categories: []
		};
	}
}
