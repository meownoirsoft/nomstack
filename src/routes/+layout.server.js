import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// import { dev } from '$app/environment';
// import { injectAnalytics } from '@vercel/analytics/sveltekit';
// injectAnalytics({ mode: dev ? 'development' : 'production' });

export async function load({ cookies, url }) {
  console.log(cookies.getAll())
  const session = cookies.get('session');
  console.log('LAYOUT: session? ',session)
  // if (!session && url.pathname !== '/login') {
  //   throw redirect(302, '/login');
  // }

  return { title: "nomStack", session };
}
