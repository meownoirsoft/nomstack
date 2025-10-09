import { json } from '@sveltejs/kit';
import { deleteMealPlan, updateMealPlan } from '$lib/db';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function PATCH({ params, request }) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;
    const updates = await request.json();

    const result = await updateMealPlan(planId, updates, user.id);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('meal-plans PATCH failed:', error);
    return json({ success: false, error: 'Unable to update meal plan' }, { status: 500 });
  }
}

export async function DELETE({ params, request }) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;

    const result = await deleteMealPlan(planId, user.id);
    return json({ success: true, data: result });
  } catch (error) {
    console.error('meal-plans DELETE failed:', error);
    return json({ success: false, error: 'Unable to delete meal plan' }, { status: 500 });
  }
}