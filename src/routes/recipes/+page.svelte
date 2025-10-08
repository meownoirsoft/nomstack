<script>
  import { api } from '$lib/api.js';
  import { onMount } from 'svelte';
  import { searchTerm } from '$lib/stores/search.js';
  import { ChefHat, Clock, Users, Eye, Edit, Plus, Upload } from 'lucide-svelte';
  import RecipeViewer from '$lib/components/RecipeViewer.svelte';
  import RecipeEditor from '$lib/components/RecipeEditor.svelte';
  import PhotoImportModal from '$lib/components/PhotoImportModal.svelte';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { findDuplicateRecipe, mergeRecipes, hasMeaningfulChanges } from '$lib/helpers/recipeComparison.js';

  export let data;

  let allMeals = [];
  let mealsWithRecipes = [];
  let loading = true;
  let error = null;
  let currentMeal = null;
  let currentRecipe = null;
  let showRecipeViewer = false;
  let showRecipeEditor = false;
  let photoImportModal;

  // Reactive search filtering
  $: {
    if (allMeals.length > 0) {
      try {
        mealsWithRecipes = filterMealsWithRecipes(allMeals, $searchTerm);
      } catch (err) {
        console.error('Error filtering meals:', err);
        mealsWithRecipes = allMeals; // Fallback to showing all meals
      }
    }
  }

  onMount(async () => {
    await loadMealsWithRecipes();
  });

  async function loadMealsWithRecipes() {
    try {
      loading = true;
      error = null;
      
      // Get all meals
      allMeals = await api.getMeals('all');
      
      // Filter meals that have recipes
      const mealsWithRecipesData = [];
      for (const meal of allMeals) {
        try {
          const result = await api.getRecipe(meal.id);
          if (result.recipe) {
            mealsWithRecipesData.push({
              ...meal,
              recipe: result.recipe
            });
          }
        } catch (err) {
          // Recipe doesn't exist for this meal, skip it
          continue;
        }
      }
      
      allMeals = mealsWithRecipesData;
    } catch (err) {
      console.error('Error loading meals with recipes:', err);
      error = err.message || 'Unable to load recipes. Please try again.';
    } finally {
      loading = false;
    }
  }

  function filterMealsWithRecipes(mealsList, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return mealsList;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return mealsList.filter(meal => 
      meal.name.toLowerCase().includes(term) ||
      (meal.recipe && (
        meal.recipe.title?.toLowerCase().includes(term) ||
        meal.recipe.ingredients?.toLowerCase().includes(term) ||
        meal.recipe.instructions?.toLowerCase().includes(term)
      ))
    );
  }

  function formatPrepTime(minutes) {
    if (!minutes || minutes === 0) return 'No prep time';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  function formatTotalTime(prepTime, cookTime) {
    const total = (prepTime || 0) + (cookTime || 0);
    if (total === 0) return 'No time specified';
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
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
    // Reload the data to get updated recipe info (including new recipes)
    loadMealsWithRecipes();
  }

  function handleRecipeDeleted(event) {
    currentRecipe = null;
    closeRecipeViewer();
    notifySuccess('Recipe deleted');
    // Reload the data to remove the meal from the list
    loadMealsWithRecipes();
  }

  function handleEditRecipe() {
    showRecipeViewer = false;
    openRecipeEditor(currentMeal, currentRecipe);
  }

  // New recipe functions
  function openNewRecipeEditor() {
    currentMeal = null; // No existing meal for new recipe
    currentRecipe = null; // No existing recipe
    showRecipeEditor = true;
  }

  function handleBulkImport() {
    photoImportModal.open();
  }

  async function handleRecipesImported(event) {
    const { imports } = event.detail;
    
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    
    for (const { recipe, file } of imports) {
      try {
        const result = await processSingleRecipeImport(recipe, file);
        if (result.type === 'updated') {
          updateCount++;
        } else if (result.type === 'created') {
          successCount++;
        }
      } catch (error) {
        console.error('Error importing recipe:', error);
        errorCount++;
      }
    }
    
    // Show a single summary notification
    if (errorCount > 0) {
      notifyError(`Import completed with ${errorCount} errors. ${successCount} new recipes, ${updateCount} updated.`);
    } else if (updateCount > 0 && successCount > 0) {
      notifySuccess(`Import completed! ${successCount} new recipes, ${updateCount} updated.`);
    } else if (updateCount > 0) {
      notifySuccess(`Import completed! ${updateCount} recipes updated.`);
    } else if (successCount > 0) {
      notifySuccess(`Import completed! ${successCount} new recipes added.`);
    }
    
    // Note: loadMealsWithRecipes() is now called before each import in processSingleRecipeImport
  }

  async function processSingleRecipeImport(recipe, file) {
    // Refresh the meals list to ensure we have the latest data for duplicate detection
    await loadMealsWithRecipes();
    
    // Check if this recipe already exists
    // Extract just the recipe data for comparison
    const existingRecipes = mealsWithRecipes.map(meal => ({
      ...meal.recipe,
      mealName: meal.name // Include meal name for title comparison
    }));
    
    console.log('Checking for duplicates...');
    console.log('New recipe title:', recipe.title);
    console.log('Existing recipes:', existingRecipes.map(r => r.title || r.mealName));
    
    const duplicateMatch = findDuplicateRecipe(existingRecipes, recipe);
    console.log('Duplicate match result:', duplicateMatch);
    
    if (duplicateMatch && duplicateMatch.confidence > 0.7) {
      // Recipe already exists - merge the data
      const existingRecipe = duplicateMatch.recipe;
      console.log('Existing recipe ingredients:', existingRecipe.ingredients);
      console.log('New recipe ingredients:', recipe.ingredients);
      
      const mergedRecipe = mergeRecipes(existingRecipe, recipe);
      console.log('Merged recipe ingredients:', mergedRecipe.ingredients);
      
      // Check if there are meaningful changes
      const hasChanges = hasMeaningfulChanges(existingRecipe, mergedRecipe);
      console.log('Has meaningful changes:', hasChanges);
      
      if (hasChanges) {
        // Update the existing recipe with merged data
        const updateData = {
          title: mergedRecipe.title,
          ingredients: mergedRecipe.ingredients,
          instructions: mergedRecipe.instructions,
          prep_time: mergedRecipe.prep_time,
          cook_time: mergedRecipe.cook_time,
          servings: mergedRecipe.servings,
          notes: mergedRecipe.notes
        };
        
        const updateResult = await api.updateRecipe(existingRecipe.id, updateData);
        
        if (updateResult.success) {
          return { type: 'updated', recipe: recipe.title };
        } else {
          throw new Error(updateResult.error || 'Failed to update recipe');
        }
      } else {
        return { type: 'no-change', recipe: recipe.title };
      }
    } else {
      // New recipe - create it
      const mealData = {
        name: recipe.title || `Recipe from ${file.name}`,
        source: 'Photo Import',
        cats: [], // No categories initially
        notes: `Imported from photo: ${file.name}`
      };
      
      const mealResult = await api.addMeal(mealData);
      
      if (mealResult.success) {
        // Now add the recipe to the meal
        const recipeData = {
          title: recipe.title || '',
          ingredients: recipe.ingredients || '',
          instructions: recipe.instructions || '',
          prep_time: recipe.prepTime || 0,
          cook_time: recipe.cookTime || 0,
          servings: recipe.servings || 1,
          notes: recipe.notes || ''
        };
        
        const recipeResult = await api.addRecipe(mealResult.data.id, recipeData);
        
        if (recipeResult.success) {
          return { type: 'created', recipe: recipe.title };
        } else {
          throw new Error(recipeResult.error || 'Failed to save recipe');
        }
      } else {
        throw new Error(mealResult.error || 'Failed to create meal');
      }
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-8">
    <div class="text-center">
      <div class="loading loading-spinner loading-lg text-primary"></div>
      <p class="mt-4 text-gray-600">Loading recipes...</p>
    </div>
  </div>
{:else if error}
  <div class="alert alert-error">
    <span>Error loading recipes: {error}</span>
  </div>
{:else if mealsWithRecipes.length === 0}
  <div class="text-center py-12 pt-16 pr-4">
    <ChefHat class="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h2 class="text-xl font-semibold text-gray-600 mb-2">No Recipes Found</h2>
    <p class="text-gray-500 mb-6">
      {#if $searchTerm}
        No recipes match your search term.
      {:else}
        You haven't added any recipes yet. Add recipes to your meals to see them here.
      {/if}
    </p>
    {#if !$searchTerm}
      <div class="flex justify-center gap-3">
        <button
          class="btn btn-primary"
          on:click={openNewRecipeEditor}
          title="Add New Recipe"
        >
          <Plus class="h-4 w-4" />
          Add Recipe
        </button>
        <button
          class="btn btn-outline btn-primary"
          on:click={handleBulkImport}
          title="Import Recipes"
        >
          <Upload class="h-4 w-4" />
          Import
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div class="space-y-4 pt-4 pr-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-primary">
        Recipes ({mealsWithRecipes.length})
      </h2>
      <div class="flex gap-2">
        <button
          class="btn btn-sm btn-primary"
          on:click={openNewRecipeEditor}
          title="Add New Recipe"
        >
          <Plus class="h-4 w-4" />
          Recipe
        </button>
        <button
          class="btn btn-sm btn-outline btn-primary"
          on:click={handleBulkImport}
          title="Import Recipes"
        >
          <Upload class="h-4 w-4" />
          Import
        </button>
      </div>
    </div>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each mealsWithRecipes as meal}
        <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div class="card-body p-4">
            <div class="flex items-start justify-between mb-3">
              <h3 class="card-title text-base font-medium text-primary line-clamp-2">
                {meal.recipe.title || meal.name}
              </h3>
              <div class="flex gap-1">
                <button
                  class="btn btn-ghost btn-xs text-primary"
                  on:click={() => openRecipeViewer(meal)}
                  title="View Recipe"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  class="btn btn-ghost btn-xs text-primary"
                  on:click={() => openRecipeEditor(meal, meal.recipe)}
                  title="Edit Recipe"
                >
                  <Edit class="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {#if meal.recipe.servings || meal.recipe.prep_time || meal.recipe.cook_time}
              <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {#if meal.recipe.servings}
                  <div class="flex items-center gap-1">
                    <Users class="h-4 w-4" />
                    <span>{meal.recipe.servings} servings</span>
                  </div>
                {/if}
                {#if meal.recipe.prep_time || meal.recipe.cook_time}
                  <div class="flex items-center gap-1">
                    <Clock class="h-4 w-4" />
                    <span>{formatTotalTime(meal.recipe.prep_time, meal.recipe.cook_time)}</span>
                  </div>
                {/if}
              </div>
            {/if}
            
            <div class="text-sm text-gray-600 space-y-1">
              {#if meal.recipe.ingredients}
                {@const ingredientCount = meal.recipe.ingredients.split('\n').filter(line => line.trim()).length}
                <div class="flex items-center gap-1">
                  <ChefHat class="h-3 w-3" />
                  <span>{ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}</span>
                </div>
              {/if}
              
              {#if meal.recipe.instructions}
                {@const stepCount = meal.recipe.instructions.split('\n').filter(line => line.trim()).length}
                <div class="flex items-center gap-1">
                  <span class="text-xs">📝</span>
                  <span>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                </div>
              {/if}
              
              <div class="flex items-center gap-1">
                <span class="text-xs">💰</span>
                <span>Cost: $--</span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Recipe Components -->
{#if showRecipeEditor}
  <RecipeEditor
    mealId={currentMeal?.id}
    mealName={currentMeal?.name || ''}
    recipe={currentRecipe}
    on:close={closeRecipeEditor}
    on:saved={handleRecipeSaved}
    on:deleted={handleRecipeDeleted}
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

      <!-- Photo Import Modal -->
      <PhotoImportModal
        bind:this={photoImportModal}
        on:recipes-imported={handleRecipesImported}
        on:close={() => {}}
      />
