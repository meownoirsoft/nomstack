<script>
  import MealList from '../../lib/components/MealList.svelte';
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';

  export let data;

  let meals = [];
  let sels = [];
  let cats = [];
  let srcs = [];
  let loading = true;
  let error = null;
  const page = 'lunch';

  onMount(async () => {
    try {
      loading = true;
      const [mealsData, catsData, selsData, srcsData] = await Promise.all([
        api.getMeals('lunch'),
        api.getCategories(),
        api.getSelections('lunch'),
        api.getSources()
      ]);

      meals = mealsData;
      cats = catsData;
      sels = Array.isArray(selsData) && selsData[0]?.meals ? selsData[0].meals : [];
      srcs = srcsData;
    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-gray-600">Loading lunch meals...</p>
    </div>
  </div>
{:else if error}
  <div class="alert alert-error">
    <span>Error loading data: {error}</span>
  </div>
{:else}
  <MealList {meals} {sels} {cats} {srcs} {page} />
{/if}
