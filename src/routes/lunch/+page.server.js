export async function load({url}) {
    const apiUrl = `${import.meta.env.VITE_BASE_URL}/api/meal-get?type=lunch`;
    const res = await fetch(apiUrl);
    const meals = await res.json();
    const selsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/sels-get?type=lunch`);
    const sels = await selsRes.json();
    return { meals, sels: sels[0].meals.split(',').map(meal => parseInt(meal,10)) };
  }