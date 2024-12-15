import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(import.meta.url,process.cwd())

export async function load({url}) {
    const filePath = path.resolve(__dirname,'../../../src/lib/data/cats.json');
    const cats = JSON.parse(readFileSync(filePath, 'utf-8')).sort((a, b) => a.name.localeCompare(b.name));
    const pathname = url.pathname;
    return { cats, pathname };
}