import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__filename)
console.log(__dirname)

export async function load({url}) {
    const filePath = path.resolve(__dirname,'../../../src/lib/data/meals.json');
    const meals = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(meals.length+ ' lunch meals in JSON')
    const filteredMeals = meals.filter(meal => meal.cats?.includes('Lunch')).sort((a, b) => a.name.localeCompare(b.name));
    const selsFilePath = path.resolve(__dirname,'../../../src/lib/data/selected.json');
    const sels = JSON.parse(readFileSync(selsFilePath, 'utf-8'));
    const filteredSels = sels.filter((sel) => sel.id === "lunch");
    return { filteredMeals, sels: filteredSels[0].meals };
  }