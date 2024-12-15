import { readFileSync, existsSync } from 'fs';
import path from 'path';

export async function load({url}) {
    const filePath = path.resolve('src/lib/data/cats.json');
    if (existsSync(filePath)) {
        console.log('File exists:', filePath);
      } else {
          console.error('File does not exist:', filePath);
      }
    const cats = JSON.parse(readFileSync(filePath, 'utf-8')).sort((a, b) => a.name.localeCompare(b.name));
    const pathname = url.pathname;
    return { cats, pathname };
}