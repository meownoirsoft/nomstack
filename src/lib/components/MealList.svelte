<script>
    import Checkbox from '$lib/components/Checkbox.svelte';
    import EditModal from '$lib/components/EditModal.svelte';
    import SocialIcon from '$lib/components/SocialIcon.svelte';
    import RecipeEditor from '$lib/components/RecipeEditor.svelte';
    import RecipeViewer from '$lib/components/RecipeViewer.svelte';
    import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    import { settings } from '$lib/stores/settings.js';
    import { Edit, Check, Plus, ChefHat } from 'lucide-svelte';

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
    
    // Filter state
    let activeFilter = 'All';
    const filters = ['All', 'Lunch', 'Dinner', 'Quick'];
    
    // Recipe-related state
    let showRecipeEditor = false;
    let showRecipeViewer = false;
    let currentMeal = null;
    let currentRecipe = null;

    $: modalCats = Array.isArray(cats) ? cats : [];

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

    function filterMealsByPageAndFilter(list, currentPage, filter) {
      let filtered = filterMealsByPage(list, currentPage);
      
      if (filter === 'All') {
        return filtered;
      }
      
      if (filter === 'Lunch') {
        return filtered.filter((meal) => hasFlag(meal, LUNCH_FLAG));
      }
      
      if (filter === 'Dinner') {
        return filtered.filter((meal) => hasFlag(meal, DINNER_FLAG));
      }
      
      if (filter === 'Quick') {
        return filtered.filter((meal) => {
          // Filter for quick meals (you can adjust this logic based on your data structure)
          return meal.prep_time && meal.prep_time <= 30; // 30 minutes or less
        });
      }
      
      if (filter === 'Healthy') {
        return filtered.filter((meal) => {
          // Filter for healthy meals (you can adjust this logic based on your data structure)
          return meal.notes && meal.notes.toLowerCase().includes('healthy');
        });
      }
      
      return filtered;
    }

    function setFilter(filter) {
      activeFilter = filter;
    }

    $: displayMeals = filterMealsByPageAndFilter(meals, page, activeFilter);

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

    function openModal(meal) {
      mealToEdit = meal ? { ...meal } : null;
      const catIds = parseIds(meal?.cats);
      const flags = Array.isArray(meal?.flags) ? meal.flags : [];
      selectedCats = [...catIds, ...flags];
      showModal = true;
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

      try {
        const result = await api.updateSelections(page, ids);
        
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
    <!-- Filters -->
    <div class="flex items-center justify-center gap-3 flex-wrap py-0 mt-2 mb-1">
      {#each filters as filter}
        <button 
          class="text-sm py-0 m-0 {activeFilter === filter ? 'text-primary-focus underline font-semibold' : 'text-primary hover:text-primary-focus underline-offset-4 hover:underline'}"
          on:click={() => setFilter(filter)}
        >
          {filter}
        </button>
      {/each}
    </div>
    
    <div class="flex items-center gap-3 -ml-2">
      <button class="btn btn-xs sm:btn-sm btn-ghost text-primary font-normal" on:click={clearAll}>
        Clear ✓
      </button>
      <div class="flex-1 flex justify-center">
        <p class="text-xs text-primary/70">checked = meal plan</p>
      </div>
      <button class="text-sm text-primary hover:text-primary-focus underline-offset-4 hover:underline py-0 m-0 flex items-center gap-1" on:click={() => showModal = true}>
        <Plus class="h-4 w-4" />
        <span class="hidden sm:inline">Add meal</span>
        <span class="sm:hidden">New</span>
      </button>
    </div>
    
    <div class="scroller flex-grow overflow-y-auto pr-1 min-h-[15rem]">
      <ul class="space-y-3">
        {#each displayMeals as meal}
          <li class="w-full">
            <div class="flex items-center gap-3 rounded-xl bg-base-100 pl-2 pr-2 py-3 shadow-sm border border-purple-300">
              <Checkbox type="sels" label={meal.name} value={meal.id} {page} bind:selectedItems lblClass="font-medium text-primary" />
              <div class="ml-auto flex items-center gap-1 text-sm text-primary/70">
                <SocialIcon icon={meal.source} />
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
  </main>
