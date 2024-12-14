import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
  cookies.delete('session', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
    path: '/'
  });

  return json({ success: true });
}
