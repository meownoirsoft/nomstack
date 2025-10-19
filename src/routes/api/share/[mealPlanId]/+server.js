import { json } from '@sveltejs/kit';

export async function GET({ params, request }) {
  console.log('🚀 SHARE API GET ENDPOINT HIT!');
  console.log('Params:', params);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  return json({ success: true, message: 'Share endpoint reached', mealPlanId: params.mealPlanId });
}