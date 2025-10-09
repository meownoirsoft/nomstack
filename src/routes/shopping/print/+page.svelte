<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { ShoppingCart, Store, CheckSquare, Square } from 'lucide-svelte';

  export let data;

  let currentMealPlan = null;
  let stores = [];
  let ingredients = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      // Load current meal plan
      const mealPlansResult = await api.getMealPlans('active');
      if (mealPlansResult.success && mealPlansResult.data.length > 0) {
        currentMealPlan = mealPlansResult.data[0];
        
        // Load stores
        const storesResult = await api.getStores();
        if (storesResult.success) {
          stores = storesResult.data;
        }

        // Load ingredients for this plan
        const ingredientsResult = await api.getIngredients({ plan_id: currentMealPlan.id });
        if (ingredientsResult.success) {
          ingredients = ingredientsResult.data;
        }
      }

    } catch (err) {
      console.error('Error loading shopping data:', err);
      error = err.message || 'Failed to load shopping data';
    } finally {
      loading = false;
    }
  }

  // Group ingredients by store
  $: ingredientsByStore = ingredients.reduce((acc, ingredient) => {
    const storeId = ingredient.store_id || 'unassigned';
    if (!acc[storeId]) {
      acc[storeId] = [];
    }
    acc[storeId].push(ingredient);
    return acc;
  }, {});

  // Group ingredients by category within each store
  $: ingredientsByCategory = Object.keys(ingredientsByStore).reduce((acc, storeId) => {
    acc[storeId] = ingredientsByStore[storeId].reduce((categoryAcc, ingredient) => {
      const category = ingredient.category || 'Other';
      if (!categoryAcc[category]) {
        categoryAcc[category] = [];
      }
      categoryAcc[category].push(ingredient);
      return categoryAcc;
    }, {});
    return acc;
  }, {});

  function getStoreName(storeId) {
    if (storeId === 'unassigned') return 'Unassigned';
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : 'Unknown Store';
  }

  function getIngredientCount(storeId) {
    return ingredientsByStore[storeId]?.length || 0;
  }

  function getUncheckedCount(storeId) {
    return ingredientsByStore[storeId]?.filter(ing => !ing.checked).length || 0;
  }

  function printPage() {
    window.print();
  }
</script>

<svelte:head>
  <title>Shopping List - nomStack</title>
</svelte:head>

