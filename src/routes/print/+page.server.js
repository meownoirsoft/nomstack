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
    const filteredMeals = meals.sort((a, b) => a.name.localeCompare(b.name));
    const selsFilePath = path.resolve(__dirname,'../../../src/lib/data/selected.json');
    const sels = JSON.parse(readFileSync(selsFilePath, 'utf-8'));
    const lunchSels = sels.filter((sel) => sel.id === "lunch");
    const dinnerSels = sels.filter((sel) => sel.id === "dinner");
    return { meals: filteredMeals, lunchSels: lunchSels[0].meals, dinnerSels: dinnerSels[0].meals };
  }