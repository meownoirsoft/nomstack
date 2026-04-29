import { writable, derived } from 'svelte/store';

export const user = writable(null);
export const loading = writable(false);

// Truthy whenever the user is logged in. Kept for backwards-compat with
// pages that gated logic on `$accessToken` under the old Supabase JWT flow.
export const accessToken = derived(user, ($user) => ($user ? 'cookie-session' : null));
