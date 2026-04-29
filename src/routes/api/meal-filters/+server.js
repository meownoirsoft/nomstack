import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/pg-data-client.js';

export async function GET({ locals }) {
	if (!locals.userId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { data: filters, error } = await supabaseAdmin
			.from('meal_filters')
			.select('*')
			.eq('user_id', locals.userId)
			.order('"order"');

		if (error) {
			console.error('Error fetching meal filters:', error);
			return json({ success: false, error: 'Failed to fetch meal filters' }, { status: 500 });
		}

		const allFilters = [
			{
				id: 'all',
				name: 'All',
				order: 0,
				is_default: true,
				user_id: locals.userId
			},
			...(filters || [])
		];

		return json({ success: true, data: allFilters });
	} catch (error) {
		console.error('Error in meal-filters GET:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	if (!locals.userId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { filters } = await request.json();
		if (!filters || !Array.isArray(filters)) {
			return json({ success: false, error: 'Invalid filters data' }, { status: 400 });
		}

		const { error: deleteError } = await supabaseAdmin
			.from('meal_filters')
			.delete()
			.eq('user_id', locals.userId);

		if (deleteError) {
			console.error('Error deleting existing meal filters:', deleteError);
			return json({ success: false, error: 'Failed to update meal filters' }, { status: 500 });
		}

		const filtersToInsert = filters
			.filter((filter) => !filter.is_default)
			.map((filter) => ({
				user_id: locals.userId,
				category_id: filter.category_id || null,
				flag: filter.flag || null,
				name: filter.name,
				order: filter.order,
				is_system: filter.is_system || false
			}));

		if (filtersToInsert.length > 0) {
			const { error: insertError } = await supabaseAdmin
				.from('meal_filters')
				.insert(filtersToInsert);

			if (insertError) {
				console.error('Error inserting meal filters:', insertError);
				return json({ success: false, error: 'Failed to save meal filters' }, { status: 500 });
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in meal-filters POST:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
