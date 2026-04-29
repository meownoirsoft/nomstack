import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';
import { hasFeatureAccess } from '$lib/stores/userTier.js';

export async function GET({ locals }) {
	try {
		if (!locals.userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}
		const { data: pantryItems, error } = await supabaseAdmin
			.from('pantry_items')
			.select('*')
			.eq('user_id', locals.userId)
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
		if (!locals.userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}
		const { name, category } = await request.json();
		if (!name || !name.trim()) {
			return json({ success: false, error: 'Name is required' }, { status: 400 });
		}

		const { data: pantryItem, error } = await supabaseAdmin
			.from('pantry_items')
			.insert({
				user_id: locals.userId,
				name: name.trim(),
				category: category || null
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating pantry item:', error);
			if (error.code === '23505') {
				return json(
					{ success: false, error: 'This item already exists in your pantry' },
					{ status: 409 }
				);
			}
			return json({ success: false, error: error.message }, { status: 500 });
		}

		if (hasFeatureAccess('smartPantry')) {
			await supabaseAdmin
				.from('ingredients')
				.update({ is_pantry: true })
				.eq('user_id', locals.userId)
				.ilike('name', name.trim());
		}

		return json({ success: true, data: pantryItem });
	} catch (error) {
		console.error('Error in pantry POST:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH({ request, locals }) {
	try {
		if (!locals.userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}
		const { id, name, category } = await request.json();
		if (!id) {
			return json({ success: false, error: 'ID is required' }, { status: 400 });
		}
		if (!name || !name.trim()) {
			return json({ success: false, error: 'Name is required' }, { status: 400 });
		}

		const { data: oldPantryItem, error: fetchError } = await supabaseAdmin
			.from('pantry_items')
			.select('name')
			.eq('id', id)
			.eq('user_id', locals.userId)
			.single();

		if (fetchError) {
			return json({ success: false, error: 'Pantry item not found' }, { status: 404 });
		}

		const { data: updatedPantryItem, error } = await supabaseAdmin
			.from('pantry_items')
			.update({ name: name.trim(), category: category || null })
			.eq('id', id)
			.eq('user_id', locals.userId)
			.select()
			.single();

		if (error) {
			console.error('Error updating pantry item:', error);
			if (error.code === '23505') {
				return json(
					{ success: false, error: 'This item already exists in your pantry' },
					{ status: 409 }
				);
			}
			return json({ success: false, error: error.message }, { status: 500 });
		}

		if (oldPantryItem.name !== name.trim() && hasFeatureAccess('smartPantry')) {
			await supabaseAdmin
				.from('ingredients')
				.update({ is_pantry: false })
				.eq('user_id', locals.userId)
				.ilike('name', oldPantryItem.name);
			await supabaseAdmin
				.from('ingredients')
				.update({ is_pantry: true })
				.eq('user_id', locals.userId)
				.ilike('name', name.trim());
		}

		return json({ success: true, data: updatedPantryItem });
	} catch (error) {
		console.error('Error in pantry PATCH:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE({ request, locals }) {
	try {
		if (!locals.userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}
		const { id } = await request.json();
		if (!id) {
			return json({ success: false, error: 'ID is required' }, { status: 400 });
		}

		const { data: pantryItem, error: fetchError } = await supabaseAdmin
			.from('pantry_items')
			.select('name')
			.eq('id', id)
			.eq('user_id', locals.userId)
			.single();

		if (fetchError) {
			return json({ success: false, error: 'Pantry item not found' }, { status: 404 });
		}

		const { error } = await supabaseAdmin
			.from('pantry_items')
			.delete()
			.eq('id', id)
			.eq('user_id', locals.userId);

		if (error) {
			console.error('Error deleting pantry item:', error);
			return json({ success: false, error: error.message }, { status: 500 });
		}

		if (hasFeatureAccess('smartPantry')) {
			await supabaseAdmin
				.from('ingredients')
				.update({ is_pantry: false })
				.eq('user_id', locals.userId)
				.ilike('name', pantryItem.name);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in pantry DELETE:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
