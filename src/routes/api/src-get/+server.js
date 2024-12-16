import { json } from '@sveltejs/kit';
import { getAllSrcs } from '$lib/db';

export function GET() {
    const srcs = getAllSrcs();
    return json(srcs);
}