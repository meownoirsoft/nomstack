import { readFileSync, existsSync } from 'fs';
import path from 'path';

export async function load({url}) {
    const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/cat-get`;
    const res = await fetch(apiUrl);
    const cats = await res.json()
    const pathname = url.pathname;
    return { cats, pathname };
}