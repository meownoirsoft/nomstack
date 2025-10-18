<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { currentMealPlan, mealPlans, loadingMealPlans, loadMealPlans, setCurrentMealPlan } from '$lib/stores/mealPlan.js';
  import { ShoppingCart, Plus, Store, Calendar, Printer, Edit3, ChefHat, CookingPot, TableCellsSplit } from 'lucide-svelte';
  import MealPlanManager from '$lib/components/MealPlanManager.svelte';
  import StoreTabs from '$lib/components/StoreTabs.svelte';
  import AddItem from '$lib/components/AddItem.svelte';

  export let data;

  let sels = []; // Track selected meals for meal plan (using existing system)
  let stores = [];
  let ingredients = [];
  let loading = true;
  let error = null;
  let forceUpdate = 0;
  let loadingIngredients = false;
  let lastLoadedPlanId = null;
  let ingredientsLoaded = false;
  let showMealPlanManager = false;

  // Load initial data
  onMount(async () => {
    try {
      loading = true;
      await loadData();
      await loadSelections();
    } catch (err) {
      console.error('Error loading initial data:', err);
      error = err.message || 'Failed to load data';
    } finally {
      loading = false;
    }
  });


  // React to meal plan ID changes specifically
  $: if ($currentMealPlan?.id) {
    console.log('Meal plan ID changed to:', $currentMealPlan.id);
    console.log('Last loaded plan ID:', lastLoadedPlanId);
    console.log('Loading ingredients flag:', loadingIngredients);
    // Only load if this is a different plan than what we last loaded
    if ($currentMealPlan.id !== lastLoadedPlanId && !loadingIngredients) {
      console.log('Loading ingredients for new plan:', $currentMealPlan.id);
      // Clear ingredients immediately to prevent showing old ones
      ingredients = [];
      ingredientsLoaded = false;
      loadIngredientsForPlan();
    } else {
      console.log('Skipping load - same plan or already loading');
    }
  } else {
    console.log('No meal plan selected, clearing ingredients');
    // Clear ingredients when no meal plan is selected
    ingredients = [];
    lastLoadedPlanId = null;
    ingredientsLoaded = true; // Mark as loaded so we show the empty state
  }


  async function loadIngredientsForPlan() {
    if (!$currentMealPlan) {
      console.log('loadIngredientsForPlan: No current meal plan, clearing ingredients');
      ingredients = [];
      lastLoadedPlanId = null;
      ingredientsLoaded = true;
      return;
    }

    if (loadingIngredients) {
      console.log('loadIngredientsForPlan: Already loading, skipping');
      return;
    }

    loadingIngredients = true;
    ingredientsLoaded = false;
    try {
      console.log('loadIngredientsForPlan: Loading ingredients for meal plan:', $currentMealPlan.id);
      console.log('loadIngredientsForPlan: Meal plan object:', $currentMealPlan);
      
      // First, check if ingredients already exist for this plan
      const existingIngredientsResult = await api.getIngredients({ plan_id: $currentMealPlan.id });
      console.log('loadIngredientsForPlan: Existing ingredients check:', existingIngredientsResult);
      console.log('loadIngredientsForPlan: API response success:', existingIngredientsResult.success);
      console.log('loadIngredientsForPlan: API response data length:', existingIngredientsResult.data?.length);
      
      // Always regenerate ingredients to ensure they match the selected meals
      console.log('loadIngredientsForPlan: Regenerating ingredients to ensure accuracy...');
      try {
        const regenerateResult = await api.regenerateIngredients($currentMealPlan.id);
        console.log('loadIngredientsForPlan: Regenerate result:', regenerateResult);
        if (regenerateResult.success) {
          console.log('loadIngredientsForPlan: Ingredients regenerated successfully');
          // Now load the regenerated ingredients
          const ingredientsResult = await api.getIngredients({ plan_id: $currentMealPlan.id });
          if (ingredientsResult.success) {
            ingredients = ingredientsResult.data;
            lastLoadedPlanId = $currentMealPlan.id;
            console.log('loadIngredientsForPlan: Loaded regenerated ingredients:', ingredients.length, 'items');
          }
        } else {
          console.error('loadIngredientsForPlan: Failed to regenerate ingredients:', regenerateResult.error);
          ingredients = [];
          lastLoadedPlanId = $currentMealPlan.id;
        }
      } catch (error) {
        console.error('loadIngredientsForPlan: Error regenerating ingredients:', error);
        ingredients = [];
        lastLoadedPlanId = $currentMealPlan.id;
      }
      
      // Check if we have ingredients from multiple recipes
      if (ingredients.length > 0) {
        const recipeIds = [...new Set(ingredients.map(ing => ing.source_recipe_id))];
        console.log('loadIngredientsForPlan: Ingredients from recipes:', recipeIds);
        
        if (recipeIds.length === 1) {
          console.log('WARNING: Only ingredients from one recipe found. Need multiple recipes with same ingredients to see combining.');
        }
      }
    } catch (err) {
      console.error('loadIngredientsForPlan: Error loading ingredients for plan:', err);
      ingredients = [];
      lastLoadedPlanId = $currentMealPlan.id; // Still mark as loaded even if error
    } finally {
      loadingIngredients = false;
      ingredientsLoaded = true;
    }
  }

  async function loadSelections() {
    try {
      const result = await api.getSelections('all', $currentMealPlan?.id);
      console.log('Selections result:', result);
      // The getSelections API returns an array of objects with {type, meals}
      // We need to extract the meals array from the first object
      if (Array.isArray(result) && result.length > 0 && result[0].meals) {
        sels = result[0].meals;
        console.log('Selected meals:', sels);
      } else {
        sels = [];
        console.log('No meals selected');
      }
    } catch (err) {
      console.error('Error loading selections:', err);
      sels = [];
    }
  }

  // Force refresh ingredients for current meal plan
  async function refreshIngredients() {
    if ($currentMealPlan) {
      console.log('Force refreshing ingredients for plan:', $currentMealPlan.id);
      lastLoadedPlanId = null; // Reset to force reload
      ingredients = []; // Clear current ingredients
      await loadIngredientsForPlan();
    }
  }


  async function loadData() {
    try {
      error = null;

      // Load stores
      const storesResult = await api.getStores();
      if (storesResult.success) {
        stores = storesResult.data;
        console.log('Loaded stores:', stores.length);
      }

      // Load meal plans using global store
      await loadMealPlans();
      
      // Debug: Log current meal plan state
      console.log('loadData: After loadMealPlans, currentMealPlan =', $currentMealPlan);
      
      // Ingredients will be loaded by the reactive statement when $currentMealPlan changes
      if ($currentMealPlan) {
        console.log('loadData: Current meal plan found:', $currentMealPlan.id);
      } else {
        console.log('loadData: No current meal plan found');
        lastLoadedPlanId = null;
      }

    } catch (err) {
      console.error('Error loading shopping data:', err);
      error = err.message || 'Failed to load shopping data';
    }
  }

  async function createMealPlan() {
    if (sels.length === 0) {
      notifyError('Please select at least one meal for your meal plan');
      return;
    }

    try {
      console.log('Creating meal plan with selections:', sels);
      const planData = {
        title: `Meal Plan - ${new Date().toLocaleDateString()}`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      const result = await api.createMealPlan(planData);
      console.log('Meal plan creation result:', result);
      if (result.success) {
        // Update global store
        currentMealPlan.set(result.data);
        notifySuccess('Meal plan created!');
        
        // Save the selected meals to the meal plan
        console.log('Saving selected meals to meal plan...');
        const saveSelectionsResult = await api.updateSelections('all', sels, result.data.id);
        if (saveSelectionsResult.success) {
          console.log('Selected meals saved to meal plan');
        } else {
          console.error('Failed to save selections to meal plan:', saveSelectionsResult.error);
        }
        
        // Generate ingredients from selected meals with recipes
        console.log('Generating ingredients from selected meals...');
        await generateIngredientsFromSelectedMeals();
        
        // Reload data
        console.log('Reloading data...');
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to create meal plan');
      }
    } catch (err) {
      console.error('Error creating meal plan:', err);
      notifyError(err.message || 'Failed to create meal plan');
    }
  }

  async function generateIngredientsFromSelectedMeals() {
    if (!$currentMealPlan) return;

    try {
      // Use the proper regeneration function that handles merging
      const result = await api.regenerateIngredients($currentMealPlan.id);
      if (result.success) {
        console.log('Ingredients regenerated successfully');
      } else {
        throw new Error(result.error || 'Failed to regenerate ingredients');
      }
    } catch (err) {
      console.error('Error generating ingredients:', err);
      notifyError(err.message || 'Failed to generate ingredients');
    }
  }

  async function handleIngredientAdded(ingredient) {
    ingredients = [...ingredients, ingredient];
  }




  async function handleIngredientUpdated(updatedIngredient) {
    console.log('handleIngredientUpdated called with:', updatedIngredient);
    console.log('Current ingredients before update:', ingredients.length);
    
    // Instead of trying to update the local state, reload from server
    if ($currentMealPlan) {
      console.log('Reloading ingredients from server...');
      const ingredientsResult = await api.getIngredients({ plan_id: $currentMealPlan.id });
      if (ingredientsResult.success) {
        ingredients = ingredientsResult.data;
        console.log('Reloaded ingredients:', ingredients.length);
      }
    }
  }





</script>

<svelte:head>
  <title>Shopping Lists - nomStack</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-primary/70">Loading shopping lists...</p>
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
  {:else if !$currentMealPlan}
    <!-- No meal plan - show meal selection -->
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="text-center mb-8">
        <ShoppingCart class="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 class="text-3xl font-bold text-primary mb-2">Shopping Lists</h1>
        <p class="text-primary/70">Select meals to create your shopping list</p>
      </div>

      <div class="bg-base-100 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <CookingPot class="h-5 w-5" />
          Current Meal Plan
        </h2>
        
        <div class="mb-4">
          <p class="text-sm text-primary/70 mb-3">
            {sels.length} meal{sels.length !== 1 ? 's' : ''} selected for this week
          </p>
          <a href="/" class="btn btn-sm btn-ghost text-primary">
            <CookingPot class="h-4 w-4 text-primary" />
            Manage Meals
          </a>
        </div>

        {#if sels.length > 0}
          <div class="text-center">
            <button
              class="btn btn-primary btn-lg"
              on:click={createMealPlan}
            >
              <Plus class="h-5 w-5 text-white" />
              Create Meal Plan
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Meal plan exists - show shopping lists -->
    <div class="max-w-6xl mx-auto px-2 py-2">
      <div class="mb-3">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold text-primary flex items-center gap-2">
      <ShoppingCart class="h-5 w-5" />
      Shopping Lists
    </h1>
    {#if $currentMealPlan}
      <div class="flex items-center gap-0">
        <div class="text-sm text-primary/70">
          <span>Plan Meals: {sels.length}</span>
        </div>
        <a href="/pantry" class="btn btn-ghost btn-sm text-primary hover:bg-primary/10" title="Manage pantry items">
          <TableCellsSplit class="h-4 w-4 text-primary" />
        </a>
        <a href="/shopping/print-select" class="btn btn-ghost btn-sm text-primary hover:bg-primary/10" title="Print shopping lists">
          <Printer class="h-4 w-4 text-primary" />
        </a>
      </div>
    {/if}
  </div>
  
        <div class="mt-1">
          <div class="flex items-center">
            <select
              class="select select-bordered select-sm border-primary focus:border-primary focus:outline-primary text-primary"
              style="min-width: 200px; text-align: left;"
              value={$currentMealPlan?.id || ''}
              on:change={(e) => setCurrentMealPlan(e.target.value)}
              disabled={$loadingMealPlans}
            >
              <option value="">--Select--</option>
              {#each $mealPlans as plan}
                <option value={plan.id}>Plan: {plan.title}</option>
              {/each}
            </select>
            <button 
              class="btn btn-ghost btn-sm px-2 text-primary hover:bg-primary/10"
              on:click={() => {
                console.log('Edit meal plans button clicked');
                showMealPlanManager = true;
              }}
              title="Edit meal plans"
            >
              <Edit3 class="h-4 w-4 text-primary" />
            </button>
            <a href="/" class="btn btn-ghost btn-sm px-2 ml-auto text-primary" title="Go to Meals page">
              <CookingPot class="h-4 w-4 text-primary" />
              <span class="text-primary">Meals</span>
            </a>
            {#if $loadingMealPlans}
              <div class="loading loading-spinner loading-sm"></div>
            {/if}
          </div>
        </div>
      </div>

      {#if stores.length > 0}
        {#if loadingIngredients || !ingredientsLoaded}
          <!-- Loading state -->
          <div class="flex flex-col items-center justify-center py-12">
            <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p class="text-primary/70">Loading ingredients...</p>
          </div>
        {:else}
          <!-- Ingredients loaded, show the list -->
          <StoreTabs
            {stores}
            {ingredients}
            currentMealPlan={$currentMealPlan}
            on:ingredient-updated={handleIngredientUpdated}
            key={forceUpdate}
          />
        {/if}
      {:else}
        <!-- No stores created yet -->
        <div class="bg-base-100 rounded-lg shadow-md p-6">
          <div class="text-center py-8">
            <Store class="h-16 w-16 mx-auto text-primary/40 mb-4" />
            <h3 class="text-lg font-semibold text-primary mb-2">No Stores Created Yet</h3>
            <p class="text-primary/70 mb-4">
              Create stores to organize your shopping list by location.
            </p>
            <p class="text-sm text-primary/60 mb-6">
              You can create stores like "Grocery Store", "Costco", "Farmers Market", etc.
            </p>
            <a href="/stores" class="btn btn-primary">
              <Store class="h-4 w-4 text-white" />
              Create Your First Store
            </a>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Meal Plan Manager Modal -->
<MealPlanManager
  isOpen={showMealPlanManager}
  onClose={() => {
    console.log('MealPlanManager close event');
    showMealPlanManager = false;
  }}
  on:plan-created={() => {
    console.log('MealPlanManager plan-created event');
    showMealPlanManager = false;
    loadMealPlans();
  }}
  on:plan-updated={() => {
    console.log('MealPlanManager plan-updated event');
    showMealPlanManager = false;
    loadMealPlans();
  }}
  on:plan-deleted={() => {
    console.log('MealPlanManager plan-deleted event');
    showMealPlanManager = false;
    loadMealPlans();
  }}
/>

