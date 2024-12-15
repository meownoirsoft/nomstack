import { json } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { AUTH_USERNAME, AUTH_PASSWORD } from '$env/static/private';

export async function POST({ request, cookies }) {

    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      console.log('set session cookie');
      cookies.set('session', crypto.randomUUID(), {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      throw redirect(302, '/');
    }
}