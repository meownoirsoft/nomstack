import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

export async function GET({ request }) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create a new Supabase client with the user's token for RLS context
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseWithAuth = createClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseWithAuth.auth.getUser(token);
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the latest updated_at timestamp from each table
    // All tables now have updated_at columns
    const tables = [
      { name: 'meals', column: 'updated_at' },
      { name: 'categories', column: 'updated_at' },
      { name: 'sources', column: 'updated_at' },
      { name: 'meal_filters', column: 'updated_at' },
      { name: 'meal_plans', column: 'updated_at' },
      { name: 'stores', column: 'updated_at' },
      { name: 'ingredients', column: 'updated_at' },
      { name: 'recipes', column: 'updated_at' },
      { name: 'restaurants', column: 'updated_at' }
    ];
    const lastUpdated = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabaseWithAuth
          .from(table.name)
          .select(table.column)
          .order(table.column, { ascending: false })
          .limit(1);

        if (error) {
          console.error(`Error getting last updated for ${table.name}:`, error);
          lastUpdated[table.name] = null;
        } else {
          lastUpdated[table.name] = data && data.length > 0 ? data[0][table.column] : null;
        }
      } catch (err) {
        console.error(`Error querying ${table.name}:`, err);
        lastUpdated[table.name] = null;
      }
    }

    // If all tables failed, return a default timestamp to avoid sync issues
    const hasAnyData = Object.values(lastUpdated).some(ts => ts !== null);
    if (!hasAnyData) {
      console.log('No data found in any tables, returning default timestamp');
      return json({
        success: true,
        lastUpdated: new Date(0).toISOString(), // Epoch time - will trigger initial sync
        tableTimestamps: lastUpdated
      });
    }

    // Calculate overall last updated timestamp
    const timestamps = Object.values(lastUpdated).filter(ts => ts !== null);
    const overallLastUpdated = timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(ts => new Date(ts).getTime()))).toISOString()
      : null;

    return json({
      success: true,
      lastUpdated: overallLastUpdated,
      tableTimestamps: lastUpdated
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
