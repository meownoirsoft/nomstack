<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { X, Clock, Users, ChefHat, ChevronDown, ChevronUp, Sparkles, Leaf } from 'lucide-svelte';

  export let mealId;
  export let mealName = '';
  export let recipe = null; // Existing recipe data

  const dispatch = createEventDispatcher();

  let ingredients = '';
  let instructions = '';
  let prepTime = 0;
  let servings = 1;
  let loading = false;
  
  // AI Parsing state
  let rawRecipeText = '';
  let parsingRecipe = false;
  let showManualEdit = false;

  // Initialize form with existing recipe data
  $: if (recipe) {
    ingredients = recipe.ingredients || '';
    instructions = recipe.instructions || '';
    prepTime = recipe.prep_time || 0;
    servings = recipe.servings || 1;
    // If editing existing recipe, show manual edit section
    showManualEdit = true;
  }

  async function saveRecipe() {
    if (!ingredients.trim() && !instructions.trim()) {
      notifyError('Please add at least ingredients or instructions');
      return;
    }

    loading = true;
    try {
      const recipeData = {
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        prep_time: prepTime,
        servings: servings
      };

      let result;
      if (recipe) {
        // Update existing recipe
        result = await api.updateRecipe(recipe.id, recipeData);
      } else {
        // Create new recipe
        result = await api.addRecipe(mealId, recipeData);
      }

      if (result.success) {
        notifySuccess(recipe ? 'Recipe updated!' : 'Recipe added!');
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

  async function parseRecipe() {
    if (!rawRecipeText.trim()) {
      notifyError('Please paste a recipe to parse');
      return;
    }

    parsingRecipe = true;
    try {
      const data = await api.parseRecipe(rawRecipeText.trim());

      if (data.success && data.recipe) {
        // Populate the form fields with parsed data
        ingredients = data.recipe.ingredients;
        instructions = data.recipe.instructions;
        prepTime = data.recipe.prepTime;
        servings = data.recipe.servings;
        
        // Show manual edit section for review
        showManualEdit = true;
        
        notifySuccess('Recipe parsed successfully! Review and edit as needed.');
      } else {
        throw new Error('Invalid response from AI parser');
      }
      
    } catch (error) {
      console.error('Error parsing recipe:', error);
      notifyError(`Failed to parse recipe: ${error.message}`);
    } finally {
      parsingRecipe = false;
    }
  }

  function toggleManualEdit() {
    showManualEdit = !showManualEdit;
  }

  function cancel() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6">
  <div class="relative mt-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-xl font-bold text-primary">Recipe Parsley</h3>
        <p class="text-sm text-gray-600 mt-1">for {mealName}</p>
      </div>
      <button 
        class="btn btn-ghost btn-sm p-1 -mt-2 -mr-2"
        on:click={cancel}
        disabled={loading}
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- AI Recipe Parser -->
    <div class="space-y-4">
      <div>
        <label class="label">
          <span class="label-text font-medium flex items-center gap-2">
            <Sparkles class="h-4 w-4" />
            Paste Recipe
          </span>
        </label>
        <textarea 
          class="textarea textarea-bordered w-full h-32 resize-none" 
          bind:value={rawRecipeText}
          placeholder="Paste your recipe here from any website, cookbook, or app. We will fill in the details for you."
        ></textarea>
      </div>
      
      <button 
        class="btn w-full"
        style="background-color: #86efac; border-color: #86efac; color: black;"
        on:click={parseRecipe}
        disabled={parsingRecipe || !rawRecipeText.trim()}
      >
        {#if parsingRecipe}
          <span class="loading loading-spinner loading-sm"></span>
          Applying Parsley...
        {:else}
          <Leaf class="h-4 w-4" />
          Apply Parsley to Recipe
        {/if}
      </button>
    </div>

    <!-- Manual Edit Accordion -->
    <div class="mt-4">
      <button 
        class="w-full flex items-center justify-between p-3 text-sm text-primary hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
        on:click={toggleManualEdit}
      >
        <div class="flex items-center gap-2">
          <ChefHat class="h-4 w-4 text-primary" />
          <span class="font-medium">Manual Edit</span>
        </div>
        {#if showManualEdit}
          <ChevronUp class="h-4 w-4" />
        {:else}
          <ChevronDown class="h-4 w-4" />
        {/if}
      </button>

      {#if showManualEdit}
        <div class="mt-3 space-y-3">
          <!-- Quick Info Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Prep Time -->
            <div>
              <label class="label">
                <span class="label-text font-medium flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  Prep Time (min)
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
            <div class="label py-0 -mb-2">
              <span class="label-text-alt text-gray-500">Number your steps for easy following</span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Actions -->
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
          {recipe ? 'Update Recipe' : 'Add Recipe'}
        {/if}
      </button>
    </div>
  </div>
</div>
