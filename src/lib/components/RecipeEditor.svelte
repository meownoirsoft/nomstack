<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { X, Clock, Users, ChefHat } from 'lucide-svelte';

  export let mealId;
  export let mealName = '';
  export let recipe = null; // Existing recipe data

  const dispatch = createEventDispatcher();

  let ingredients = '';
  let instructions = '';
  let prepTime = 0;
  let servings = 1;
  let loading = false;

  // Initialize form with existing recipe data
  $: if (recipe) {
    ingredients = recipe.ingredients || '';
    instructions = recipe.instructions || '';
    prepTime = recipe.prep_time || 0;
    servings = recipe.servings || 1;
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

  function cancel() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6">
  <div class="relative mt-8 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-primary">Recipe for {mealName}</h3>
        <p class="text-sm text-gray-600 mt-1">Add ingredients and cooking steps</p>
      </div>
      <button 
        class="btn btn-ghost btn-sm p-2"
        on:click={cancel}
        disabled={loading}
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Form -->
    <div class="space-y-6">
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
      <div>
        <label class="label">
          <span class="label-text font-medium flex items-center gap-2">
            <ChefHat class="h-4 w-4" />
            Ingredients
          </span>
        </label>
        <textarea 
          class="textarea textarea-bordered w-full h-32 resize-none" 
          bind:value={ingredients}
          placeholder="• 2 cups flour&#10;• 1 cup sugar&#10;• 3 eggs&#10;• 1/2 cup butter"
        ></textarea>
        <div class="label">
          <span class="label-text-alt text-gray-500">One ingredient per line, use • or - for bullets</span>
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
        <div class="label">
          <span class="label-text-alt text-gray-500">Number your steps for easy following</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 mt-8 pt-6 border-t border-base-200">
      <button 
        class="btn btn-ghost flex-1" 
        on:click={cancel}
        disabled={loading}
      >
        Cancel
      </button>
      <button 
        class="btn btn-primary flex-1" 
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
