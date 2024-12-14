import { readFileSync } from 'fs';
import path from 'path';

export async function load({url}) {
    const filePath = path.resolve('src/lib/data/meals.json');
    const meals = JSON.parse(readFileSync(filePath, 'utf-8'));
    const filteredMeals = meals.sort((a, b) => a.name.localeCompare(b.name));
    console.log('server meals: ',filteredMeals)
    const selsFilePath = path.resolve('src/lib/data/selected.json');
    const sels = JSON.parse(readFileSync(selsFilePath, 'utf-8'));
    console.log('server sels: ',sels)
    const lunchSels = sels.filter((sel) => sel.id === "lunch");
    const dinnerSels = sels.filter((sel) => sel.id === "dinner");
    console.log('server lunch: ',lunchSels)
    console.log('server dinner: ',dinnerSels)
    return { meals: filteredMeals, lunchSels: lunchSels[0].meals, dinnerSels: dinnerSels[0].meals };
  }