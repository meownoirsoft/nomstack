import { json } from '@sveltejs/kit';
import { AUTH_USERNAME, AUTH_PASSWORD } from '$env/static/private';

export async function POST({ request, cookies }) {
  console.log('Request received:', request.body);
  console.log('Cookies:', cookies.getAll());

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    cookies.set('session', crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/'
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error:', error.message); // Log the error
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

