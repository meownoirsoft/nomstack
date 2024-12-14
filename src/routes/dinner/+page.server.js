import { readFileSync } from 'fs';
import path from 'path';

export async function load({url}) {
    const filePath = path.resolve('src/lib/data/meals.json');
    const meals = JSON.parse(readFileSync(filePath, 'utf-8'));
    const filteredMeals = meals.filter(meal => meal.cats?.includes('Dinner')).sort((a, b) => a.name.localeCompare(b.name));
    const selsFilePath = path.resolve('src/lib/data/selected.json');
    const sels = JSON.parse(readFileSync(selsFilePath, 'utf-8'));
    const filteredSels = sels.filter((sel) => sel.id === "dinner");
    return { filteredMeals, sels: filteredSels[0].meals };
  }