<script>
  import { createEventDispatcher } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { Plus, X } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let storeId;
  export let planId;

  let name = '';
  let amount = '';
  let unit = '';
  let category = '';
  let loading = false;

  async function addIngredient() {
    if (!name.trim()) {
      notifyError('Please enter an ingredient name');
      return;
    }

    if (!storeId || !planId) {
      notifyError('Missing store or plan information');
      return;
    }

    try {
      loading = true;

      const ingredientData = {
        store_id: storeId,
        plan_id: planId,
        name: name.trim(),
        amount: amount.trim() || null,
        unit: unit.trim() || null,
        category: category.trim() || 'Other',
        is_custom: true
      };

      const result = await api.createIngredient(ingredientData);
      if (result.success) {
        dispatch('ingredient-added', result.data);
        notifySuccess('Ingredient added!');
        
        // Reset form
        name = '';
        amount = '';
        unit = '';
        category = '';
      } else {
        throw new Error(result.error || 'Failed to add ingredient');
      }
    } catch (err) {
      console.error('Error adding ingredient:', err);
      notifyError(err.message || 'Failed to add ingredient');
    } finally {
      loading = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addIngredient();
    }
  }
</script>

<div class="bg-base-200 rounded-lg p-4 border border-base-300">
  <div class="flex items-center justify-between mb-4">
    <h4 class="text-md font-medium text-primary">Add Custom Item</h4>
    <button
      class="btn btn-ghost btn-sm p-1"
      on:click={() => dispatch('close')}
    >
      <X class="h-4 w-4" />
    </button>
  </div>

  <div class="space-y-3">
    <!-- Ingredient Name -->
    <div>
      <label class="label">
        <span class="label-text text-sm font-medium">Item Name *</span>
      </label>
      <input
        type="text"
        class="input input-bordered input-sm w-full"
        placeholder="e.g., Dog treats, Paper towels"
        bind:value={name}
        on:keydown={handleKeydown}
        disabled={loading}
      />
    </div>

    <!-- Amount and Unit -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">
          <span class="label-text text-sm font-medium">Amount</span>
        </label>
        <input
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="e.g., 2, 1/2"
          bind:value={amount}
          on:keydown={handleKeydown}
          disabled={loading}
        />
      </div>
      <div>
        <label class="label">
          <span class="label-text text-sm font-medium">Unit</span>
        </label>
        <input
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="e.g., lbs, boxes"
          bind:value={unit}
          on:keydown={handleKeydown}
          disabled={loading}
        />
      </div>
    </div>

    <!-- Category -->
    <div>
      <label class="label">
        <span class="label-text text-sm font-medium">Category</span>
      </label>
      <select
        class="select select-bordered select-sm w-full"
        bind:value={category}
        disabled={loading}
      >
        <option value="">Select category...</option>
        <option value="Produce">Produce</option>
        <option value="Meat">Meat</option>
        <option value="Dairy">Dairy</option>
        <option value="Pantry">Pantry</option>
        <option value="Frozen">Frozen</option>
        <option value="Bakery">Bakery</option>
        <option value="Household">Household</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-2">
      <button
        class="btn btn-ghost btn-sm flex-1"
        on:click={() => dispatch('close')}
        disabled={loading}
      >
        Cancel
      </button>
      <button
        class="btn btn-primary btn-sm flex-1"
        on:click={addIngredient}
        disabled={loading || !name.trim()}
      >
        {#if loading}
          <span class="loading loading-spinner loading-xs"></span>
          Adding...
        {:else}
          <Plus class="h-4 w-4" />
          Add Item
        {/if}
      </button>
    </div>
  </div>
</div>
