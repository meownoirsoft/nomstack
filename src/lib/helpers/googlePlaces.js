// Google Places API helper - uses backend proxy to avoid CORS issues.
// Auth flows via the session cookie; same-origin fetch attaches it automatically.

export async function searchRestaurants(query, location = null, locationString = null) {
	try {
		let userLocation = location;
		if (!userLocation && !locationString) {
			userLocation = await getCurrentLocation();
		}

		const response = await fetch('/api/google-places-search', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query,
				location: userLocation,
				locationString
			})
		});

		const data = await response.json();
		if (!response.ok) {
			const errorMessage = data.error || 'Failed to search restaurants';
			const details = data.details ? ` (${data.details})` : '';
			throw new Error(`${errorMessage}${details}`);
		}
		return data.restaurants;
	} catch (error) {
		console.error('Error searching restaurants:', error);
		throw error;
	}
}

export async function getPlaceDetails(placeId) {
	try {
		const response = await fetch('/api/google-places-details', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ placeId })
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || 'Failed to get restaurant details');
		}
		return data.restaurant;
	} catch (error) {
		console.error('Error getting place details:', error);
		throw error;
	}
}

function getCurrentLocation() {
	return new Promise((resolve) => {
		if (!navigator.geolocation) {
			resolve(null);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					lat: position.coords.latitude,
					lng: position.coords.longitude
				});
			},
			(error) => {
				console.warn('Could not get location:', error);
				resolve(null);
			}
		);
	});
}
