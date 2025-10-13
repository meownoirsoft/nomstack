<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api.js';
  import { currentMealPlan } from '$lib/stores/mealPlan.js';
  import { ShoppingCart, Store, Printer, CheckSquare, Square, ArrowLeft } from 'lucide-svelte';

  let stores = [];
  let ingredients = [];
  let loading = true;
  let error = null;
  let selectedStores = new Set();
  let ingredientsByStore = {};
  let mealPlan = null; // Store meal plan data locally

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      // Get meal plan ID from URL params (if coming from print page)
      const urlParams = new URLSearchParams($page.url.search);
      const planIdParam = urlParams.get('plan_id');

      // Load meal plan data
      if (planIdParam) {
        const mealPlansResult = await api.getMealPlans();
        if (mealPlansResult.success) {
          mealPlan = mealPlansResult.data.find(plan => plan.id === planIdParam);
          if (!mealPlan) {
            error = 'Meal plan not found';
            return;
          }
        } else {
          error = 'Failed to load meal plan data';
          return;
        }
      } else if (!$currentMealPlan) {
        error = 'No meal plan selected';
        return;
      } else {
        mealPlan = $currentMealPlan;
      }

      // Load stores
      const storesResult = await api.getStores();
      if (storesResult.success) {
        stores = storesResult.data;
      }

      // Load ingredients for this plan
      const planId = mealPlan?.id || $currentMealPlan?.id;
      const ingredientsResult = await api.getIngredients({ plan_id: planId });
      if (ingredientsResult.success) {
        ingredients = ingredientsResult.data;
        
        // Group ingredients by store
        ingredientsByStore = ingredients.reduce((acc, ingredient) => {
          const storeId = ingredient.store_id || 'unassigned';
          if (!acc[storeId]) {
            acc[storeId] = [];
          }
          acc[storeId].push(ingredient);
          return acc;
        }, {});

        // Auto-select stores that have ingredients
        selectedStores = new Set(Object.keys(ingredientsByStore).filter(storeId => 
          ingredientsByStore[storeId].length > 0
        ));
      }

    } catch (err) {
      console.error('Error loading shopping data:', err);
      error = err.message || 'Failed to load shopping data';
    } finally {
      loading = false;
    }
  }

  function getStoreName(storeId) {
    if (storeId === 'unassigned') return 'List';
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : 'Unknown Store';
  }

  function getIngredientCount(storeId) {
    return ingredientsByStore[storeId]?.length || 0;
  }

  function toggleStore(storeId) {
    if (selectedStores.has(storeId)) {
      selectedStores.delete(storeId);
    } else {
      selectedStores.add(storeId);
    }
    selectedStores = selectedStores; // Trigger reactivity
  }


  function printSelected() {
    if (selectedStores.size === 0) {
      alert('Please select at least one store to print');
      return;
    }

    const currentPlan = mealPlan || $currentMealPlan;
    if (!currentPlan) {
      alert('No meal plan selected');
      return;
    }

    // Create a comma-separated list of store IDs for the URL
    const storeIds = Array.from(selectedStores).join(',');
    const url = `/shopping/print?stores=${storeIds}&plan_id=${currentPlan.id}`;
    window.open(url, '_blank');
  }
</script>

<svelte:head>
  <title>Print Shopping Lists - nomStack</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-gray-600">Loading shopping lists...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-error text-lg mb-4">⚠️</div>
        <p class="text-error mb-4">{error}</p>
        <button class="btn btn-primary" on:click={loadData}>Try Again</button>
      </div>
    </div>
  {:else if !mealPlan && !$currentMealPlan}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <ShoppingCart class="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 class="text-2xl font-bold text-gray-600 mb-2">No Active Meal Plan</h1>
        <p class="text-gray-500 mb-6">Create a meal plan first to generate shopping lists</p>
        <a href="/shopping" class="btn btn-primary">Go to Shopping Lists</a>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <div class="p-4">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
              <Printer class="h-6 w-6" />
              Print Shopping Lists
            </h1>
            <p class="text-gray-600 font-medium mt-1">{(mealPlan || $currentMealPlan)?.title}</p>
          </div>
          <a href="/shopping" class="text-primary hover:text-primary-focus flex items-center gap-1 text-sm">
            <ArrowLeft class="h-4 w-4" />
            Back
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-base-100 rounded-lg shadow-md p-6">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-primary mb-2">Select Stores to Print</h2>
          <p class="text-gray-600 mb-4">Choose which stores you want to print. Each store will be printed on its own page.</p>
        </div>

        {#if Object.keys(ingredientsByStore).length === 0}
          <div class="text-center py-8">
            <Store class="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-semibold text-gray-700 mb-2">No Ingredients Found</h3>
            <p class="text-gray-500 mb-6">Add some ingredients to your shopping list first.</p>
            <a href="/shopping" class="btn btn-primary">Go to Shopping Lists</a>
          </div>
        {:else}
          <div class="space-y-3">
            {#each Object.entries(ingredientsByStore) as [storeId, storeIngredients]}
              {#if storeIngredients.length > 0}
                <div class="flex items-center gap-3 p-4 border border-base-300 rounded-lg hover:bg-base-50 transition-colors">
                  <button
                    class="btn btn-ghost btn-sm p-1"
                    on:click={() => toggleStore(storeId)}
                  >
                    {#if selectedStores.has(storeId)}
                      <CheckSquare class="h-5 w-5 text-primary" />
                    {:else}
                      <Square class="h-5 w-5 text-gray-400" />
                    {/if}
                  </button>
                  
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <Store class="h-4 w-4 text-gray-500" />
                      <h3 class="font-semibold text-gray-800">{getStoreName(storeId)}</h3>
                      <span class="text-sm text-gray-500">({getIngredientCount(storeId)} items)</span>
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>

          <div class="mt-8 pt-6 border-t border-base-300">
            <div class="text-center mb-4">
              <div class="text-lg font-medium text-gray-700">
                {selectedStores.size} store{selectedStores.size !== 1 ? 's' : ''} selected
              </div>
            </div>
            <div class="flex justify-center">
              <button
                class="btn btn-primary btn-lg"
                on:click={printSelected}
                disabled={selectedStores.size === 0}
              >
                <Printer class="h-5 w-5" />
                Print Selected Stores
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
