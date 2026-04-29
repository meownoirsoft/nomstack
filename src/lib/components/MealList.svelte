<script>
    import Checkbox from '$lib/components/Checkbox.svelte';
    import EditModal from '$lib/components/EditModal.svelte';
    import SocialIcon from '$lib/components/SocialIcon.svelte';
    import RecipeEditor from '$lib/components/RecipeEditor.svelte';
    import RecipeViewer from '$lib/components/RecipeViewer.svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    import { settings } from '$lib/stores/settings.js';
    import { currentMealPlan, mealPlans, loadingMealPlans, loadMealPlans, setCurrentMealPlan } from '$lib/stores/mealPlan.js';
    import { mealFilters } from '$lib/stores/mealFilters.js';
    import { userTier, TIER_TYPES, getLimit, needsUpgradeForLimit } from '$lib/stores/userTier.js';
    import { Edit, Check, Plus, ChefHat, Printer, Calendar, Edit3 } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import MealPlanManager from '$lib/components/MealPlanManager.svelte';
    import Search from '$lib/components/Search.svelte';
    import UpgradeModal from '$lib/components/UpgradeModal.svelte';
    import { goto } from '$app/navigation';

    const BREAKFAST_FLAG = 'breakfast';
    const LUNCH_FLAG = 'lunch';
    const DINNER_FLAG = 'dinner';

    export let meals = [];
    export let sels = [];
    export let cats = [];
    export let srcs = [];
    export let page;

    let selectedItems = parseIds(sels);
    let selectedCats = [];
    let showModal = false;
    let mealToEdit = null;
    let modalCats = Array.isArray(cats) ? cats : [];
    let lastSelsSnapshot = Array.isArray(sels) ? sels.join(',') : String(sels ?? '');
    let displayMeals = [];
    let mealsWithRecipes = new Set();
  let mealsWithRecipesArray = []; // Set of mealIds that have recipes
    
    
    // Filter state - now handled by parent component
    
    // Recipe-related state
    let showRecipeEditor = false;
    let showRecipeViewer = false;
    let currentMeal = null;
    let currentRecipe = null;
    
    // Meal plan manager state
    let showMealPlanManager = false;
    
    // Upgrade modal state
    let showUpgradeModal = false;
    let showMealPlanUpgradeModal = false;
    let upgradeTriggerSource = '';
    
    // Filter state
    let selectedFilter = 'all';
    

    $: modalCats = Array.isArray(cats) ? cats : [];

    onMount(async () => {
      await loadMealPlans();
    });

    // Load selections when meal plan changes (this is needed for meal plan switching to work)
    $: if ($currentMealPlan) {
      loadSelectionsForPlan();
    } else {
      selectedItems = [];
    }

    async function loadSelectionsForPlan() {
      if (!$currentMealPlan) return;
      
      try {
        const result = await api.getSelections(page, $currentMealPlan.id);
        
        if (result && Array.isArray(result)) {
          if (result.length > 0) {
            const meals = result[0].meals;
            selectedItems = parseIds(meals);
          } else {
            // No selections for this plan yet
            selectedItems = [];
          }
        } else {
          selectedItems = [];
        }
      } catch (error) {
        console.error('Error loading selections for plan:', error);
        selectedItems = [];
      }
    }

    $: {
      const signature = Array.isArray(sels) ? sels.join(',') : String(sels ?? '');
      if (signature !== lastSelsSnapshot) {
        selectedItems = parseIds(sels);
        lastSelsSnapshot = signature;
      }
    }

    function toIdList(items) {
      if (!Array.isArray(items)) {
        return [];
      }
      return items
        .map((item) => (typeof item === 'object' ? item?.id : item))
        .map((value) => (value == null ? '' : String(value).trim()))
        .filter((value) => value.length > 0);
    }

    function filterMealsByPage(list, currentPage) {
      if (!Array.isArray(list)) {
        return [];
      }
      if (currentPage === 'lunch') {
        return list.filter((meal) => hasFlag(meal, LUNCH_FLAG));
      }
      if (currentPage === 'dinner') {
        return list.filter((meal) => hasFlag(meal, DINNER_FLAG));
      }
      return list;
    }


  $: {
    // Filter meals based on selected filter
    if (selectedFilter === 'all') {
      displayMeals = meals;
    } else {
      // Find the selected filter
      const filter = $mealFilters.find(f => f.id === selectedFilter);
      
      if (filter) {
        if (filter.category_id) {
          // Handle category filters by checking if the meal's categories include this category_id
          displayMeals = meals.filter(meal => {
            // meal.cats is an array of category IDs
            return Array.isArray(meal.cats) && meal.cats.includes(filter.category_id);
          });
        } else if (filter.flag) {
          // Handle flag filters (lunch, dinner) by checking if the meal has this flag
          displayMeals = meals.filter(meal => {
            return Array.isArray(meal.flags) && meal.flags.includes(filter.flag);
          });
        } else {
          displayMeals = meals;
        }
      } else {
        displayMeals = meals;
      }
    }
  }

  // Check for recipes when meals change
  $: if (meals && meals.length > 0) {
    checkRecipesForMeals();
  }
  
  // Make mealsWithRecipes reactive to changes
  $: mealsWithRecipesArray = Array.from(mealsWithRecipes);
  
  // Create a reactive map of meal IDs to recipe status
  $: mealRecipeMap = new Map(mealsWithRecipesArray.map(id => [id, true]));
  
  // Create a reactive object that tracks which meals have recipes
  $: mealsWithRecipesObj = Object.fromEntries(mealsWithRecipesArray.map(id => [id, true]));

    function parseIds(value) {
      if (!value) {
        return [];
      }
      if (Array.isArray(value)) {
        return toIdList(value);
      }
      return String(value)
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }

    function hasFlag(meal, flag) {
      return Array.isArray(meal?.flags) && meal.flags.includes(flag);
    }

    function hasRecipe(meal) {
      return mealRecipeMap.has(meal.id);
    }


    async function checkRecipesForMeals() {
      if (!meals || meals.length === 0) return;
      
      const recipePromises = meals.map(async (meal) => {
        try {
          const result = await api.getRecipe(meal.id);
          if (result && result.recipe) {
            mealsWithRecipes.add(meal.id);
          }
        } catch (error) {
          // Recipe doesn't exist for this meal, that's fine
        }
      });
      
      await Promise.all(recipePromises);
      // Trigger reactivity by creating a new Set
      mealsWithRecipes = new Set(mealsWithRecipes);
    }

    function openModal(meal) {
      mealToEdit = meal ? { ...meal } : null;
      const catIds = parseIds(meal?.cats);
      const flags = Array.isArray(meal?.flags) ? meal.flags : [];
      selectedCats = [...catIds, ...flags];
      showModal = true;
    }

    function handleAddMealClick() {
      // Check if user needs to upgrade for more meals
      if (needsUpgradeForLimit('maxRecipes', displayMeals.length)) {
        upgradeTriggerSource = 'meal-limit';
        showUpgradeModal = true;
      } else {
        showModal = true;
      }
    }

    function handleModalClose() {
      showModal = false;
      mealToEdit = null;
      selectedCats = [];
    }

    function clearAll(){
      const previous = selectedItems;
      selectedItems = [];
      updateSelections(selectedItems, previous);
    }

    async function updateSelections(items, previousItems = selectedItems, { successMessage } = {}) {
      const ids = toIdList(items);
      const planId = $currentMealPlan?.id || null;

      try {
        const result = await api.updateSelections(page, ids, planId);
        
        if (result.success) {
          selectedItems = ids;
          if (successMessage) {
            notifySuccess(successMessage);
          }
        } else {
          throw new Error(result.error || 'Failed to update selections');
        }
      } catch (error) {
        console.error('Error updating selections:', error);
        selectedItems = previousItems;
        notifyError(error.message || 'Unable to save selections. Please try again.');
      }
    }

    function handleMealSave(event) {
      const updatedMeal = event.detail?.meal;
      if (!updatedMeal) {
        return;
      }

      // Check if this is a new meal (no ID in the original meals array)
      const existingMealIndex = meals.findIndex(meal => meal.id === updatedMeal.id);
      
      if (existingMealIndex >= 0) {
        // Update existing meal
        meals = meals.map((meal) =>
          meal.id === updatedMeal.id ? { ...meal, ...updatedMeal } : meal
        );
      } else {
        // Add new meal to the beginning of the array
        meals = [updatedMeal, ...meals];
      }
    }

    async function handleMealDelete(event) {
      const mealId = event.detail?.id;
      if (!mealId) {
        return;
      }

      meals = meals.filter((meal) => meal.id !== mealId);
      const previous = selectedItems;
      selectedItems = selectedItems.filter((id) => id !== mealId);
      await updateSelections(selectedItems, previous, { successMessage: 'Meal removed from selection.' });
    }

    // Recipe functions
    async function openRecipeViewer(meal) {
      currentMeal = meal;
      try {
        const result = await api.getRecipe(meal.id);
        currentRecipe = result.recipe;
        showRecipeViewer = true;
      } catch (error) {
        console.error('Error loading recipe:', error);
        notifyError('Failed to load recipe');
      }
    }

    async function openRecipeEditor(meal, recipe = null) {
      currentMeal = meal;
      currentRecipe = recipe;
      showRecipeEditor = true;
    }

    function closeRecipeEditor() {
      showRecipeEditor = false;
      currentMeal = null;
      currentRecipe = null;
    }

    function closeRecipeViewer() {
      showRecipeViewer = false;
      currentMeal = null;
      currentRecipe = null;
    }

    function handleRecipeSaved(event) {
      currentRecipe = event.detail.recipe;
      closeRecipeEditor();
      notifySuccess('Recipe saved!');
    }

    function handleRecipeDeleted(event) {
      currentRecipe = null;
      closeRecipeViewer();
      notifySuccess('Recipe deleted');
    }

    function handleEditRecipe() {
      showRecipeViewer = false;
      openRecipeEditor(currentMeal, currentRecipe);
    }
  </script>
    
  <main class="flex flex-col min-h-auto gap-2">
    <!-- Title and Meal Plan Selector -->
    <div class="flex items-center justify-between mt-2 mb-1">
      <div class="flex items-center gap-2 pl-4">
        <label for="meal-plan-select" class="text-sm font-medium text-primary">Plan:</label>
        <select 
          id="meal-plan-select"
          class="select select-bordered select-sm border-primary focus:border-primary focus:outline-primary text-primary"
          style="min-width: 250px; text-align: left;"
          value={$currentMealPlan?.id || ''}
          on:change={(e) => setCurrentMealPlan(e.target.value)}
          disabled={$loadingMealPlans}
        >
          <option value="">--Select--</option>
          {#each $mealPlans as plan}
            <option value={plan.id}>{plan.title}</option>
          {/each}
        </select>
      </div>
      <div class="flex items-center gap-1">
        <button 
          class="btn btn-ghost btn-sm px-2 text-primary hover:bg-primary/10"
          on:click={() => showMealPlanManager = true}
          title="Manage meal plans"
        >
          <Edit3 class="h-4 w-4 text-primary" />
        </button>
        <a 
          href="/meal-plan-print" 
          class="btn btn-ghost btn-sm px-2 text-primary hover:bg-primary/10"
          class:opacity-50={!$currentMealPlan}
          class:pointer-events-none={!$currentMealPlan}
          title={$currentMealPlan ? "Print meal plan" : "Select a meal plan to print"}
        >
          <Printer class="h-4 w-4 text-primary" />
        </a>
        {#if $loadingMealPlans}
          <div class="loading loading-spinner loading-sm"></div>
        {/if}
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mt-2 mb-1 px-4">
      <Search />
    </div>
    
    <!-- Meal Filter Tabs -->
    {#if $mealFilters.length > 0}
      <div class="mb-2 px-4">
        <div class="flex flex-wrap gap-2">
          {#each $mealFilters as filter}
            <button
              class="text-sm py-0 m-0 underline underline-offset-2 {selectedFilter === filter.id ? 'text-primary font-bold' : 'text-primary hover:text-primary-focus'}"
              on:click={() => selectedFilter = filter.id}
            >
              {filter.name}
            </button>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Action row pinned above the scroller so its buttons don't overlap the
         first meal card's edit/checkbox click targets. -->
    <div class="flex items-center justify-between px-2 pb-2">
      <button class="text-sm text-primary hover:text-primary-focus underline-offset-4 hover:underline py-0 m-0 flex items-center gap-1" on:click={clearAll}>
        Clear
        <Check class="h-4 w-4" />
      </button>
      <button class="text-sm text-primary hover:text-primary-focus underline-offset-4 hover:underline py-0 m-0 flex items-center gap-1" on:click={handleAddMealClick}>
        <Plus class="h-4 w-4" />
        <span>Meal</span>
      </button>
    </div>

    <div class="scroller flex-grow overflow-y-auto px-0 min-h-[15rem]">
      <ul class="space-y-1">
        {#each displayMeals as meal}
          <li class="w-full">
            <div class="flex items-center gap-3 rounded-xl bg-white pl-3 pr-1 py-3 shadow-sm border border-primary/30">
              {#if $currentMealPlan}
                <Checkbox type="sels" label={meal.name} value={meal.id} {page} bind:selectedItems lblClass="font-medium text-primary" />
              {:else}
                <div class="w-4 h-4"></div>
                <span class="font-medium text-primary">{meal.name}</span>
              {/if}
              <div class="ml-auto flex items-center gap-1 text-sm text-primary/70">
                {#if mealsWithRecipesObj[meal.id]}
                  <ChefHat class="h-4 w-4 text-primary/60" title="Has recipe" />
                {/if}
                <span
                  class="w-3 text-center font-semibold"
                  class:opacity-0={!hasFlag(meal, LUNCH_FLAG)}
                >L</span>
                <span
                  class="w-3 text-center font-semibold"
                  class:opacity-0={!hasFlag(meal, DINNER_FLAG)}
                >D</span>
                <button
                  class="text-primary hover:text-primary-focus focus:outline-none p-0 h-6 w-6 flex items-center justify-center"
                  on:click={() => openModal(meal)}
                  title="Edit meal"
                >
                  <Edit class="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
      
      <!-- Meals Count Display -->
      <div class="mt-4 px-4 py-2 bg-white rounded-lg border border-primary/20">
        <div class="flex items-center justify-between text-sm">
          <span class="text-primary/70">
            Meals: <span class="font-medium text-primary">{displayMeals.length}</span>
          </span>
          {#if $userTier === TIER_TYPES.FREE}
            {@const maxMeals = getLimit('maxRecipes')}
            {@const remaining = Math.max(0, maxMeals - displayMeals.length)}
            <span class="text-primary/70">
              Remaining: <span class="font-medium text-primary">{remaining}</span>
            </span>
          {:else}
            <span class="text-primary/70">
              <span class="text-green-600 font-medium">Unlimited</span>
            </span>
          {/if}
        </div>
      </div>
    </div>
    {#if showModal}
      <EditModal
        {showModal}
        meal={mealToEdit}
        {selectedCats}
        cats={modalCats}
        {srcs}
        on:close={handleModalClose}
        on:save={handleMealSave}
        on:delete={handleMealDelete}
      />
    {/if}

    <!-- Recipe Components -->
    {#if showRecipeEditor && currentMeal}
      <RecipeEditor
        mealId={currentMeal.id}
        mealName={currentMeal.name}
        recipe={currentRecipe}
        on:close={closeRecipeEditor}
        on:saved={handleRecipeSaved}
      />
    {/if}

    {#if showRecipeViewer && currentMeal}
      <RecipeViewer
        mealId={currentMeal.id}
        mealName={currentMeal.name}
        recipe={currentRecipe}
        on:close={closeRecipeViewer}
        on:edit={handleEditRecipe}
        on:deleted={handleRecipeDeleted}
      />
    {/if}

    <!-- Meal Plan Manager Modal -->
    <MealPlanManager 
      bind:isOpen={showMealPlanManager}
      onClose={() => showMealPlanManager = false}
      bind:showUpgradeModal={showMealPlanUpgradeModal}
    />

    <!-- Upgrade Modal -->
    <UpgradeModal 
      bind:isOpen={showUpgradeModal}
      triggerSource={upgradeTriggerSource}
      on:close={() => showUpgradeModal = false}
    />

    <!-- Meal Plan Upgrade Modal -->
    <UpgradeModal 
      bind:isOpen={showMealPlanUpgradeModal}
      triggerSource="meal-plan-limit"
    />
  </main>
