<script>
  import MealList from '../lib/components/MealList.svelte';
  import RestaurantList from '../lib/components/RestaurantList.svelte';
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';
  import { searchTerm } from '$lib/stores/search.js';
  import { eatingMode, setEatingMode } from '$lib/stores/eatingMode.js';
  import { user, loading as authLoading, accessToken } from '$lib/stores/auth.js';
  import { loadMealFilters } from '$lib/stores/mealFilters.js';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { setupNewUserSeedData, userHasSeedData } from '$lib/seedData.js';

  export let data;

  let allMeals = []; // Store all meals without filtering
  let meals = []; // Filtered meals for display
  let sels = [];
  let cats = [];
  let srcs = [];
  let dataLoading = true;
  let error = null;
  const pageType = 'all';
  
  // Debug variables for seed data
  let seedDataLoading = false;
  let seedDataResult = null;
  let hasSeedData = false;


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

  // Track if we've loaded data to prevent infinite loops
  let hasLoadedHomeData = false;
  let hasLoadedOutData = false;
  
  // Handle eating mode changes without infinite loops. Gate on `browser` so
  // the relative-URL fetches don't fire during SSR.
  $: if (browser && $eatingMode === 'home' && !hasLoadedHomeData && $user && !$authLoading) {
    hasLoadedHomeData = true;
    loadDataForCurrentMode();
  } else if (browser && $eatingMode === 'out' && !hasLoadedOutData && $user && !$authLoading) {
    hasLoadedOutData = true;
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
        
        // Load meal filters
        await loadMealFilters();

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
    let filtered = mealsList;

    // Apply search filter only (category filtering is now handled in MealList component)
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      const catNameLookup = new Map(
        categoriesList.map((cat) => [cat.id, typeof cat.name === 'string' ? cat.name.toLowerCase() : ''])
      );

      filtered = filtered.filter((meal) => {
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
    }

    return filtered;
  }

  onMount(async () => {
    // Set eating mode to 'home' for meals page
    setEatingMode('home');
    
    // Check if user has seed data
    if ($user) {
      try {
        hasSeedData = await userHasSeedData($user.id);
        console.log('User has seed data:', hasSeedData);
      } catch (err) {
        console.error('Error checking seed data:', err);
      }
    }
  });

  // Debug function to manually setup seed data
  async function setupSeedData() {
    if (!$user) return;
    
    seedDataLoading = true;
    try {
      seedDataResult = await setupNewUserSeedData($user.id);
      console.log('Seed data setup result:', seedDataResult);
      
      // Reload data after setup
      if (seedDataResult.success) {
        await loadDataForCurrentMode();
        hasSeedData = true;
      }
    } catch (err) {
      console.error('Error setting up seed data:', err);
      seedDataResult = { success: false, error: err.message };
    } finally {
      seedDataLoading = false;
    }
  }
</script>

{#if dataLoading}
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-primary/70">Loading meals...</p>
    </div>
  </div>
{:else if error}
  <div class="alert alert-error">
    <span>Error loading data: {error}</span>
  </div>
{:else}
  <!-- Debug section for seed data -->
  {#if $user && (!hasSeedData || meals.length === 0)}
    <div class="alert alert-warning mb-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div class="min-w-0">
          <span class="font-bold">No data found!</span>
          <p class="text-sm">You don't have any meals, categories, or sources yet.</p>
        </div>
        <button
          class="btn btn-primary btn-sm shrink-0"
          on:click={setupSeedData}
          disabled={seedDataLoading}
        >
          {#if seedDataLoading}
            <span class="loading loading-spinner loading-xs"></span>
            Setting up...
          {:else}
            Setup Sample Data
          {/if}
        </button>
      </div>
    </div>
    
    {#if seedDataResult}
      <div class="alert {seedDataResult.success ? 'alert-success' : 'alert-error'} mb-4">
        <span>{seedDataResult.success ? '✅ Setup complete!' : '❌ Setup failed'}</span>
        {#if seedDataResult.error}
          <p class="text-sm">{seedDataResult.error}</p>
        {/if}
      </div>
    {/if}
  {/if}
  {#if $eatingMode === 'home'}
    <MealList {meals} {sels} {cats} {srcs} page={pageType} />
  {:else}
    <div class="h-full">
      <RestaurantList />
    </div>
  {/if}
{/if}
