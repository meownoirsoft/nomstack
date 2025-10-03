<script>
  import MealList from '../lib/components/MealList.svelte';
  import RestaurantList from '../lib/components/RestaurantList.svelte';
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';
  import { searchTerm } from '$lib/stores/search.js';
  import { eatingMode } from '$lib/stores/eatingMode.js';
  import { user, loading as authLoading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';

  export let data;

  let allMeals = []; // Store all meals without filtering
  let meals = []; // Filtered meals for display
  let sels = [];
  let cats = [];
  let srcs = [];
  let dataLoading = true;
  let error = null;
  const pageType = 'all';


  // Reactive search filtering
  $: {
    if (allMeals.length > 0 && cats.length > 0) {
      try {
        meals = filterMeals(allMeals, cats, $searchTerm);
      } catch (err) {
        console.error('Error filtering meals:', err);
        meals = allMeals; // Fallback to showing all meals
      }
    }
  }

  // Reload data when eating mode changes
  $: if ($eatingMode) {
    loadDataForCurrentMode();
  }

  async function loadDataForCurrentMode() {
    if (!$user || $authLoading) return;
    
    try {
      dataLoading = true;
      error = null;
      
      if ($eatingMode === 'home') {
        // Load meal data only when in home mode
        const [mealsData, catsData, selsData, srcsData] = await Promise.all([
          api.getMeals('all'),
          api.getCategories(),
          api.getSelections('all'),
          api.getSources()
        ]);

        allMeals = mealsData || [];
        cats = catsData || [];
        sels = Array.isArray(selsData) && selsData[0]?.meals ? selsData[0].meals : [];
        srcs = srcsData || [];
      } else {
        // In restaurant mode, don't load meal data
        allMeals = [];
        cats = [];
        sels = [];
        srcs = [];
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message || 'Unable to load data. Please try again.';
      // Set empty arrays as fallback
      allMeals = [];
      cats = [];
      sels = [];
      srcs = [];
    } finally {
      dataLoading = false;
    }
  }

  function filterMeals(mealsList, categoriesList, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return mealsList;
    }

    const searchLower = searchTerm.toLowerCase();
    const catNameLookup = new Map(
      categoriesList.map((cat) => [cat.id, typeof cat.name === 'string' ? cat.name.toLowerCase() : ''])
    );

    const filtered = mealsList.filter((meal) => {
      // Search in meal name
      const nameMatch = meal.name?.toLowerCase()?.includes(searchLower) || false;
      
      // Search in notes
      const notesMatch = meal.notes?.toLowerCase()?.includes(searchLower) || false;
      
      // Search in categories
      const catNames = Array.isArray(meal.cats)
        ? meal.cats.map((id) => catNameLookup.get(id) ?? '').join(' ')
        : '';
      const catMatch = catNames.includes(searchLower);

      return nameMatch || notesMatch || catMatch;
    });

    return filtered;
  }

  onMount(async () => {
    // Wait for authentication to complete before loading data
    const unsubscribe = user.subscribe(async (currentUser) => {
      if (currentUser === null && !$authLoading) {
        // User is not authenticated and loading is complete, redirect to login
        goto('/login');
        return;
      }
      
      if (currentUser && !$authLoading) {
        // User is authenticated and loading is complete, load data
        await loadDataForCurrentMode();
      }
    });

    // Cleanup subscription on component destroy
    return () => {
      unsubscribe();
    };
  });
</script>

{#if dataLoading}
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-gray-600">Loading meals...</p>
    </div>
  </div>
{:else if error}
  <div class="alert alert-error">
    <span>Error loading data: {error}</span>
  </div>
{:else}
  {#if $eatingMode === 'home'}
    <MealList {meals} {sels} {cats} {srcs} page={pageType} />
  {:else}
    <RestaurantList />
  {/if}
{/if}
