import {
	getAllMeals,
	getAllSels,
	getAllCats,
	getAllSrcs
} from '$lib/db';

export async function load({ locals, url }) {
	const userId = locals.user.id;
	const search = url.searchParams.get('search') || '';
	let meals = getAllMeals(userId);
	if (search) {
		meals = meals.filter((meal) =>
			meal.cats?.toLowerCase().includes(search.toLowerCase())
		);
	}
	const selsRows = getAllSels(userId);
	const selsRaw = selsRows[0]?.meals ?? '';
	const selsArr = selsRaw
		.split(',')
		.filter(Boolean)
		.map((meal) => parseInt(meal, 10))
		.filter((n) => !Number.isNaN(n));

	const cats = getAllCats(userId);
	const srcs = getAllSrcs(userId);

	const pathname = url.pathname;
	return { meals, sels: selsArr, cats, srcs, pathname, search };
}
