<script>
  import { createEventDispatcher } from 'svelte';
  import { Clock, Users, ChefHat, Edit, Trash2, X } from 'lucide-svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';

  export let mealId;
  export let mealName = '';
  export let recipe = null;

  const dispatch = createEventDispatcher();

  let showDeleteConfirm = false;
  let deleting = false;

  function formatIngredients(ingredients) {
    if (!ingredients) return [];
    
    return ingredients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Clean up bullet points
        return line.replace(/^[•\-\*]\s*/, '');
      });
  }

  function formatInstructions(instructions) {
    if (!instructions) return [];
    
    return instructions
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Clean up step numbers
        return line.replace(/^\d+\.\s*/, '');
      });
  }

  function formatPrepTime(minutes) {
    if (!minutes || minutes === 0) return 'No prep time';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  function editRecipe() {
    dispatch('edit', { recipe });
  }

  async function deleteRecipe() {
    if (!recipe) return;
    
    deleting = true;
    try {
      const result = await api.deleteRecipe(recipe.id);
      if (result.success) {
        notifySuccess('Recipe deleted');
        dispatch('deleted', { recipeId: recipe.id });
        dispatch('close');
      } else {
        throw new Error(result.error || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      notifyError(error.message || 'Failed to delete recipe');
    } finally {
      deleting = false;
      showDeleteConfirm = false;
    }
  }

  function confirmDelete() {
    showDeleteConfirm = true;
  }

  function cancelDelete() {
    showDeleteConfirm = false;
  }
</script>

<div class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-base-300/60 backdrop-blur-sm text-primary px-4 py-6">
  <div class="relative mt-8 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 shadow-xl border border-base-200 px-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-primary">{mealName}</h3>
        <p class="text-sm text-gray-600 mt-1">Recipe</p>
      </div>
      <div class="flex items-center gap-2">
        <button 
          class="btn btn-ghost btn-sm p-2"
          on:click={editRecipe}
          title="Edit recipe"
        >
          <Edit class="h-4 w-4" />
        </button>
        <button 
          class="btn btn-ghost btn-sm p-2 text-error"
          on:click={confirmDelete}
          title="Delete recipe"
        >
          <Trash2 class="h-4 w-4" />
        </button>
        <button 
          class="btn btn-ghost btn-sm p-2"
          on:click={() => dispatch('close')}
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>

    {#if recipe}
      <!-- Recipe Info -->
      <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
        <div class="flex items-center gap-2">
          <Clock class="h-5 w-5 text-primary" />
          <div>
            <div class="text-sm font-medium">Prep Time</div>
            <div class="text-lg font-bold">{formatPrepTime(recipe.prep_time)}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Users class="h-5 w-5 text-primary" />
          <div>
            <div class="text-sm font-medium">Servings</div>
            <div class="text-lg font-bold">{recipe.servings}</div>
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      {#if recipe.ingredients}
        <div class="mb-6">
          <h4 class="text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <ChefHat class="h-5 w-5" />
            Ingredients
          </h4>
          <div class="bg-base-200 rounded-lg p-4">
            <ul class="space-y-2">
              {#each formatIngredients(recipe.ingredients) as ingredient}
                <li class="flex items-start gap-3">
                  <div class="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span class="text-sm leading-relaxed">{ingredient}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}

      <!-- Instructions -->
      {#if recipe.instructions}
        <div class="mb-6">
          <h4 class="text-lg font-bold text-primary mb-3">Instructions</h4>
          <div class="bg-base-200 rounded-lg p-4">
            <ol class="space-y-3">
              {#each formatInstructions(recipe.instructions) as instruction, index}
                <li class="flex items-start gap-3">
                  <div class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span class="text-sm leading-relaxed">{instruction}</span>
                </li>
              {/each}
            </ol>
          </div>
        </div>
      {/if}
    {:else}
      <div class="text-center py-8">
        <ChefHat class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 mb-4">No recipe found for this meal</p>
        <button 
          class="btn btn-primary"
          on:click={editRecipe}
        >
          Add Recipe
        </button>
      </div>
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteConfirm}
      <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4">
        <div class="bg-base-100 rounded-lg p-6 max-w-sm w-full">
          <h4 class="text-lg font-bold mb-4">Delete Recipe?</h4>
          <p class="text-gray-600 mb-6">This will permanently delete the recipe for {mealName}. This action cannot be undone.</p>
          <div class="flex gap-3">
            <button 
              class="btn btn-ghost flex-1"
              on:click={cancelDelete}
              disabled={deleting}
            >
              Cancel
            </button>
            <button 
              class="btn btn-error flex-1"
              on:click={deleteRecipe}
              disabled={deleting}
            >
              {#if deleting}
                <span class="loading loading-spinner loading-sm"></span>
                Deleting...
              {:else}
                Delete
              {/if}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
