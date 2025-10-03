// Google Places API helper - uses backend proxy to avoid CORS issues
import { getAuthToken } from '$lib/api.js';

// Search for restaurants using Google Places API via backend proxy
export async function searchRestaurants(query, location = null, locationString = null) {
  try {
    // First, get the user's location if not provided and no location string
    let userLocation = location;
    if (!userLocation && !locationString) {
      userLocation = await getCurrentLocation();
    }

    const token = await getAuthToken();
    const response = await fetch('/api/google-places-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        location: userLocation,
        locationString: locationString
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

// Get detailed information about a specific place via backend proxy
export async function getPlaceDetails(placeId) {
  try {
    const token = await getAuthToken();
    const response = await fetch('/api/google-places-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

// Get user's current location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
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
        resolve(null); // Don't reject, just continue without location
      }
    );
  });
}
