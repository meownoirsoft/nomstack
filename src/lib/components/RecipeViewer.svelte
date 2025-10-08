<script>
  import { createEventDispatcher } from 'svelte';
  import { Clock, Users, ChefHat, Edit, Trash2, X, Plus, Minus } from 'lucide-svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { user } from '$lib/stores/auth.js';

  export let mealId;
  export let mealName = '';
  export let recipe = null;

  const dispatch = createEventDispatcher();

  let showDeleteConfirm = false;
  let deleting = false;
  
  // Serving adjustment state
  let adjustedServings = 1;
  let adjustedIngredients = [];
  let adjustingServings = false;
  
  // Initialize adjusted servings when recipe loads
  $: if (recipe) {
    adjustedServings = recipe.servings || 1;
    adjustedIngredients = [];
  }

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

  function formatCookTime(minutes) {
    if (!minutes || minutes === 0) return 'No cook time';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  async function adjustServings(newServings) {
    if (!recipe || newServings < 1 || newServings > 20) return;
    
    if (!$user) {
      notifyError('Please log in to adjust recipe servings');
      return;
    }
    
    adjustingServings = true;
    try {
      console.log('Attempting to adjust servings from', recipe.servings, 'to', newServings);
      const result = await api.adjustRecipeServings({
        originalIngredients: recipe.ingredients,
        originalServings: recipe.servings,
        newServings: newServings
      });
      
      if (result.success && result.ingredients) {
        console.log('Frontend received ingredients:', result.ingredients);
        adjustedServings = newServings;
        adjustedIngredients = result.ingredients;
        console.log('Frontend adjustedIngredients set to:', adjustedIngredients);
      } else {
        // Fallback to simple scaling if AI fails
        adjustedServings = newServings;
        adjustedIngredients = createSimpleAdjustments(recipe.ingredients, recipe.servings, newServings);
      }
    } catch (error) {
      console.error('Error adjusting servings:', error);
      // Fallback to simple scaling
      adjustedServings = newServings;
      adjustedIngredients = createSimpleAdjustments(recipe.ingredients, recipe.servings, newServings);
    } finally {
      adjustingServings = false;
    }
  }
  
  function getServingColor() {
    if (adjustedServings === recipe.servings) return 'text-lg font-bold';
    if (adjustedServings > recipe.servings) return 'text-lg font-bold text-green-600';
    return 'text-lg font-bold text-red-600';
  }

  function createSimpleAdjustments(ingredients, originalServings, newServings) {
    if (!ingredients || originalServings === newServings) return [];
    
    const scaleFactor = newServings / originalServings;
    
    return ingredients.split('\n').map(line => {
      const originalLine = line.trim();
      if (!originalLine) return null;
      
      // Skip ingredients that shouldn't be scaled
      const noScaleKeywords = ['to taste', 'as needed', 'optional', 'garnish'];
      if (noScaleKeywords.some(keyword => originalLine.toLowerCase().includes(keyword))) {
        return {
          original: originalLine,
          adjusted: originalLine,
          change: 'no change'
        };
      }
      
      let adjustedLine = originalLine;
      let change = 'no change';
      
      // Find and scale measurements - improved regex to handle fractions and mixed numbers
      const measurementRegex = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole)/gi;
      let match;
      let hasChanges = false;
      
      adjustedLine = originalLine.replace(measurementRegex, (match, amount, unit) => {
        const originalAmount = parseFraction(amount);
        const newAmount = Math.round((originalAmount * scaleFactor) * 100) / 100;
        const difference = newAmount - originalAmount;
        
        if (Math.abs(difference) > 0.01) {
          hasChanges = true;
          const diffText = formatDifference(difference, unit);
          if (change === 'no change') {
            change = diffText;
          } else {
            change += `, ${diffText}`;
          }
        }
        
        return `${formatAmount(newAmount)} ${unit}`;
      });
      
      // If no measurements were found but this is a scaling change, mark as changed
      if (!hasChanges && scaleFactor !== 1) {
        hasChanges = true;
        // For ingredients without clear measurements, show a general adjustment
        change = scaleFactor > 1 ? `+${Math.round((scaleFactor - 1) * 100)}% more` : `${Math.round((scaleFactor - 1) * 100)}% less`;
      }
      
      return {
        original: originalLine,
        adjusted: adjustedLine,
        change: hasChanges ? change : 'no change'
      };
    }).filter(Boolean);
  }
  
  function parseFraction(str) {
    // Handle mixed numbers like "1 ½" or "1 1/2"
    if (str.includes(' ')) {
      const parts = str.split(' ');
      const whole = parseFloat(parts[0]);
      const fraction = parts[1];
      if (fraction.includes('/')) {
        const [numerator, denominator] = fraction.split('/');
        return whole + (parseFloat(numerator) / parseFloat(denominator));
      }
      return whole + parseFloat(fraction);
    }
    
    // Handle simple fractions like "½" or "1/2"
    if (str.includes('/')) {
      const [numerator, denominator] = str.split('/');
      return parseFloat(numerator) / parseFloat(denominator);
    }
    
    return parseFloat(str);
  }
  
  function formatAmount(amount) {
    // Convert to fractions for common amounts
    const fractionMap = {
      0.25: '1/4',
      0.33: '1/3',
      0.5: '1/2',
      0.67: '2/3',
      0.75: '3/4',
      1.25: '1 1/4',
      1.33: '1 1/3',
      1.5: '1 1/2',
      1.67: '1 2/3',
      1.75: '1 3/4'
    };
    
    if (fractionMap[amount]) return fractionMap[amount];
    if (amount % 1 === 0) return amount.toString();
    return amount.toFixed(2).replace(/\.00$/, '');
  }
  
  function formatDifference(difference, unit) {
    const absDiff = Math.abs(difference);
    const sign = difference > 0 ? '+' : '-';
    const amount = formatAmount(absDiff);
    return `${sign}${amount} ${unit}`;
  }
  

  function parseIngredient(ingredientText) {
    // First normalize fraction characters to literal fractions
    let normalizedText = ingredientText;
    normalizedText = normalizedText.replace(/¼/g, '1/4');
    normalizedText = normalizedText.replace(/½/g, '1/2');
    normalizedText = normalizedText.replace(/¾/g, '3/4');
    normalizedText = normalizedText.replace(/⅓/g, '1/3');
    normalizedText = normalizedText.replace(/⅔/g, '2/3');
    
    // Find the first amount/unit in the ingredient
    // First try to match known units, then fall back to any word(s)
    const knownUnits = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|halves?|pieces?|whole|tablespoons?|teaspoons?|pounds?|ounces?|grams?|kilograms?|milliliters?|liters?)\b/i;
    const anyWords = /(\d+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(\w+(?:\s+\w+)*)/i;
    
    let match = normalizedText.match(knownUnits);
    if (!match) {
      match = normalizedText.match(anyWords);
    }
    
    if (match) {
      const [fullMatch, amount, unit] = match;
      const beforeAmount = normalizedText.substring(0, match.index);
      let afterAmount = normalizedText.substring(match.index + fullMatch.length);
      
      // Clean up afterAmount: remove leading commas, spaces, and other separators
      afterAmount = afterAmount.replace(/^[,\s]+/, '');
      
      // Normalize unit abbreviations - handle any word(s) that follow the number
      let normalizedUnit = unit || '';
      if (normalizedUnit) {
        // For common measurements, use standard abbreviations
        if (normalizedUnit.toLowerCase().includes('tablespoon')) normalizedUnit = 'Tbsp';
        else if (normalizedUnit.toLowerCase().includes('teaspoon')) normalizedUnit = 'tsp';
        else if (normalizedUnit.toLowerCase().includes('pound')) normalizedUnit = 'lb';
        else if (normalizedUnit.toLowerCase().includes('ounce')) normalizedUnit = 'oz';
        else if (normalizedUnit.toLowerCase().includes('gram')) normalizedUnit = 'g';
        else if (normalizedUnit.toLowerCase().includes('kilogram')) normalizedUnit = 'kg';
        else if (normalizedUnit.toLowerCase().includes('milliliter')) normalizedUnit = 'ml';
        else if (normalizedUnit.toLowerCase().includes('liter')) normalizedUnit = 'l';
        else if (normalizedUnit.toLowerCase().includes('cup')) normalizedUnit = 'cup';
        // For everything else, keep the original text (it's likely an ingredient name)
        // This handles cases like "6 chicken breast halves" -> "6" + "chicken breast halves"
      }
      
      return {
        beforeAmount: beforeAmount,
        amount: amount,
        unit: normalizedUnit,
        afterAmount: afterAmount,
        hasMeasurement: true
      };
    }
    
    return {
      beforeAmount: normalizedText,
      amount: '',
      unit: '',
      afterAmount: '',
      hasMeasurement: false
    };
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
        <h3 class="text-xl font-bold text-primary">Recipe View</h3>
        <p class="text-sm text-gray-600 mt-1">{mealName}</p>
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
          <Clock class="h-5 w-5 text-primary" />
          <div>
            <div class="text-sm font-medium">Cook Time</div>
            <div class="text-lg font-bold">{formatCookTime(recipe.cook_time)}</div>
          </div>
        </div>
        <div class="flex items-center gap-2 col-span-2">
          <Users class="h-5 w-5 text-primary" />
          <div class="flex-1">
            <div class="text-sm font-medium">Servings</div>
            <div class="flex items-center gap-2">
              {#if $user}
                <button 
                  class="btn btn-sm btn-ghost p-1"
                  on:click={() => adjustServings(adjustedServings - 1)}
                  disabled={adjustingServings || adjustedServings <= 1}
                >
                  <Minus class="h-4 w-4" />
                </button>
                <div class="min-w-[2rem] text-center {getServingColor()}">
                  {adjustingServings ? '...' : adjustedServings}
                </div>
                <button 
                  class="btn btn-sm btn-ghost p-1"
                  on:click={() => adjustServings(adjustedServings + 1)}
                  disabled={adjustingServings || adjustedServings >= 20}
                >
                  <Plus class="h-4 w-4" />
                </button>
              {:else}
                <div class="text-lg font-bold">
                  {adjustedServings}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Ingredients -->
      {#if recipe.ingredients}
        <div class="mb-6">
          <h4 class="text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <ChefHat class="h-5 w-5" />
            Ingredients
            {#if adjustedServings !== recipe.servings}
              <span class="text-sm text-gray-500 font-normal">(adjusted for {adjustedServings} servings)</span>
            {/if}
          </h4>
          <div class="bg-base-200 rounded-lg p-4">
            <table class="w-full">
              <tbody>
                {#if adjustedIngredients.length > 0}
                  <!-- Debug: adjustedIngredients.length = {adjustedIngredients.length} -->
                  <!-- Debug: adjustedServings = {adjustedServings}, recipe.servings = {recipe.servings} -->
                  {#each adjustedIngredients as ingredient, index}
                    {@const parsed = parseIngredient(ingredient.original)}
                    <!-- Debug ingredient {index}: change = "{ingredient.change}" -->
                    <tr class="align-top">
                      <td class="text-sm font-medium text-left pr-3 w-24">
                        {#if parsed.hasMeasurement}
                          {parsed.amount} {parsed.unit}
                          {#if ingredient.change !== 'no change'}
                            <span class="text-xs font-medium px-1.5 py-0.5 rounded ml-1 {ingredient.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                              {ingredient.change}
                            </span>
                          {/if}
                        {:else}
                          {#if ingredient.change !== 'no change'}
                            <span class="text-xs font-medium px-1.5 py-0.5 rounded {ingredient.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                              {ingredient.change}
                            </span>
                          {/if}
                        {/if}
                      </td>
                      <td class="text-sm leading-relaxed text-left">
                        {#if parsed.hasMeasurement}
                          {parsed.beforeAmount}{parsed.afterAmount}
                        {:else}
                          {parsed.beforeAmount}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  {#each formatIngredients(recipe.ingredients) as ingredient}
                    {@const parsed = parseIngredient(ingredient)}
                    <tr class="align-top">
                      <td class="text-sm font-medium text-left pr-3 w-24">
                        {#if parsed.hasMeasurement}
                          {parsed.amount} {parsed.unit}
                        {/if}
                      </td>
                      <td class="text-sm leading-relaxed text-left">
                        {#if parsed.hasMeasurement}
                          {parsed.beforeAmount}{parsed.afterAmount}
                        {:else}
                          {parsed.beforeAmount}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
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

      <!-- Notes -->
      {#if recipe.notes}
        <div class="mb-6">
          <h4 class="text-lg font-bold text-primary mb-3">Notes</h4>
          <div class="bg-base-200 rounded-lg p-4">
            <div class="text-sm leading-relaxed whitespace-pre-wrap">{recipe.notes}</div>
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