<div class="min-h-screen bg-white print:bg-white">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-gray-600">Loading shopping list...</p>
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
  {:else if !currentMealPlan}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <ShoppingCart class="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 class="text-2xl font-bold text-gray-600 mb-2">No Active Meal Plan</h1>
        <p class="text-gray-500 mb-6">Create a meal plan first to generate shopping lists</p>
        <a href="/shopping" class="btn btn-primary">Go to Shopping Lists</a>
      </div>
    </div>
  {:else}
    <!-- Print Header -->
    <div class="print:hidden bg-base-200 p-4 border-b">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
            <ShoppingCart class="h-6 w-6" />
            Shopping List
          </h1>
          <p class="text-gray-600">{currentMealPlan.title}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-outline btn-primary" on:click={() => window.history.back()}>
            Back
          </button>
          <button class="btn btn-primary" on:click={printPage}>
            Print
          </button>
        </div>
      </div>
    </div>

    <!-- Shopping Lists -->
    <div class="max-w-4xl mx-auto p-6 print:p-4">
      <div class="text-center mb-8 print:mb-6">
        <h1 class="text-3xl font-bold text-gray-800 print:text-2xl mb-2">Shopping List</h1>
        <p class="text-gray-600 print:text-sm">{currentMealPlan.title}</p>
        <p class="text-gray-500 print:text-xs">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {#if stores.length === 0}
        <div class="text-center py-8">
          <Store class="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 class="text-xl font-semibold text-gray-600 mb-2">No Stores Yet</h2>
          <p class="text-gray-500">Create stores to organize your shopping list</p>
        </div>
      {:else}
        <div class="space-y-8 print:space-y-6">
          {#each Object.entries(ingredientsByStore) as [storeId, storeIngredients]}
            {#if storeIngredients.length > 0}
              <div class="bg-white border border-gray-300 rounded-lg print:border-gray-400 print:rounded-none">
                <!-- Store Header -->
                <div class="bg-gray-100 print:bg-gray-200 p-4 print:p-3 border-b border-gray-300 print:border-gray-400">
                  <h2 class="text-xl font-bold text-gray-800 print:text-lg flex items-center gap-2">
                    <Store class="h-5 w-5 print:h-4 print:w-4" />
                    {getStoreName(storeId)}
                    <span class="text-sm font-normal text-gray-600 print:text-xs">
                      ({getIngredientCount(storeId)} items, {getUncheckedCount(storeId)} remaining)
                    </span>
                  </h2>
                </div>

                <!-- Ingredients by Category -->
                <div class="p-4 print:p-3">
                  {#if ingredientsByCategory[storeId]}
                    {#each Object.entries(ingredientsByCategory[storeId]) as [category, categoryIngredients]}
                      <div class="mb-6 print:mb-4 last:mb-0">
                        <h3 class="text-lg font-semibold text-gray-700 print:text-base mb-3 print:mb-2 border-b border-gray-200 print:border-gray-300 pb-1">
                          {category}
                          <span class="text-sm font-normal text-gray-500 print:text-xs">({categoryIngredients.length})</span>
                        </h3>
                        
                        <div class="space-y-2 print:space-y-1">
                          {#each categoryIngredients as ingredient}
                            <div class="flex items-center gap-3 p-2 print:p-1 {ingredient.deemphasized ? 'opacity-60' : ''}">
                              <!-- Checkbox -->
                              <div class="flex-shrink-0">
                                {#if ingredient.checked}
                                  <CheckSquare class="h-5 w-5 print:h-4 print:w-4 text-green-600" />
                                {:else}
                                  <Square class="h-5 w-5 print:h-4 print:w-4 text-gray-400" />
                                {/if}
                              </div>

                              <!-- Ingredient Info -->
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2">
                                  <span class="{ingredient.checked ? 'line-through text-gray-500' : ''}">
                                    <span class="font-medium {ingredient.checked ? 'text-gray-500' : 'text-gray-800'} print:text-sm">
                                      {ingredient.name}
                                    </span>
                                    {#if ingredient.amount}
                                      <span class="text-sm text-gray-600 print:text-xs">
                                        {ingredient.amount} {ingredient.unit || ''}
                                      </span>
                                    {/if}
                                    {#if ingredient.is_custom}
                                      <span class="badge badge-sm badge-secondary print:text-xs">Custom</span>
                                    {/if}
                                  </span>
                                  {#if ingredient.checked}
                                    <span class="text-xs text-gray-500 ml-1">have this</span>
                                  {/if}
                                </div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    .print\\:hidden {
      display: none !important;
    }
    
    .print\\:bg-white {
      background-color: white !important;
    }
    
    .print\\:p-4 {
      padding: 1rem !important;
    }
    
    .print\\:p-3 {
      padding: 0.75rem !important;
    }
    
    .print\\:mb-6 {
      margin-bottom: 1.5rem !important;
    }
    
    .print\\:mb-4 {
      margin-bottom: 1rem !important;
    }
    
    .print\\:mb-2 {
      margin-bottom: 0.5rem !important;
    }
    
    .print\\:space-y-6 > * + * {
      margin-top: 1.5rem !important;
    }
    
    .print\\:space-y-1 > * + * {
      margin-top: 0.25rem !important;
    }
    
    .print\\:text-2xl {
      font-size: 1.5rem !important;
    }
    
    .print\\:text-lg {
      font-size: 1.125rem !important;
    }
    
    .print\\:text-base {
      font-size: 1rem !important;
    }
    
    .print\\:text-sm {
      font-size: 0.875rem !important;
    }
    
    .print\\:text-xs {
      font-size: 0.75rem !important;
    }
    
    .print\\:h-4 {
      height: 1rem !important;
    }
    
    .print\\:w-4 {
      width: 1rem !important;
    }
    
    .print\\:border-gray-400 {
      border-color: #9ca3af !important;
    }
    
    .print\\:border-gray-300 {
      border-color: #d1d5db !important;
    }
    
    .print\\:bg-gray-200 {
      background-color: #e5e7eb !important;
    }
    
    .print\\:rounded-none {
      border-radius: 0 !important;
    }
  }
</style>
