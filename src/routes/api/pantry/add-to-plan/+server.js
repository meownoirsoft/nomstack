import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';
import { hasFeatureAccess } from '$lib/stores/userTier.js';

export async function POST({ request, locals }) {
	try {
		if (!locals.userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}

		const { pantryItemId, planId } = await request.json();
		if (!pantryItemId || !planId) {
			return json(
				{ success: false, error: 'Pantry item ID and plan ID are required' },
				{ status: 400 }
			);
		}

		const { data: pantryItem, error: fetchError } = await supabaseAdmin
			.from('pantry_items')
			.select('name, category')
			.eq('id', pantryItemId)
			.eq('user_id', locals.userId)
			.single();

		if (fetchError) {
			return json({ success: false, error: 'Pantry item not found' }, { status: 404 });
		}

		const { data: existingIngredient } = await supabaseAdmin
			.from('ingredients')
			.select('id')
			.eq('user_id', locals.userId)
			.eq('plan_id', planId)
			.ilike('name', pantryItem.name)
			.single();

		if (existingIngredient) {
			if (hasFeatureAccess('smartPantry')) {
				const { error: updateError } = await supabaseAdmin
					.from('ingredients')
					.update({ is_pantry: false })
					.eq('id', existingIngredient.id);
				if (updateError) {
					console.error('Error updating existing ingredient:', updateError);
					return json({ success: false, error: updateError.message }, { status: 500 });
				}
			}
			return json({ success: true, data: { message: 'Ingredient added to shopping list' } });
		}

		const { data: newIngredient, error: insertError } = await supabaseAdmin
			.from('ingredients')
			.insert({
				user_id: locals.userId,
				plan_id: planId,
				name: pantryItem.name,
				category: pantryItem.category,
				is_custom: true,
				is_pantry: false,
				position: 0
			})
			.select()
			.single();

		if (insertError) {
			console.error('Error creating ingredient:', insertError);
			return json({ success: false, error: insertError.message }, { status: 500 });
		}

		return json({ success: true, data: newIngredient });
	} catch (error) {
		console.error('Error in add-to-plan POST:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
