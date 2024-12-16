import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
  const session = cookies.get('session');
  return { title: "nomStack", session };
}
