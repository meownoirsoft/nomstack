<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api.js';
  import { currentMealPlan } from '$lib/stores/mealPlan.js';
  import { ShoppingCart, Store, CheckSquare, Square } from 'lucide-svelte';

  let stores = [];
  let ingredients = [];
  let loading = true;
  let error = null;
  let selectedStoreIds = [];
  let ingredientsByStore = {};
  let ingredientsByCategory = {};
  let categoryOrder = {}; // Store custom category order per store
  let mealPlan = null; // Store meal plan data locally

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      // Get store IDs and meal plan ID from URL params
      const urlParams = new URLSearchParams($page.url.search);
      const storesParam = urlParams.get('stores');
      const planIdParam = urlParams.get('plan_id');
      
      if (!storesParam) {
        error = 'No stores specified for printing';
        return;
      }
      selectedStoreIds = storesParam.split(',');

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

        // Group ingredients by category within each store
        ingredientsByCategory = Object.keys(ingredientsByStore).reduce((acc, storeId) => {
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

  function getUncheckedCount(storeId) {
    return ingredientsByStore[storeId]?.filter(ing => !ing.checked).length || 0;
  }

  // Helper function to format amount for display
  function formatAmount(amount) {
    if (!amount) return '';
    
    // If it's already a mixed number (contains space) or whole number, return as is
    if (amount.includes(' ')) return amount;
    
    // If it's an improper fraction (contains / but no space), convert to mixed number
    if (amount.includes('/') && !amount.includes(' ')) {
      const [numerator, denominator] = amount.split('/').map(Number);
      return toMixedNumber(numerator, denominator);
    }
    
    return amount;
  }

  // Helper function to convert improper fraction to mixed number
  function toMixedNumber(numerator, denominator) {
    const whole = Math.floor(numerator / denominator);
    const remainder = numerator % denominator;
    
    if (remainder === 0) {
      return whole.toString();
    } else if (whole === 0) {
      return `${remainder}/${denominator}`;
    } else {
      return `${whole} ${remainder}/${denominator}`;
    }
  }

  // Helper function to extract core ingredient name
  function extractCoreIngredient(name) {
    // Remove common prefixes and suffixes that don't affect the core ingredient
    let core = name.toLowerCase()
      .replace(/^\d+\/\d+\s*(tsp|tbsp|cup|cups|lb|lbs|oz|g|kg|ml|l)\s*/, '') // Remove amount + unit at start
      .replace(/^\d+\s*(tsp|tbsp|cup|cups|lb|lbs|oz|g|kg|ml|l)\s*/, '') // Remove just unit at start
      .replace(/\s*\([^)]*\)\s*$/, '') // Remove parenthetical descriptions at end
      .replace(/\s*,\s*[^,]*$/, '') // Remove comma descriptions at end
      .replace(/\s*\([^)]*\)/g, '') // Remove ALL parenthetical descriptions anywhere
      .replace(/\s*,\s*[^,]*/g, '') // Remove ALL comma descriptions anywhere
      .replace(/\s+(sliced|diced|chopped|minced|grated|julienne|thinly|thickly|finely|coarsely)\s*$/, '') // Remove preparation methods
      .replace(/\s+(skinless|boneless|fresh|dried|frozen|canned|whole|halves|half)\s*$/, '') // Remove descriptors
      .replace(/\s+(prepared|packed|lightly|extra|large|medium|small)\s*$/, '') // Remove more descriptors
      .trim();
    
    return core;
  }

  // Load category order from localStorage
  function loadCategoryOrder() {
    if (typeof window !== 'undefined') {
      const planId = (mealPlan || $currentMealPlan)?.id || 'default';
      const saved = localStorage.getItem(`categoryOrder_${planId}`);
      if (saved) {
        try {
          categoryOrder = JSON.parse(saved);
        } catch (e) {
          console.error('Error loading category order:', e);
          categoryOrder = {};
        }
      }
    }
  }

  // Get ordered categories for a store
  function getOrderedCategories(storeId) {
    const storeCategories = Object.keys(ingredientsByCategory[storeId] || {});
    const customOrder = categoryOrder[storeId] || [];
    
    // Start with custom order, then add any missing categories
    const ordered = [...customOrder];
    storeCategories.forEach(cat => {
      if (!ordered.includes(cat)) {
        ordered.push(cat);
      }
    });
    
    return ordered;
  }

  function printPage() {
    window.print();
  }

  // Load category order when component mounts or meal plan changes
  $: if (mealPlan || $currentMealPlan) {
    loadCategoryOrder();
  }

  // Create ordered categories for each store to avoid infinite loops
  $: orderedCategoriesByStore = Object.keys(ingredientsByCategory).reduce((acc, storeId) => {
    acc[storeId] = getOrderedCategories(storeId);
    return acc;
  }, {});
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
    <!-- Print Header -->
    <div class="print:hidden bg-base-200 p-4 border-b">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
            <ShoppingCart class="h-6 w-6" />
            Shopping List
          </h1>
          <p class="text-gray-600">{(mealPlan || $currentMealPlan)?.title}</p>
        </div>
        <div class="flex gap-2">
          <a href="/shopping/print-select?plan_id={(mealPlan || $currentMealPlan)?.id}" class="btn btn-outline">
            Back to Selection
          </a>
          <button class="btn btn-primary" on:click={printPage}>
            Print
          </button>
        </div>
      </div>
    </div>

    <!-- Shopping Lists -->
    <div class="max-w-4xl mx-auto p-6 print:p-4">
      {#each selectedStoreIds as storeId, index}
        {#if ingredientsByStore[storeId] && ingredientsByStore[storeId].length > 0}
          <!-- Page break for each store except the first -->
          {#if index > 0}
            <div class="print:page-break-before-always"></div>
          {/if}

          <div class="print:min-h-screen">
            <!-- Store Header -->
            <div class="text-center mb-8 print:mb-6">
              <h1 class="text-3xl font-bold text-gray-800 print:text-2xl mb-2 flex items-center justify-center gap-2">
                <Store class="h-8 w-8 print:h-6 print:w-6" />
                {getStoreName(storeId)}
              </h1>
              <p class="text-gray-600 print:text-sm">{(mealPlan || $currentMealPlan)?.title}</p>
              <p class="text-gray-500 print:text-xs">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <!-- Ingredients by Category -->
            <div class="space-y-6 print:space-y-4">
              {#if ingredientsByCategory[storeId]}
                {#each orderedCategoriesByStore[storeId] || [] as category}
                  {@const categoryIngredients = ingredientsByCategory[storeId][category]}
                  {#if categoryIngredients}
                  <div class="bg-white border border-gray-300 rounded-lg print:border-gray-400 print:rounded-none">
                    <!-- Category Header -->
                    <div class="bg-gray-100 print:bg-gray-200 p-4 print:p-3 border-b border-gray-300 print:border-gray-400">
                      <h2 class="text-xl font-bold text-gray-800 print:text-lg">
                        {category}
                        <span class="text-sm font-normal text-gray-600 print:text-xs ml-2">
                          ({categoryIngredients.length} items)
                        </span>
                      </h2>
                    </div>

                    <!-- Ingredients -->
                    <div class="p-4 print:p-3">
                      <div class="space-y-2 print:space-y-1">
                        {#each categoryIngredients as ingredient}
                          <div class="flex items-center gap-3 p-2 print:p-1 {ingredient.checked ? 'opacity-60' : ''}">
                            <!-- Checkbox -->
                            <div class="flex-shrink-0">
                              {#if ingredient.checked}
                                <CheckSquare class="h-6 w-6 print:h-5 print:w-5 text-green-600" />
                              {:else}
                                <Square class="h-6 w-6 print:h-5 print:w-5 text-gray-400" />
                              {/if}
                            </div>

                            <!-- Ingredient Info -->
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2">
                                <span class="{ingredient.checked ? 'line-through text-gray-500' : ''}">
                                  <span class="font-medium {ingredient.checked ? 'text-gray-500' : 'text-gray-800'} print:text-sm">
                                    {extractCoreIngredient(ingredient.name)}
                                  </span>
                                  {#if ingredient.amount}
                                    <span class="text-sm text-gray-600 print:text-xs ml-2">
                                      {formatAmount(ingredient.amount)} {ingredient.unit || ''}
                                    </span>
                                  {/if}
                                  {#if ingredient.is_custom}
                                    <span class="badge badge-sm badge-secondary print:text-xs ml-2">Custom</span>
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
                  </div>
                  {/if}
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      {/each}
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
    
    .print\\:p-1 {
      padding: 0.25rem !important;
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
    
    .print\\:space-y-4 > * + * {
      margin-top: 1rem !important;
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
    
    .print\\:text-sm {
      font-size: 0.875rem !important;
    }
    
    .print\\:text-xs {
      font-size: 0.75rem !important;
    }
    
    .print\\:h-6 {
      height: 1.5rem !important;
    }
    
    .print\\:w-6 {
      width: 1.5rem !important;
    }
    
    .print\\:h-5 {
      height: 1.25rem !important;
    }
    
    .print\\:w-5 {
      width: 1.25rem !important;
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
    
    .print\\:page-break-before-always {
      page-break-before: always !important;
    }
    
    .print\\:min-h-screen {
      min-height: 100vh !important;
    }
  }
</style>