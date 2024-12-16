export async function load({url}) {
    const mealsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/meal-get`);
    const meals = await mealsRes.json();

    const selsLunchRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/sels-get?type=lunch`);
    const selsLunch = await selsLunchRes.json();

    const selsDinnerRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/sels-get?type=dinner`);
    const selsDinner = await selsDinnerRes.json();
    return {meals, lunchSels: selsLunch[0].meals, dinnerSels: selsDinner[0].meals };
  }