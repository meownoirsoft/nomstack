<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { Store, Plus, ChevronUp, ChevronDown, CheckSquare, Square, ArrowRightLeft, TableCellsMerge, HelpCircle, ChevronLeft, ChevronRight, ChefHat, Calendar } from 'lucide-svelte';
  import AddItem from './AddItem.svelte';

  const dispatch = createEventDispatcher();

  export let stores = [];
  export let ingredients = [];
  export let currentMealPlan = null;

  let activeStoreId = null;
  let showAddItem = false;
  let openDropdowns = new Set();
  let tabsContainer = null;
  let showLeftChevron = false;
  let showRightChevron = false;
  
  const categories = ['Produce', 'Meat & Seafood', 'Dairy', 'Pantry', 'Frozen', 'Bakery', 'Other'];

  // Helper function to parse a fraction string into a decimal
  function parseFraction(str) {
    if (!str) return 0;
    if (str.includes('/')) {
      const [numerator, denominator] = str.split('/').map(Number);
      return numerator / denominator;
    }
    return parseFloat(str) || 0;
  }

  // Helper function to convert decimal to fraction
  function decimalToFraction(decimal) {
    // Handle common cooking fractions
    const commonFractions = {
      0.125: { numerator: 1, denominator: 8 },
      0.25: { numerator: 1, denominator: 4 },
      0.333: { numerator: 1, denominator: 3 },
      0.5: { numerator: 1, denominator: 2 },
      0.667: { numerator: 2, denominator: 3 },
      0.75: { numerator: 3, denominator: 4 },
      1.5: { numerator: 3, denominator: 2 },
      2.5: { numerator: 5, denominator: 2 }
    };
    
    // Check for exact matches first
    for (const [key, value] of Object.entries(commonFractions)) {
      if (Math.abs(decimal - parseFloat(key)) < 0.01) {
        return value;
      }
    }
    
    // Fallback to continued fraction algorithm
    const tolerance = 1e-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = decimal;
    
    do {
      let a = Math.floor(b);
      let aux = h1; h1 = a * h1 + h2; h2 = aux;
      aux = k1; k1 = a * k1 + k2; k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
    
    return { numerator: h1, denominator: k1 };
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

  // Helper function to format amount for display (convert improper fractions to mixed numbers)
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

  // Helper function to combine ingredient amounts
  function combineAmounts(amount1, amount2, unit1, unit2) {
    // If units don't match, return the first amount
    if (unit1 !== unit2) {
      return { amount: amount1, unit: unit1 };
    }
    
    // If no amounts, return empty
    if (!amount1 && !amount2) {
      return { amount: '', unit: unit1 || unit2 };
    }
    
    // If only one has amount, return that one
    if (!amount1) return { amount: amount2, unit: unit2 };
    if (!amount2) return { amount: amount1, unit: unit1 };
    
    // Parse both amounts to decimals
    const num1 = parseFraction(amount1);
    const num2 = parseFraction(amount2);
    const total = num1 + num2;
    
    
    // Convert back to fraction if it's not a whole number
    if (Math.abs(total - Math.round(total)) < 0.001) {
      return { amount: Math.round(total).toString(), unit: unit1 };
    } else {
      const fraction = decimalToFraction(total);
      const mixedNumber = toMixedNumber(fraction.numerator, fraction.denominator);
      return { 
        amount: mixedNumber, 
        unit: unit1 
      };
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

  // Function to check if chevrons should be visible
  function checkChevronVisibility() {
    if (!tabsContainer) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;
    showLeftChevron = scrollLeft > 0;
    showRightChevron = scrollLeft < scrollWidth - clientWidth;
  }

  // Function to scroll tabs
  function scrollTabs(direction) {
    if (!tabsContainer) return;
    
    const scrollAmount = 200; // pixels to scroll
    const newScrollLeft = direction === 'left' 
      ? tabsContainer.scrollLeft - scrollAmount
      : tabsContainer.scrollLeft + scrollAmount;
    
    tabsContainer.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }

  // Check chevron visibility when stores change or component mounts
  $: if (tabsContainer && stores) {
    setTimeout(checkChevronVisibility, 100);
  }

  // Helper function to find all source recipes for an ingredient
  function findSourceRecipes(ingredientName, allIngredients) {
    const coreName = extractCoreIngredient(ingredientName);
    const sourceRecipes = [];
    
    for (const ing of allIngredients) {
      const ingCoreName = extractCoreIngredient(ing.name);
      if (ingCoreName === coreName && ing.source_recipe_id) {
        if (!sourceRecipes.includes(ing.source_recipe_id)) {
          sourceRecipes.push(ing.source_recipe_id);
        }
      }
    }
    
    return sourceRecipes;
  }

  // Group ingredients by store and combine duplicates
  $: ingredientsByStore = ingredients.reduce((acc, ingredient) => {
    const storeId = ingredient.store_id || 'unassigned';
    if (!acc[storeId]) {
      acc[storeId] = [];
    }
    
    const coreName = extractCoreIngredient(ingredient.name);
    
    // Check if we already have this core ingredient name in this store
    const existingIndex = acc[storeId].findIndex(existing => {
      const existingCore = extractCoreIngredient(existing.name);
      return existingCore === coreName;
    });
    
    if (existingIndex >= 0) {
      // Combine with existing ingredient
      const existing = acc[storeId][existingIndex];
      const combined = combineAmounts(existing.amount, ingredient.amount, existing.unit, ingredient.unit);
      
      // Find all source recipes for this ingredient
      const allSourceRecipes = findSourceRecipes(ingredient.name, ingredients);
      
      // Create a combined ingredient object
      const combinedIngredient = {
        ...existing,
        amount: combined.amount,
        unit: combined.unit,
        // Keep track of source recipes
        sourceRecipes: allSourceRecipes
      };
      
      acc[storeId][existingIndex] = combinedIngredient;
    } else {
      // Find all source recipes for this ingredient
      const allSourceRecipes = findSourceRecipes(ingredient.name, ingredients);
      
      // Add new ingredient
      acc[storeId].push({
        ...ingredient,
        sourceRecipes: allSourceRecipes
      });
    }
    
    return acc;
  }, {});

  // Force reactivity by creating a derived value
  $: ingredientsKey = ingredients.map(i => `${i.id}-${i.store_id}`).join(',');

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

  // Set active store to 'unassigned' (List tab) by default
  $: if (!activeStoreId) {
    activeStoreId = 'unassigned';
  }

  async function toggleIngredient(ingredientId, field) {
    try {
      console.log('Toggling ingredient:', ingredientId, field);
      const result = await api.toggleIngredient(ingredientId, field);
      console.log('Toggle result:', result);
      if (result.success) {
        const updatedIngredient = result.data;
        console.log('Updated ingredient:', updatedIngredient);
        dispatch('ingredient-updated', updatedIngredient);
      } else {
        throw new Error(result.error || 'Failed to toggle ingredient');
      }
    } catch (err) {
      console.error('Error toggling ingredient:', err);
      notifyError(err.message || 'Failed to update ingredient');
    }
  }

  async function moveIngredient(ingredientId, newStoreId) {
    try {
      console.log('Moving ingredient:', ingredientId, 'to store:', newStoreId);
      const result = await api.moveIngredient(ingredientId, newStoreId);
      console.log('Move result:', result);
      if (result.success) {
        const updatedIngredient = result.data;
        console.log('Updated ingredient after move:', updatedIngredient);
        dispatch('ingredient-updated', updatedIngredient);
        notifySuccess('Ingredient moved');
        
        // Close the dropdown
        openDropdowns.delete(ingredientId);
        openDropdowns = openDropdowns; // Trigger reactivity
      } else {
        throw new Error(result.error || 'Failed to move ingredient');
      }
    } catch (err) {
      console.error('Error moving ingredient:', err);
      notifyError(err.message || 'Failed to move ingredient');
    }
  }


  async function updateIngredientCategory(ingredientId, newCategory) {
    try {
      const result = await api.updateIngredient(ingredientId, { category: newCategory });
      if (result.success) {
        const updatedIngredient = result.data;
        dispatch('ingredient-updated', updatedIngredient);
        notifySuccess('Category updated');
      } else {
        throw new Error(result.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      notifyError(err.message || 'Failed to update category');
    }
  }

  async function handleIngredientAdded(ingredient) {
    // The parent component will handle this
    dispatch('ingredient-added', ingredient);
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
</script>

<div class="space-y-6 mb-16">
  <!-- Store Tabs -->
  <div class="bg-base-100 rounded-lg shadow-md">
    <div class="border-b border-base-200">
      <div class="relative flex items-center">
        <!-- Left Chevron -->
        {#if showLeftChevron}
          <button
            class="absolute left-0 z-10 bg-base-100 hover:bg-base-200 p-2 rounded-r-lg shadow-md"
            on:click={() => scrollTabs('left')}
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
        {/if}
        
        <!-- Right Chevron -->
        {#if showRightChevron}
          <button
            class="absolute right-0 z-10 bg-base-100 hover:bg-base-200 p-2 rounded-l-lg shadow-md"
            on:click={() => scrollTabs('right')}
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        {/if}
        
        <!-- Tabs Container -->
        <div 
          bind:this={tabsContainer}
          class="flex overflow-x-auto scrollbar-hide {showLeftChevron ? 'pl-10' : ''} {showRightChevron ? 'pr-10' : ''}"
          on:scroll={checkChevronVisibility}
        >
          <!-- List Tab -->
          <button
            class="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors {activeStoreId === 'unassigned' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            on:click={() => activeStoreId = 'unassigned'}
          >
            <HelpCircle class="h-4 w-4" />
            List
          </button>

          <!-- Store Tabs -->
          {#each stores as store}
            <button
              class="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors {activeStoreId === store.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}"
              on:click={() => activeStoreId = store.id}
            >
              <Store class="h-4 w-4" />
              {store.name}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Store Content -->
    <div class="px-3 py-4 pb-2 max-h-[calc(100vh-240px)] overflow-y-auto">
      {#if activeStoreId}
               <div class="flex items-center justify-between mb-4">
                 <h3 class="text-lg font-semibold text-primary">
                   {getStoreName(activeStoreId)}
                   <span class="text-sm font-normal text-gray-600 ml-2">
                     ({getIngredientCount(activeStoreId)} items)
                   </span>
                 </h3>
          {#if activeStoreId !== 'unassigned'}
            <button
              class="btn btn-sm btn-primary"
              on:click={() => showAddItem = !showAddItem}
            >
              <Plus class="h-4 w-4" />
              Add Item
            </button>
          {/if}
        </div>

        <!-- Add Item Form -->
        {#if showAddItem && activeStoreId !== 'unassigned'}
          <div class="mb-6">
            <AddItem
              storeId={activeStoreId}
              planId={currentMealPlan?.id}
              on:ingredient-added={handleIngredientAdded}
              on:close={() => showAddItem = false}
            />
          </div>
        {/if}

        <!-- Ingredients by Category -->
        {#if ingredientsByCategory[activeStoreId]}
          {#each Object.entries(ingredientsByCategory[activeStoreId]) as [category, categoryIngredients]}
            <div class="mb-6">
              <h4 class="text-md font-medium text-gray-700 mb-1 flex items-center gap-2 border-b border-gray-200 pb-1">
                {category}
                <span class="text-sm font-normal text-gray-500">({categoryIngredients.length})</span>
              </h4>
              
              <!-- Column Headers -->
              <div class="flex items-center gap-3 py-2 px-0 bg-base-300 rounded-t-lg text-xs font-bold text-gray-600">
                <div class="flex-1">Ingredient</div>
                <div class="w-6 text-right">Have?</div>
                <div class="w-8 text-right">Store</div>
              </div>
              
              <div class="space-y-1" style="gap: 1px;">
                {#each categoryIngredients as ingredient}
                  <div class="flex items-start gap-3 px-0 py-0 bg-base-200 rounded-lg">

                    <!-- Ingredient Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start gap-2">
                        <span class="{ingredient.checked ? 'line-through opacity-60' : ''}">
                          {#if ingredient.amount}
                            <span class="text-sm text-gray-600">
                              {formatAmount(ingredient.amount)}&nbsp;{ingredient.unit || ''}
                            </span>
                          {/if}
                          <span class="text-sm text-gray-600">
                            {extractCoreIngredient(ingredient.name)}
                          </span>
                          {#if ingredient.is_custom}
                            <span class="badge badge-sm badge-secondary">Custom</span>
                          {/if}
                          {#if ingredient.sourceRecipes && ingredient.sourceRecipes.length > 1}
                            <span class="badge badge-sm badge-primary">+{ingredient.sourceRecipes.length - 1}</span>
                          {/if}
                        </span>
                        {#if ingredient.checked}
                          <span class="text-xs text-gray-500 ml-1">have this</span>
                        {/if}
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-start gap-0.5 flex-shrink-0 pr-1 pt-0 pb-0.5 -mt-1">
                      <!-- Have Toggle -->
                      <button
                        class="btn btn-ghost btn-sm p-1"
                        on:click={() => toggleIngredient(ingredient.id, 'checked')}
                        title={ingredient.checked ? 'Mark as need to buy' : 'Mark as already have'}
                      >
                        <TableCellsMerge class="h-5 w-5" />
                      </button>

                      <!-- Move to Store -->
                      <div class="dropdown dropdown-end" class:dropdown-open={openDropdowns.has(ingredient.id)}>
                        <button 
                          class="btn btn-ghost btn-sm p-1" 
                          tabindex="0"
                          on:click={() => {
                            if (openDropdowns.has(ingredient.id)) {
                              openDropdowns.delete(ingredient.id);
                            } else {
                              openDropdowns.add(ingredient.id);
                            }
                            openDropdowns = openDropdowns;
                          }}
                        >
                          <ArrowRightLeft class="h-5 w-5" />
                        </button>
                        <ul class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                          {#if activeStoreId !== 'unassigned'}
                            <li><button on:click|preventDefault={() => moveIngredient(ingredient.id, null)}>Move to List</button></li>
                          {/if}
                          {#each stores.filter(s => s.id !== activeStoreId) as store}
                            <li><button on:click|preventDefault={() => moveIngredient(ingredient.id, store.id)}>Move to {store.name}</button></li>
                          {/each}
                        </ul>
                      </div>

                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-center py-8">
            {#if activeStoreId === 'unassigned'}
              <!-- List tab empty state -->
              <HelpCircle class="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 class="text-lg font-semibold text-gray-700 mb-2">No ingredients to shop for</h3>
              <p class="text-gray-600 mb-4">
                You've selected meals for your plan, but they need recipes to generate a shopping list.
              </p>
              <p class="text-sm text-gray-500 mb-6">
                You can add recipes to selected meals to see ingredients or add one-off items to store tabs.
              </p>
              <div class="flex justify-center gap-3">
                <a href="/recipes" class="btn btn-primary">
                  <ChefHat class="h-4 w-4" />
                  Add Recipes
                </a>
                <a href="/" class="btn btn-outline">
                  <Calendar class="h-4 w-4" />
                  Manage Meals
                </a>
              </div>
            {:else}
              <!-- Store tab empty state -->
              <Store class="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p class="text-gray-500">No ingredients in this store yet</p>
              <button
                class="btn btn-primary btn-sm mt-4"
                on:click={() => showAddItem = true}
              >
                <Plus class="h-4 w-4" />
                Add First Item
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
