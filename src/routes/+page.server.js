export async function load({url}) {
  const search = url.searchParams.get('search') || '';
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/meal-get`);
  const meals = await res.json();
  if (search) {
    meals = meals.filter(meal =>
      meal.cats?.toLowerCase().includes(search.toLowerCase())
    );
  }
  const selsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/sels-get`);
  const sels = await selsRes.json();
  const selsArr = sels[0].meals.split(',').map(meal => parseInt(meal,10))

  const catRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/cat-get`);
  const cats = await catRes.json()

  const srcRes = await fetch(`${import.meta.env.VITE_BASE_URL}/api/src-get`);
  const srcs = await srcRes.json()

  const pathname = url.pathname;
  return { meals, sels: selsArr, cats, srcs, pathname, search };
}