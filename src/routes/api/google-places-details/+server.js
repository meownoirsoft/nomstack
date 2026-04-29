import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        if (!locals.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { placeId } = await request.json();

        console.log('Place ID received:', placeId);
        console.log('Place ID type:', typeof placeId);
        console.log('Place ID length:', placeId?.length);

        if (!placeId) {
            return json({ error: 'Place ID is required' }, { status: 400 });
        }

        // Get Google Places API key from environment
        const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
        
        if (!GOOGLE_PLACES_API_KEY) {
            return json({ error: 'API key not configured' }, { status: 500 });
        }

        // Use the new Places API (New) - Place Details
        // The place ID from search results needs the 'places/' prefix
        console.log('Original place ID:', placeId);
        const formattedPlaceId = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
        const detailsUrl = new URL(`https://places.googleapis.com/v1/${formattedPlaceId}`);
        
        console.log('Making request to:', detailsUrl.toString());
        
        // Make the request to Google Places API (New)
        const response = await fetch(detailsUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,rating,priceLevel,types,websiteUri',
                'Referer': process.env.APP_URL || 'http://localhost:5173'
            }
        });
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            console.error('Response status:', response.status);
            console.error('Response headers:', Object.fromEntries(response.headers.entries()));
            return json({ 
                error: 'Invalid response from Google Places API',
                details: `Status: ${response.status}, JSON parse error: ${jsonError.message}`
            }, { status: 500 });
        }
        
        console.log('Google Places Details Response:', {
            status: response.status,
            error: data.error,
            placeId: placeId
        });

        if (!response.ok || data.error) {
            return json({ 
                error: `Google Places API error: ${data.error?.message || 'Unknown error'}`, 
                details: data.error?.details || 'No additional details'
            }, { status: response.status });
        }

        const place = data;
        console.log('Place details received:', place);
        
        const restaurant = {
            google_place_id: place.id,
            name: place.displayName?.text || 'Unknown',
            address: place.formattedAddress || 'Address not available',
            phone: place.nationalPhoneNumber || null,
            rating: place.rating || null,
            price_level: place.priceLevel ? '$'.repeat(place.priceLevel) : null,
            cuisine: extractCuisine(place.types || []),
            website: place.websiteUri || null,
            opening_hours: null, // Will be added back when we get the API working
            current_opening_hours: null,
            popular_times: null,
            notes: null
        };

        return json({ restaurant });
    } catch (error) {
        console.error('google-places-details failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        return json({ 
            error: 'Unable to get restaurant details',
            details: error.message 
        }, { status: 500 });
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
