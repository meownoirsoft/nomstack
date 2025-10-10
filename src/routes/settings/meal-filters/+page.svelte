<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { ChevronUp, ChevronDown, Plus, X } from 'lucide-svelte';
  import { notifySuccess, notifyError } from '$lib/stores/notifications.js';
  import { user, loading as authLoading, accessToken } from '$lib/stores/auth.js';

  let categories = [];
  let mealFilters = [];
  let loading = true;
  let saving = false;

  onMount(async () => {
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

    // Cleanup subscription on component destroy
    return () => {
      unsubscribe();
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

  // System categories that can be added as filters
  const systemCategories = [
    { id: 'breakfast', name: 'Breakfast' },
    { id: 'lunch', name: 'Lunch' },
    { id: 'dinner', name: 'Dinner' }
  ];

  function addFilter() {
    // Find available regular categories that aren't already in filters
    const availableRegularCategories = categories.filter(cat => 
      !mealFilters.some(filter => filter.category_id === cat.id)
    );

    // Find available system categories that aren't already in filters
    const availableSystemCategories = systemCategories.filter(sysCat => 
      !mealFilters.some(filter => filter.id === sysCat.id)
    );

    // Combine available options (system categories first, then regular categories)
    const availableOptions = [...availableSystemCategories, ...availableRegularCategories];

    if (availableOptions.length > 0) {
      const option = availableOptions[0];
      const newFilter = {
        id: option.id,
        name: option.name,
        category_id: option.category_id || null, // System categories don't have category_id
        order: mealFilters.length,
        is_default: false,
        is_system: !option.category_id // Mark as system if no category_id
      };
      mealFilters = [...mealFilters, newFilter];
    }
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

  function updateFilterCategory(index, categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      mealFilters[index].category_id = categoryId;
      mealFilters[index].name = category.name;
    }
  }
</script>

<div class="min-h-screen bg-base-200">
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary mb-2">Meal Filter Settings</h1>
      <p class="text-gray-600">Configure the category filters that appear at the top of the meals list page.</p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="loading loading-spinner loading-lg text-primary"></div>
      </div>
    {:else}
      <div class="bg-base-100 rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold">Filter Order</h2>
          <button 
            class="btn btn-primary btn-sm"
            on:click={saveFilters}
            disabled={saving}
          >
            {#if saving}
              <div class="loading loading-spinner loading-sm"></div>
            {/if}
            Save Changes
          </button>
        </div>

        <!-- Debug info -->
        <div class="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded">
          Debug: {categories.length} categories loaded, {mealFilters.length} filters configured<br>
          Available regular categories: {categories.filter(cat => 
            !mealFilters.some(filter => filter.category_id === cat.id)
          ).length}<br>
          Available system categories: {systemCategories.filter(sysCat => 
            !mealFilters.some(filter => filter.id === sysCat.id)
          ).length}<br>
          Filter IDs: {mealFilters.map(f => f.category_id || f.id).join(', ')}<br>
          Category IDs: {categories.slice(0, 5).map(c => c.id).join(', ')}...
        </div>

        <div class="space-y-3">
          {#each mealFilters as filter, index}
            <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
              <!-- Move buttons -->
              <div class="flex flex-col gap-1">
                <button 
                  class="btn btn-ghost btn-xs p-1"
                  on:click={() => moveFilterUp(index)}
                  disabled={index <= 1}
                  title="Move up"
                >
                  <ChevronUp class="h-3 w-3" />
                </button>
                <button 
                  class="btn btn-ghost btn-xs p-1"
                  on:click={() => moveFilterDown(index)}
                  disabled={index >= mealFilters.length - 1}
                  title="Move down"
                >
                  <ChevronDown class="h-3 w-3" />
                </button>
              </div>

              <!-- Filter name -->
              <div class="flex-1">
                {#if filter.is_default}
                  <span class="font-medium text-primary">{filter.name}</span>
                  <span class="text-xs text-gray-500 ml-2">(Default - cannot be changed)</span>
                {:else if filter.is_system}
                  <span class="font-medium text-blue-600">{filter.name}</span>
                  <span class="text-xs text-gray-500 ml-2">(System category - cannot be changed)</span>
                {:else}
                  <select 
                    class="select select-bordered select-sm w-full max-w-xs"
                    value={filter.category_id}
                    on:change={(e) => updateFilterCategory(index, e.target.value)}
                  >
                    {#each categories as category}
                      <option value={category.id}>{category.name}</option>
                    {/each}
                  </select>
                {/if}
              </div>

              <!-- Remove button -->
              {#if !filter.is_default}
                <button 
                  class="btn btn-ghost btn-sm text-error p-2"
                  on:click={() => removeFilter(index)}
                  title="Remove filter"
                >
                  <X class="h-4 w-4" />
                </button>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Add filter button -->
        <div class="mt-4">
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
            class="btn btn-outline btn-sm"
            on:click={addFilter}
            disabled={categories.filter(cat => 
              !mealFilters.some(filter => filter.category_id === cat.id)
            ).length === 0}
          >
            <Plus class="h-4 w-4" />
            Add Category Filter
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
