<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { ChevronUp, ChevronDown, Plus, X, Crown } from 'lucide-svelte';
  import { notifySuccess, notifyError } from '$lib/stores/notifications.js';
  import { user, loading as authLoading, accessToken } from '$lib/stores/auth.js';
  import { loadMealFilters, canCustomizeMealFilters } from '$lib/stores/mealFilters.js';
  import { userTier, TIER_TYPES } from '$lib/stores/userTier.js';
  import { goto } from '$app/navigation';

  let categories = [];
  let mealFilters = [];
  let loading = true;
  let saving = false;
  let showAddFilterDropdown = false;

  onMount(async () => {
    // Ensure page starts at the top
    window.scrollTo(0, 0);
    
    // Wait for authentication to complete before loading data
    const unsubscribe = user.subscribe(async (currentUser) => {
      if (currentUser === null && !$authLoading) {
        // User is not authenticated and loading is complete
        console.log('User not authenticated, skipping data load');
        return;
      }
      
      if (currentUser && !$authLoading && $accessToken) {
        // User is authenticated, loading is complete, and token is available
        await loadData();
      }
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showAddFilterDropdown && !event.target.closest('.relative')) {
        showAddFilterDropdown = false;
      }
    };
    document.addEventListener('click', handleClickOutside);

    // Cleanup subscription on component destroy
    return () => {
      unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function loadData() {
    try {
      loading = true;
      const [categoriesResult, filtersResult] = await Promise.all([
        api.getCategories(),
        api.getMealFilters()
      ]);

      // Categories API returns data directly (not wrapped)
      categories = categoriesResult || [];

      // Meal filters API returns wrapped format
      if (filtersResult.success) {
        mealFilters = filtersResult.data;
      } else {
        // Initialize with default "All" filter if none exist
        mealFilters = [{ id: 'all', name: 'All', order: 0, is_default: true }];
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notifyError(`Failed to load settings: ${error.message}`);
    } finally {
      loading = false;
    }
  }

  async function saveFilters() {
    try {
      saving = true;
      const result = await api.updateMealFilters(mealFilters);
      
      if (result.success) {
        notifySuccess('Meal filters saved');
        // Reload the global meal filters store so other pages see the changes
        await loadMealFilters();
      } else {
        notifyError('Failed to save meal filters');
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      notifyError('Failed to save meal filters');
    } finally {
      saving = false;
    }
  }

  function moveFilterUp(index) {
    if (index > 1) { // Don't move "All" filter
      const newFilters = [...mealFilters];
      [newFilters[index], newFilters[index - 1]] = [newFilters[index - 1], newFilters[index]];
      // Update order values
      newFilters.forEach((filter, i) => {
        filter.order = i;
      });
      mealFilters = newFilters;
    }
  }

  function moveFilterDown(index) {
    if (index < mealFilters.length - 1) {
      const newFilters = [...mealFilters];
      [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];
      // Update order values
      newFilters.forEach((filter, i) => {
        filter.order = i;
      });
      mealFilters = newFilters;
    }
  }


  function toggleAddFilterDropdown() {
    showAddFilterDropdown = !showAddFilterDropdown;
  }

  function addFilter(option) {
    const newFilter = {
      id: option.id,
      name: option.name,
      category_id: option.is_flag ? null : option.id,
      flag: option.is_flag ? option.id : null,
      order: mealFilters.length,
      is_default: false,
      is_system: false
    };
    mealFilters = [...mealFilters, newFilter];
    showAddFilterDropdown = false;
  }

  function getAvailableOptions() {
    // Available meal type flags (not stored as categories)
    const availableFlags = [
      { id: 'lunch', name: 'Lunch', is_flag: true },
      { id: 'dinner', name: 'Dinner', is_flag: true }
    ].filter(flag => 
      !mealFilters.some(filter => filter.flag === flag.id)
    );

    // Find available categories that aren't already in filters
    const availableCategories = categories.filter(cat => 
      !mealFilters.some(filter => filter.category_id === cat.id)
    );

    // Combine categories and flags
    const allOptions = [
      ...availableCategories.map(cat => ({ ...cat, is_flag: false })),
      ...availableFlags
    ];

    return allOptions;
  }

  function removeFilter(index) {
    if (!mealFilters[index].is_default) {
      mealFilters = mealFilters.filter((_, i) => i !== index);
      // Update order values
      mealFilters.forEach((filter, i) => {
        filter.order = i;
      });
    }
  }

</script>

<div style="background-color: var(--app-background, #ffffff);">
  <div class="max-w-4xl mx-auto px-4 py-4">
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl font-bold text-primary">Meal Filter Settings</h1>
        {#if $userTier === TIER_TYPES.FREE}
          <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Plus Only</span>
        {/if}
      </div>
      <p class="text-gray-600 text-sm">
        {#if $userTier === TIER_TYPES.FREE}
          Free users get standard meal filters (All, Breakfast, Lunch, Dinner, Snack, Dessert, Side). Upgrade to Plus to customize your filters.
        {:else}
          Configure the category filters that appear at the top of the meals list page.
        {/if}
      </p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="loading loading-spinner loading-lg text-primary"></div>
      </div>
    {:else}
      {#if $userTier === TIER_TYPES.FREE}
        <!-- Free user view - show upgrade prompt -->
        <div class="bg-white rounded-lg shadow-md py-8 px-6 text-center">
          <div class="mb-6">
            <Crown class="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 class="text-xl font-bold text-primary mb-2">Customize Your Meal Filters</h2>
            <p class="text-gray-600 mb-4">
              Free users get standard meal filters (All, Breakfast, Lunch, Dinner, Snack, Dessert, Side). 
              Upgrade to Plus to create custom filters and organize your meals exactly how you want.
            </p>
          </div>
          
          <div class="space-y-4">
            <div class="bg-primary/5 rounded-lg p-4">
              <h3 class="font-semibold text-primary mb-2">Plus Features:</h3>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Create custom meal filters</li>
                <li>• Reorder filters to match your workflow</li>
                <li>• Add category-based filters</li>
                <li>• Remove filters you don't need</li>
              </ul>
            </div>
            
            <button 
              class="btn btn-primary"
              on:click={() => goto('/upgrade')}
            >
              <Crown class="h-4 w-4" />
              Upgrade to Plus
            </button>
          </div>
        </div>
      {:else}
        <!-- Plus user view - full functionality -->
        <div class="bg-base-100 rounded-lg shadow-md py-4 px-3">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">Filter Order</h2>
            <div class="relative">
              <button 
                class="btn btn-outline btn-sm"
                on:click={toggleAddFilterDropdown}
                disabled={getAvailableOptions().length === 0}
              >
                <Plus class="h-4 w-4" />
                Filter
              </button>
              
              {#if showAddFilterDropdown}
                <div class="absolute top-full right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-10 min-w-48">
                  {#each getAvailableOptions() as option}
                    <button 
                      class="w-full text-left px-4 py-2 hover:bg-base-200 first:rounded-t-lg last:rounded-b-lg"
                      on:click={() => addFilter(option)}
                    >
                      {option.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>


        <div class="space-y-1">
          {#each mealFilters as filter, index}
            <div class="flex items-center p-1 bg-base-200 rounded-lg">
              <!-- Filter name -->
              <div class="flex-1">
                {#if filter.is_default}
                  <span class="font-medium text-primary">{filter.name}</span>
                  <span class="text-xs text-gray-500 ml-2">(Default - cannot be changed)</span>
                {:else if filter.is_system}
                  <span class="font-medium text-blue-600">{filter.name}</span>
                  <span class="text-xs text-gray-500 ml-2">(System category - cannot be changed)</span>
                {:else}
                  <span class="font-medium">{filter.name}</span>
                  <span class="text-xs text-gray-500 ml-2">
                    {filter.flag ? `(System)` : ``}
                  </span>
                {/if}
              </div>

              <!-- Action buttons (only for non-default filters) -->
              {#if !filter.is_default}
                <div class="flex gap-0.5 ml-auto">
                  <button 
                    class="btn btn-ghost btn-sm p-1"
                    on:click={() => moveFilterUp(index)}
                    disabled={index === 1}
                    title="Move up"
                  >
                    <ChevronUp class="h-4 w-4" />
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm p-1"
                    on:click={() => moveFilterDown(index)}
                    disabled={index === mealFilters.length - 1}
                    title="Move down"
                  >
                    <ChevronDown class="h-4 w-4" />
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm text-error p-1"
                    on:click={() => removeFilter(index)}
                    title="Remove filter"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Save changes button -->
        <div class="mt-4 flex justify-center">
          {#if categories.length === 0}
            <div class="text-sm text-gray-600 mb-2">
              No categories available. <a href="/categories" class="link link-primary">Create categories first</a>.
            </div>
          {:else if categories.filter(cat => 
            !mealFilters.some(filter => filter.category_id === cat.id)
          ).length === 0}
            <div class="text-sm text-gray-600 mb-2">
              All categories have been added as filters.
            </div>
          {/if}
          
          <button 
            class="btn btn-primary btn-sm"
            on:click={saveFilters}
            disabled={saving}
          >
            {#if saving}
              <div class="loading loading-spinner loading-sm"></div>
            {/if}
            Save Filters
          </button>
        </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
