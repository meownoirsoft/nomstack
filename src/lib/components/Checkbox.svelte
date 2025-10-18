<script>
    import { notifyError } from '$lib/stores/notifications.js';
    import { api } from '$lib/api.js';
    import { currentMealPlan } from '$lib/stores/mealPlan.js';
    import { Check } from 'lucide-svelte';
    
    export let type;
    export let label;
    export let value;
    export let page;
    export let lblClass;
    export let selectedItems;

    let isChecked = false;
    let isUpdating = false;
    $: isChecked = selectedItems?.includes(value);

    async function updateSelections(items, previousItems) {
      if (isUpdating) {
        return;
      }

      isUpdating = true;
      const newData = {
        type: page,
        meals: Array.isArray(items)
          ? items.map((value) => (value == null ? '' : String(value).trim())).filter((value) => value.length > 0)
          : []
      };

      try {
        const planId = $currentMealPlan?.id || null;
        const result = await api.updateSelections(newData.type, newData.meals, planId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update selections');
        }
      } catch (error) {
        selectedItems = previousItems;
        notifyError('Unable to update selections. Please try again.');
      } finally {
        isUpdating = false;
      }
    }

    function toggleCheckbox() {
      if (isUpdating) {
        return;
      }

      const previousItems = selectedItems;
      const previousSet = Array.isArray(previousItems) ? [...previousItems] : [];

      if (isChecked) {
        selectedItems = previousSet.filter((item) => item !== value);
      } else {
        selectedItems = [...previousSet, value];
      }

      if (type === 'sels') {
        updateSelections(selectedItems, previousSet);
      }
    }
</script>

<label class="flex items-center gap-3 cursor-pointer select-none">
  <button
    type="button"
    class="food-checkbox w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center {isChecked ? 'bg-primary border-primary' : 'bg-transparent border-primary/40 hover:border-primary'} {isUpdating ? 'opacity-50 cursor-not-allowed' : ''}"
    on:click={toggleCheckbox}
    disabled={isUpdating}
    role="checkbox"
    aria-checked={isChecked}
    tabindex="0"
    on:keydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCheckbox();
      }
    }}
  >
    {#if isChecked}
      <Check class="h-4 w-4 text-white" />
    {/if}
  </button>
  <span class={`text-sm ${lblClass || ''}`}>{label}</span>
</label>

<style>
  .food-checkbox {
    cursor: pointer;
    outline: none;
  }
  
  .food-checkbox:focus {
    box-shadow: 0 0 0 2px var(--primary-20);
  }
  
  .food-checkbox:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .food-checkbox:disabled {
    cursor: not-allowed;
  }
</style>
