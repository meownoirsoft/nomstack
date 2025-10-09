import { getUserIdFromRequest } from '$lib/auth.js';

export async function load({ request, locals }) {
  return {
    pathname: '/stores'
  };
}
