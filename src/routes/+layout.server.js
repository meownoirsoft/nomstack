import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
injectAnalytics({ mode: dev ? 'development' : 'production' });

export async function load({ cookies, url }) {
  const session = cookies.get('session');
  console.log('session is set: ', session);
  if (!session && url.pathname !== '/login') {
    // Redirect to login if not authenticated
    throw redirect(302, '/login');
  }

  return { title: "nomStack", session };
}
