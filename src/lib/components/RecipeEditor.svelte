<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { X, Clock, Users, ChefHat, ChevronDown, ChevronUp, Search, Check, Camera, Crown } from 'lucide-svelte';
  import PhotoImportModal from '$lib/components/PhotoImportModal.svelte';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';
  import { hasFeatureAccess } from '$lib/stores/userTier.js';
  import { goto } from '$app/navigation';

  export let mealId = null; // Optional - if null, user can select a meal
  export let mealName = '';
  export let recipe = null; // Existing recipe data

  const dispatch = createEventDispatcher();

  let title = '';
  let ingredients = '';
  let instructions = '';
  let prepTime = 0;
  let cookTime = 0;
  let servings = 1;
  let notes = '';
  let loading = false;
  
  // Import state
  let showManualEdit = false;
  let photoImportModal;
  
  // Upgrade modal state
  let showUpgradeModal = false;
  
  // Meal selection state (when mealId is not provided)
  let allMeals = [];
  let filteredMeals = [];
  let searchTerm = '';
  let selectedMealId = null;
  let loadingMeals = false;

  // Initialize form with existing recipe data
  $: if (recipe) {
    title = recipe.title || '';
    ingredients = recipe.ingredients || '';
    instructions = recipe.instructions || '';
    prepTime = recipe.prep_time || 0;
    cookTime = recipe.cook_time || 0;
    servings = recipe.servings || 1;
    notes = recipe.notes || '';
    // If editing existing recipe, show manual edit section
    showManualEdit = true;
  }

  // Load meals when component mounts and no mealId is provided
  $: if (!mealId && allMeals.length === 0) {
    loadMeals();
  }

  // Filter meals based on search term
  $: {
    if (searchTerm.trim()) {
      filteredMeals = allMeals.filter(meal =>
        meal.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      filteredMeals = allMeals;
    }
  }

  // When the user picks an existing meal — explicitly via the dropdown or
  // implicitly via a name match in "Create new" mode — check whether that
  // meal already has a recipe. If it does, surface an inline notice so the
  // save action becomes "Replace recipe" instead of erroring out.
  let existingRecipeForTarget = null;
  $: targetMealId = mealId || (selectedMealId && selectedMealId !== 'new' ? selectedMealId : null);
  $: titleMatchedMeal = !mealId && selectedMealId === 'new' && title.trim()
    ? allMeals.find((m) => m.name && m.name.trim().toLowerCase() === title.trim().toLowerCase())
    : null;
  $: effectiveExistingMealId = targetMealId || titleMatchedMeal?.id || null;

  $: if (effectiveExistingMealId && !recipe) {
    checkExistingRecipeFor(effectiveExistingMealId);
  } else {
    existingRecipeForTarget = null;
  }

  async function checkExistingRecipeFor(id) {
    try {
      const result = await api.getRecipe(id);
      existingRecipeForTarget = result?.recipe || null;
    } catch {
      existingRecipeForTarget = null;
    }
  }

  // Meal loading and selection functions
  async function loadMeals() {
    loadingMeals = true;
    try {
      const result = await api.getMeals('all');
      allMeals = result || [];
      filteredMeals = allMeals;
    } catch (error) {
      console.error('Error loading meals:', error);
      notifyError('Failed to load meals');
    } finally {
      loadingMeals = false;
    }
  }

  function selectMeal(mealId) {
    selectedMealId = mealId;
  }

  async function saveRecipe() {
    if (!ingredients.trim() && !instructions.trim()) {
      notifyError('Please add at least ingredients or instructions');
      return;
    }

    // If no mealId is provided, require meal selection
    if (!mealId && !selectedMealId) {
      notifyError('Please select a meal for this recipe');
      return;
    }

    loading = true;
    try {
      const recipeData = {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        prep_time: prepTime,
        cook_time: cookTime,
        servings: servings,
        notes: notes.trim()
      };

      let result;
      if (recipe) {
        // Update the recipe we were explicitly opened to edit.
        result = await api.updateRecipe(recipe.id, recipeData);
      } else if (existingRecipeForTarget?.id) {
        // The target meal (explicit or matched-by-name) already has a recipe.
        // Treat save-with-an-overwrite-banner-shown as an intentional update.
        result = await api.updateRecipe(existingRecipeForTarget.id, recipeData);
        notifySuccess('Replaced existing recipe.');
      } else {
        // Create new recipe path. Resolve target meal: explicit selection,
        // name-matched existing meal, or a brand-new meal.
        let targetMealIdLocal = mealId || selectedMealId;

        if (selectedMealId === 'new') {
          const normalized = title.trim().toLowerCase();
          const matches = allMeals.filter(
            (m) => m.name && m.name.trim().toLowerCase() === normalized
          );

          if (matches.length > 1) {
            // Ambiguous — refuse to guess.
            loading = false;
            notifyError(
              `${matches.length} meals are named "${title.trim()}". Pick the one you want from the meal selector above instead of "Create new".`
            );
            return;
          }

          if (matches.length === 1) {
            targetMealIdLocal = matches[0].id;
            notifySuccess(`Adding recipe to existing meal "${matches[0].name}"`);
          } else {
            const mealData = {
              name: title.trim(),
              source: '',
              cats: [],
              notes: ''
            };
            const mealResult = await api.addMeal(mealData);
            if (mealResult.success) {
              targetMealIdLocal = mealResult.data.id;
            } else {
              throw new Error(mealResult.error || 'Failed to create meal');
            }
          }
        }

        result = await api.addRecipe(targetMealIdLocal, recipeData);
      }

      if (result.success) {
        // Success: emit to parent; avoid duplicate success toast here
        dispatch('saved', { recipe: result.recipe });
        dispatch('close');
      } else {
        throw new Error(result.error || 'Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      notifyError(error.message || 'Failed to save recipe');
    } finally {
      loading = false;
    }
  }

  function toggleManualEdit() {
    showManualEdit = !showManualEdit;
  }

  function handlePhotoImportClick() {
    if (hasFeatureAccess('photoImport')) {
      photoImportModal.open();
    } else {
      // Show upgrade modal
      showUpgradeModal = true;
    }
  }

  function handlePhotoImports(event) {
    const { imports, importMode, selectedMealId: importedMealId } = event.detail || {};
    if (!imports || imports.length === 0) return;
    const { recipe: parsed, file } = imports[0];
    title = parsed.title || title;
    ingredients = parsed.ingredients || ingredients;
    instructions = parsed.instructions || instructions;
    prepTime = parsed.prepTime || prepTime;
    cookTime = parsed.cookTime || cookTime;
    servings = parsed.servings || servings;
    notes = parsed.notes || notes;
    showManualEdit = true;
    
    // Handle meal assignment based on import mode
    if (importMode === 'existing' && importedMealId) {
      selectedMealId = importedMealId;
    } else if (importMode === 'new') {
      // For new meals, we'll need to create the meal when saving
      selectedMealId = 'new';
    }
    
    notifySuccess('Photo parsed. Review and edit as needed.');
  }

  function cancel() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6">
  <div class="relative mt-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-base-200 px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-bold text-primary">Recipe Import</h3>
        {#if recipe}
          <p class="text-sm text-gray-600 mt-1">for {mealName}</p>
        {/if}
      </div>
      <button 
        class="btn btn-ghost btn-sm p-1 -mt-2 -mr-2"
        on:click={cancel}
        disabled={loading}
      >
        <X class="h-5 w-5" />
      </button>
    </div>

  <!-- Import Button -->
  <div class="mt-2">
    <button 
      class="btn btn-primary w-full"
      on:click={handlePhotoImportClick}
      type="button"
    >
      <Camera class="h-5 w-5 mr-2" />
      Import from Photo
      {#if !hasFeatureAccess('photoImport')}
        <span class="ml-2 text-xs bg-white/20 px-2 py-1 rounded">Plus Only</span>
      {/if}
    </button>
  </div>

  <!-- Embedded Photo Import Modal -->
  <PhotoImportModal 
    bind:this={photoImportModal}
    on:recipes-imported={handlePhotoImports}
  />

    <!-- Manual Edit Accordion -->
    <div class="mt-4">
      <button
        class="w-full flex items-center justify-between p-3 text-sm hover:bg-primary/5 rounded-lg transition-colors border border-primary/20"
        style="background-color: {showManualEdit ? 'var(--primary)' : 'transparent'};"
        on:click={toggleManualEdit}
      >
        <div class="flex items-center gap-2">
          <ChefHat class="h-4 w-4 {showManualEdit ? 'text-white' : 'text-primary'}" />
          <span class="font-medium {showManualEdit ? 'text-white' : 'text-primary'}">{recipe ? 'Manual Edit' : 'Manual Entry'}</span>
        </div>
        {#if showManualEdit}
          <ChevronUp class="h-4 w-4 text-white" />
        {:else}
          <ChevronDown class="h-4 w-4 text-primary" />
        {/if}
      </button>

      {#if showManualEdit}
        <div class="mt-3 space-y-3">
          <!-- Recipe Title -->
          <div>
            <label class="label">
              <span class="label-text font-medium">Recipe Title</span>
            </label>
            <input 
              type="text" 
              class="input input-bordered w-full" 
              bind:value={title}
              placeholder="Enter recipe title"
            />
          </div>

          <!-- Meal Selection (only show when no mealId is provided) -->
          {#if !mealId}
            <div>
              <label class="label">
                <span class="label-text font-medium">Assign to Meal</span>
              </label>
              
              <!-- Search input -->
              <div class="relative mb-2">
                <input
                  type="text"
                  placeholder="Search meals..."
                  bind:value={searchTerm}
                  class="input input-bordered w-full pl-8"
                />
                <Search class="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <!-- Meal list -->
              <div class="max-h-32 overflow-y-auto border rounded-lg">
                {#if loadingMeals}
                  <div class="p-3 text-center text-sm text-gray-500">
                    Loading meals...
                  </div>
                {:else if filteredMeals.length === 0}
                  <div class="p-3 text-center text-sm text-gray-500">
                    {searchTerm ? 'No meals found' : 'No meals available'}
                  </div>
                {:else}
                  {#each filteredMeals as meal}
                    <button
                      class="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2 {selectedMealId === meal.id ? 'bg-primary/10' : ''}"
                      on:click={() => selectMeal(meal.id)}
                    >
                      <ChefHat class="h-4 w-4 text-gray-400" />
                      <span class="text-sm {selectedMealId === meal.id ? 'font-medium text-primary' : 'text-gray-700'}">
                        {meal.name}
                      </span>
                      {#if selectedMealId === meal.id}
                        <Check class="h-4 w-4 text-primary ml-auto" />
                      {/if}
                    </button>
                  {/each}
                {/if}
              </div>
              
              <!-- Create New Meal Option -->
              <div class="mt-2">
                <button
                  class="w-full text-left p-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 {selectedMealId === 'new' ? 'bg-primary/10 border-primary' : ''}"
                  on:click={() => selectMeal('new')}
                >
                  <ChefHat class="h-4 w-4 text-gray-400" />
                  <span class="text-sm {selectedMealId === 'new' ? 'font-medium text-primary' : 'text-gray-700'}">
                    + Create new meal
                  </span>
                  {#if selectedMealId === 'new'}
                    <Check class="h-4 w-4 text-primary ml-auto" />
                  {/if}
                </button>
              </div>
              
            </div>
          {/if}

          <!-- Quick Info Row -->
          <div class="grid grid-cols-3 gap-4">
            <!-- Prep Time -->
            <div>
              <label class="label">
                <span class="label-text font-medium flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  Prep&nbsp;(min)
                </span>
              </label>
              <input 
                type="number" 
                class="input input-bordered w-full" 
                bind:value={prepTime}
                min="0"
                max="999"
                placeholder="30"
              />
            </div>

            <!-- Cook Time -->
            <div>
              <label class="label">
                <span class="label-text font-medium flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  Cook&nbsp;(min)
                </span>
              </label>
              <input 
                type="number" 
                class="input input-bordered w-full" 
                bind:value={cookTime}
                min="0"
                max="999"
                placeholder="45"
              />
            </div>

            <!-- Servings -->
            <div>
              <label class="label">
                <span class="label-text font-medium flex items-center gap-2">
                  <Users class="h-4 w-4" />
                  Servings
                </span>
              </label>
              <input 
                type="number" 
                class="input input-bordered w-full" 
                bind:value={servings}
                min="1"
                max="20"
                placeholder="4"
              />
            </div>
          </div>

          <!-- Ingredients -->
          <div class="-mb-2">
            <label class="label">
              <span class="label-text font-medium flex items-center gap-2">
                <ChefHat class="h-4 w-4" />
                Ingredients
              </span>
            </label>
            <textarea 
              class="textarea textarea-bordered w-full h-32 resize-none" 
              bind:value={ingredients}
              placeholder="* 2 cups flour&#10;* 1 cup sugar&#10;* 3 eggs&#10;* 1/2 cup butter"
            ></textarea>
            <div class="label py-0">
              <span class="label-text-alt text-gray-500">One ingredient per line, use * or - for bullets</span>
            </div>
          </div>

          <!-- Instructions -->
          <div>
            <label class="label">
              <span class="label-text font-medium">Instructions</span>
            </label>
            <textarea 
              class="textarea textarea-bordered w-full h-40 resize-none" 
              bind:value={instructions}
              placeholder="1. Mix dry ingredients in a bowl&#10;2. Beat eggs and butter together&#10;3. Combine wet and dry ingredients&#10;4. Bake at 350°F for 25 minutes"
            ></textarea>
            <div class="label py-0">
              <span class="label-text-alt text-gray-500">Number your steps for easy following</span>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="label">
              <span class="label-text font-medium">Notes</span>
            </label>
            <textarea 
              class="textarea textarea-bordered w-full h-24 resize-none" 
              bind:value={notes}
              placeholder="Any additional notes, tips, variations, or serving suggestions..."
            ></textarea>
            <div class="label py-0 -mb-2">
              <span class="label-text-alt text-gray-500">Optional: cooking tips, variations, or serving suggestions</span>
            </div>
          </div>
        </div>

        {#if !recipe}
          {#if existingRecipeForTarget}
            <!-- Inline overwrite warning -->
            <div class="mt-4 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
              <span class="font-semibold">Heads up:</span>
              {#if titleMatchedMeal}
                "{titleMatchedMeal.name}" already has a recipe.
              {:else}
                This meal already has a recipe.
              {/if}
              Saving will <strong>replace</strong> the existing recipe with this one.
            </div>
          {/if}
          <!-- Add/Replace Recipe button -->
          <div class="flex gap-3 mt-6 pt-4 border-t border-base-200">
            <button
              class="btn btn-ghost text-primary underline flex-1 py-2"
              on:click={cancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              class="btn flex-1 py-2"
              style="background-color: #e9d5ff; border-color: #e9d5ff; color: #7c3aed;"
              on:click={saveRecipe}
              disabled={loading || (!ingredients.trim() && !instructions.trim())}
            >
              {#if loading}
                <span class="loading loading-spinner loading-sm"></span>
                Saving...
              {:else if existingRecipeForTarget}
                Replace Recipe
              {:else}
                Add Recipe
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </div>

    {#if recipe}
      <!-- Actions (only for editing existing recipes) -->
      <div class="flex gap-3 mt-6 pt-4 border-t border-base-200">
        <button 
          class="btn btn-ghost text-primary underline flex-1 py-2" 
          on:click={cancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          class="btn flex-1 py-2"
          style="background-color: #e9d5ff; border-color: #e9d5ff; color: #7c3aed;"
          on:click={saveRecipe}
          disabled={loading || (!ingredients.trim() && !instructions.trim())}
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Saving...
          {:else}
            Update Recipe
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- Upgrade Modal -->
  <UpgradeModal 
    bind:isOpen={showUpgradeModal}
    triggerSource="photo-import"
    on:close={() => showUpgradeModal = false}
  />
</div>
