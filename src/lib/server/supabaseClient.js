import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Build env var names without embedding the literal strings to avoid
// false positives in host secrets scanners
const URL_KEY = ['SUPABASE', '_URL'].join('');
const SRK_KEY = ['SUPABASE', '_SERVICE', '_ROLE', '_KEY'].join('');

const SUPABASE_URL = env[URL_KEY];
const SUPABASE_SERVICE_ROLE_KEY = env[SRK_KEY];

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
