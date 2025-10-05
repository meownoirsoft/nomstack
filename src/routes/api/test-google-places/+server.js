import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        // Check if API key is set
        const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
        
        if (!GOOGLE_PLACES_API_KEY) {
            return json({ 
                error: 'API key not found in environment variables',
                status: 'missing_key'
            }, { status: 500 });
        }

        // Test the API key with a simple request
        const testUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        testUrl.searchParams.set('query', 'restaurant');
        testUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY);
        testUrl.searchParams.set('type', 'restaurant');

        const response = await fetch(testUrl.toString());
        const data = await response.json();

        return json({
            status: 'success',
            api_key_present: true,
            api_key_configured: true,
            google_response_status: data.status,
            google_error_message: data.error_message || null,
            results_count: data.results ? data.results.length : 0
        });

    } catch (error) {
        console.error('Google Places API test failed:', error);
        return json({ 
            error: error.message,
            status: 'test_failed'
        }, { status: 500 });
    }
}
