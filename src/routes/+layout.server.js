export async function load({ locals }) {
	return { title: 'nomStack', user: locals.user };
}
