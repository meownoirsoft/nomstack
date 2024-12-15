import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

export async function load({url}) {
  const search = url.searchParams.get('search') || '';
  const filePath = path.resolve('src/lib/data/meals.json');
  let meals = JSON.parse(readFileSync(filePath, 'utf-8'));
  console.log(meals.length+ ' meals')
  if (search) {
    meals = meals.filter(meal =>
      meal.cats?.toLowerCase().includes(search.toLowerCase())
    );
  }
  let filteredMeals = meals.sort((a, b) => a.name.localeCompare(b.name));
  const selsFilePath = path.resolve(__dirname,'../src/lib/data/selected.json');
  const sels = JSON.parse(readFileSync(selsFilePath, 'utf-8'));
  const filteredSels = sels.filter((sel) => sel.id === "all");
  const pathname = url.pathname;
  return { filteredMeals, sels: filteredSels[0].meals, pathname, search };
}