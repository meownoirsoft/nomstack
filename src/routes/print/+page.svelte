<script>
  import PrintView from '../../lib/components/PrintView.svelte';
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';

  export let data;

  let meals = [];
  let lunchSels = [];
  let dinnerSels = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      loading = true;
      const [mealsData, lunchSelsData, dinnerSelsData] = await Promise.all([
        api.getMeals('all'),
        api.getSelections('lunch'),
        api.getSelections('dinner')
      ]);

      meals = mealsData;
      lunchSels = Array.isArray(lunchSelsData) && lunchSelsData[0]?.meals ? lunchSelsData[0].meals : [];
      dinnerSels = Array.isArray(dinnerSelsData) && dinnerSelsData[0]?.meals ? dinnerSelsData[0].meals : [];
    } catch (err) {
      console.error('Error loading print data:', err);
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
      <p class="mt-4 text-gray-600">Loading print data...</p>
    </div>
  </div>
{:else if error}
  <div class="alert alert-error">
    <span>Error loading print data: {error}</span>
  </div>
{:else}
  <PrintView {meals} {lunchSels} {dinnerSels} />
{/if}
