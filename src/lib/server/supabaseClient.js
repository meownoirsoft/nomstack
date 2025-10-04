import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables must be set.');
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Helper to get user from JWT token
export async function getUserFromToken(token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
  return user;
}
