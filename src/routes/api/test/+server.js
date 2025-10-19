import { json } from '@sveltejs/kit';

export async function GET() {
  console.log('🧪 TEST API ENDPOINT HIT!');
  return json({ success: true, message: 'Test endpoint working' });
}
