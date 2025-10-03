import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';
import { browser } from '$app/environment';

// Create writable stores for auth state
export const user = writable(null);
export const loading = writable(true);

// Initialize auth state
if (browser) {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null);
    loading.set(false);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    user.set(session?.user ?? null);
    loading.set(false);
  });
}
