import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// For now, we'll use placeholder values. In production, these should be set as environment variables:
// Configure your Supabase environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (SUPABASE_URL === 'https://placeholder.supabase.co' || SUPABASE_ANON_KEY === 'placeholder_key') {
  console.warn('Supabase environment variables not set. Please configure the required environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to get the current user
export async function getCurrentUser() {
  if (!browser) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

// Helper function to sign out
export async function signOut() {
  if (!browser) return;
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
}
