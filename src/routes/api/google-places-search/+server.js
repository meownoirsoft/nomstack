import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function POST({ request }) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, location, locationString } = await request.json();

        if (!query) {
            return json({ error: 'Query parameter is required' }, { status: 400 });
        }

        // Get Google Places API key from environment
        const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
        
        if (!GOOGLE_PLACES_API_KEY) {
            return json({ error: 'API key not configured' }, { status: 500 });
        }

        // Use the new Places API (New) - Text Search
        const searchUrl = new URL('https://places.googleapis.com/v1/places:searchText');
        
        // Handle different location types
        let locationBias;
        
        if (location && typeof location === 'object' && location.lat && location.lng) {
            // GPS coordinates
            locationBias = {
                circle: {
                    center: {
                        latitude: location.lat,
                        longitude: location.lng
                    },
                    radius: 5000.0
                }
            };
        } else if (locationString && typeof locationString === 'string') {
            // Location string - use text query with location
            const requestBody = {
                textQuery: `${query} restaurant in ${locationString}`,
                maxResultCount: 20,
                includedType: 'restaurant'
            };
            
            // Make the request to Google Places API (New)
            const response = await fetch(searchUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location',
                    'Referer': 'http://localhost:5174'
                },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            
            console.log('Google Places API Response:', {
                status: response.status,
                error: data.error,
                places_count: data.places?.length || 0
            });

            if (!response.ok || data.error) {
                return json({ 
                    error: `Google Places API error: ${data.error?.message || 'Unknown error'}`, 
                    details: data.error?.details || 'No additional details',
                    status: response.status
                }, { status: response.status });
            }

            // Transform the results to our restaurant format
            const restaurants = (data.places || []).map(place => {
                console.log('Place from search:', {
                    id: place.id,
                    name: place.displayName?.text,
                    types: place.types
                });
                return {
                    google_place_id: place.id,
                    name: place.displayName?.text || 'Unknown',
                    address: place.formattedAddress || 'Address not available',
                    rating: place.rating || null,
                    price_level: place.priceLevel ? '$'.repeat(place.priceLevel) : null,
                    cuisine: extractCuisine(place.types || []),
                    phone: null, // Will be fetched separately if needed
                    notes: null,
                    location: {
                        lat: place.location?.latitude || null,
                        lng: place.location?.longitude || null
                    }
                };
            });

            return json({ restaurants });
        } else {
            // Default location (San Francisco)
            locationBias = {
                circle: {
                    center: {
                        latitude: 37.7749,
                        longitude: -122.4194
                    },
                    radius: 50000.0
                }
            };
        }

        const requestBody = {
            textQuery: `${query} restaurant`,
            maxResultCount: 20,
            locationBias,
            includedType: 'restaurant'
        };

        // Make the request to Google Places API (New)
        const response = await fetch(searchUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location',
                'Referer': 'http://localhost:5174'
            },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();

        console.log('Google Places API Response:', {
            status: response.status,
            error: data.error,
            places_count: data.places?.length || 0
        });

        if (!response.ok || data.error) {
            return json({ 
                error: `Google Places API error: ${data.error?.message || 'Unknown error'}`, 
                details: data.error?.details || 'No additional details',
                status: response.status
            }, { status: response.status });
        }

        // Transform the results to our restaurant format
        const restaurants = (data.places || []).map(place => ({
            google_place_id: place.id,
            name: place.displayName?.text || 'Unknown',
            address: place.formattedAddress || 'Address not available',
            rating: place.rating || null,
            price_level: place.priceLevel ? '$'.repeat(place.priceLevel) : null,
            cuisine: extractCuisine(place.types || []),
            phone: null, // Will be fetched separately if needed
            notes: null,
            location: {
                lat: place.location?.latitude || null,
                lng: place.location?.longitude || null
            }
        }));

        return json({ restaurants });
    } catch (error) {
        console.error('google-places-search failed:', error);
        return json({ error: 'Unable to search restaurants' }, { status: 500 });
    }
}

// Helper function to extract cuisine type from Google Places types
function extractCuisine(types) {
    if (!types || !Array.isArray(types)) return null;
    
    const cuisineMap = {
        'restaurant': 'Restaurant',
        'meal_takeaway': 'Takeaway',
        'meal_delivery': 'Delivery',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'bakery': 'Bakery',
        'food': 'Food',
        'meal_takeaway': 'Takeaway',
        'meal_delivery': 'Delivery'
    };

    // Look for specific cuisine types
    const cuisineTypes = types.filter(type => 
        type.includes('restaurant') || 
        type.includes('food') || 
        type.includes('meal') ||
        type.includes('cafe') ||
        type.includes('bar') ||
        type.includes('bakery')
    );

    if (cuisineTypes.length > 0) {
        return cuisineMap[cuisineTypes[0]] || null;
    }

    return null;
}
