import { json } from '@sveltejs/kit';
import { setupNewUserSeedData, userHasSeedData } from '$lib/seedData.js';

export async function POST({ request, locals }) {
  try {
    // Get the current user from the session
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has seed data
    const hasData = await userHasSeedData(user.id);
    
    if (hasData) {
      return json({ 
        success: false, 
        message: 'User already has seed data',
        hasData: true 
      });
    }

    // Set up seed data
    const result = await setupNewUserSeedData(user.id);
    
    return json(result);
    
  } catch (error) {
    console.error('Error in setup-seed-data API:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET({ locals }) {
  try {
    // Get the current user from the session
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has seed data
    const hasData = await userHasSeedData(user.id);
    
    return json({ 
      hasData,
      userId: user.id 
    });
    
  } catch (error) {
    console.error('Error checking seed data:', error);
    return json({ 
      error: error.message 
    }, { status: 500 });
  }
}
