import { json } from '@sveltejs/kit';
import { getAllCats } from '$lib/db';

export function GET() {
    const cats = getAllCats();
    return json(cats);
}