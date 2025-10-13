import { json } from '@sveltejs/kit';
import { getUserIdFromRequest } from '$lib/utils.js';
import { supabaseAdmin } from '$lib/server/supabaseClient.js';

export async function GET({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { data: pantryItems, error } = await supabaseAdmin
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching pantry items:', error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    return json({ success: true, data: pantryItems });
  } catch (error) {
    console.error('Error in pantry GET:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { name, category } = await request.json();

    if (!name || !name.trim()) {
      return json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const { data: pantryItem, error } = await supabaseAdmin
      .from('pantry_items')
      .insert({
        user_id: userId,
        name: name.trim(),
        category: category || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pantry item:', error);
      if (error.code === '23505') { // Unique constraint violation
        return json({ success: false, error: 'This item already exists in your pantry' }, { status: 409 });
      }
      return json({ success: false, error: error.message }, { status: 500 });
    }

    // Update any existing ingredients with this name to be marked as pantry
    await supabaseAdmin
      .from('ingredients')
      .update({ is_pantry: true })
      .eq('user_id', userId)
      .ilike('name', name.trim());

    return json({ success: true, data: pantryItem });
  } catch (error) {
    console.error('Error in pantry POST:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE({ request, locals }) {
  try {
    const userId = await getUserIdFromRequest(request, locals);
    if (!userId) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Get the pantry item name before deleting
    const { data: pantryItem, error: fetchError } = await supabaseAdmin
      .from('pantry_items')
      .select('name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return json({ success: false, error: 'Pantry item not found' }, { status: 404 });
    }

    // Delete the pantry item
    const { error } = await supabaseAdmin
      .from('pantry_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting pantry item:', error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    // Update any existing ingredients with this name to not be marked as pantry
    await supabaseAdmin
      .from('ingredients')
      .update({ is_pantry: false })
      .eq('user_id', userId)
      .ilike('name', pantryItem.name);

    return json({ success: true });
  } catch (error) {
    console.error('Error in pantry DELETE:', error);
    return json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
