import { json } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {

    const { username, password } = await request.json();

    const authUser = env.AUTH_USERNAME;
    const authPass = env.AUTH_PASSWORD;

    if (!authUser || !authPass) {
      console.error('AUTH_USERNAME and/or AUTH_PASSWORD are not set in the environment.');
      return json({ error: 'Authentication service unavailable.' }, { status: 500 });
    }

    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== authUser || password !== authPass) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (username === authUser && password === authPass) {
      cookies.set('session', crypto.randomUUID(), {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
        path: '/'
      });

      throw redirect(302, '/');
    }
}
