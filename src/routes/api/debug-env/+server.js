import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        // Check all possible environment variable names
        const envVars = {
            GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
            VITE_GOOGLE_PLACES_API_KEY: process.env.VITE_GOOGLE_PLACES_API_KEY,
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
            PLACES_API_KEY: process.env.PLACES_API_KEY
        };

        // Check if any Google-related env vars exist
        const googleVars = Object.entries(envVars).filter(([key, value]) => value);
        
        return json({
            status: 'success',
            found_variables: googleVars.map(([key, value]) => ({
                name: key,
                has_value: !!value,
                value_preview: value ? value.substring(0, 10) + '...' : 'null'
            })),
            all_env_keys: Object.keys(process.env).filter(key => 
                key.toLowerCase().includes('google') || 
                key.toLowerCase().includes('places') ||
                key.toLowerCase().includes('api')
            ),
            node_env: process.env.NODE_ENV,
            platform: process.platform
        });

    } catch (error) {
        console.error('Environment debug failed:', error);
        return json({ 
            error: error.message,
            status: 'debug_failed'
        }, { status: 500 });
    }
}


