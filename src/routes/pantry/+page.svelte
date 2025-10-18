<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { currentMealPlan } from '$lib/stores/mealPlan.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { 
    TableCellsSplit, 
    Plus, 
    Trash2, 
    ShoppingCart, 
    ArrowLeft,
    Search,
    X,
    Check
  } from 'lucide-svelte';

  let pantryItems = [];
  let loading = true;
  let error = null;
  let showAddForm = false;
  let newItemName = '';
  let searchTerm = '';
  let filteredItems = [];

  onMount(async () => {
    await loadPantryItems();
  });

  async function loadPantryItems() {
    try {
      loading = true;
      error = null;
      
      const result = await api.getPantryItems();
      if (result.success) {
        pantryItems = result.data;
        filterItems();
      } else {
        error = result.error;
      }
    } catch (err) {
      console.error('Error loading pantry items:', err);
      error = err.message || 'Failed to load pantry items';
    } finally {
      loading = false;
    }
  }

  function filterItems() {
    if (!searchTerm.trim()) {
      filteredItems = pantryItems;
    } else {
      const term = searchTerm.toLowerCase();
      filteredItems = pantryItems.filter(item => 
        item.name.toLowerCase().includes(term)
      );
    }
  }

  function handleSearchInput() {
    filterItems();
  }

  async function addPantryItem() {
    if (!newItemName.trim()) {
      notifyError('Please enter an item name');
      return;
    }

    try {
      const result = await api.addPantryItem(newItemName.trim());
      if (result.success) {
        pantryItems.push(result.data);
        filterItems();
        newItemName = '';
        showAddForm = false;
        notifySuccess('Item added to pantry');
      } else {
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error adding pantry item:', err);
      notifyError(err.message || 'Failed to add pantry item');
    }
  }

  async function deletePantryItem(id) {
    if (!confirm('Are you sure you want to remove this item from your pantry?')) {
      return;
    }

    try {
      const result = await api.deletePantryItem(id);
      if (result.success) {
        pantryItems = pantryItems.filter(item => item.id !== id);
        filterItems();
        notifySuccess('Item removed from pantry');
      } else {
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error deleting pantry item:', err);
      notifyError(err.message || 'Failed to remove pantry item');
    }
  }

  async function addToShoppingList(pantryItem) {
    if (!$currentMealPlan) {
      notifyError('Please create a meal plan first');
      return;
    }

    try {
      const result = await api.addPantryItemToPlan(pantryItem.id, $currentMealPlan.id);
      if (result.success) {
        notifySuccess(`${pantryItem.name} added to shopping list`);
      } else {
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      notifyError(err.message || 'Failed to add to shopping list');
    }
  }

</script>

<svelte:head>
  <title>Pantry - nomStack</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-primary/70">Loading pantry...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-error text-lg mb-4">⚠️</div>
        <p class="text-error mb-4">{error}</p>
        <button class="btn btn-primary" on:click={loadPantryItems}>Try Again</button>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <div class="p-4">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
              <TableCellsSplit class="h-6 w-6" />
              Pantry
            </h1>
          </div>
          <div class="flex items-center gap-4">
            <button
              class="text-primary hover:text-primary-focus text-sm flex items-center gap-1"
              on:click={() => showAddForm = !showAddForm}
            >
              <Plus class="h-4 w-4" />
              Add Item
            </button>
            <a href="/shopping" class="text-primary hover:text-primary-focus flex items-center gap-1 text-sm">
              <ArrowLeft class="h-4 w-4" />
              Back
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-2">
      <!-- Search Section -->
      <div class="mb-2">
        <div class="relative">
          <Search class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/40" />
          <input
            type="text"
            placeholder="Search pantry items..."
            bind:value={searchTerm}
            on:input={handleSearchInput}
            class="input input-bordered w-full pl-10 border-primary focus:border-primary focus:outline-primary text-primary"
          />
        </div>
      
      <div class="px-1 py-3">

          <!-- Add Item Form -->
          {#if showAddForm}
            <div class="flex items-center gap-0.5 mt-4 mb-4">
              <input
                type="text"
                placeholder="Item name (e.g., olive oil, salt, flour)"
                bind:value={newItemName}
                class="input input-bordered flex-1"
                on:keydown={(e) => e.key === 'Enter' && addPantryItem()}
              />
              <button
                class="btn btn-success btn-sm"
                on:click={addPantryItem}
                disabled={!newItemName.trim()}
                title="Add item"
              >
                <Check class="h-4 w-4" />
              </button>
              <button
                class="btn btn-ghost btn-sm"
                on:click={() => {
                  showAddForm = false;
                  newItemName = '';
                }}
                title="Cancel"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/if}
        </div>

        <!-- Pantry Items List -->
        {#if filteredItems.length === 0}
          <div class="text-center py-8">
            <TableCellsSplit class="h-16 w-16 mx-auto text-primary/40 mb-4" />
            <h3 class="text-lg font-semibold text-primary mb-2">
              {searchTerm ? 'No items found' : 'Your pantry is empty'}
            </h3>
            <p class="text-primary/60 mb-6">
              {#if searchTerm}
                Try adjusting your search terms
              {:else}
                {@html 'Add items you don\'t need to<br>shop for every time'}
              {/if}
            </p>
            {#if !searchTerm}
              <button
                class="btn btn-primary"
                on:click={() => showAddForm = true}
              >
                <Plus class="h-4 w-4" />
                Add Your First Item
              </button>
            {/if}
          </div>
        {:else}
          <div class="space-y-1">
            {#each filteredItems as item}
              <div class="flex items-center gap-3 p-2 border border-base-300 rounded-lg hover:bg-base-50 transition-colors">
                <div class="flex-1">
                  <h3 class="font-semibold text-primary">{item.name}</h3>
                </div>
                
                <div class="flex items-center gap-2">
                  {#if $currentMealPlan}
                    <button
                      class="btn btn-sm btn-outline"
                      on:click={() => addToShoppingList(item)}
                      title="Add to current shopping list"
                    >
                      <ShoppingCart class="h-4 w-4" />
                      Add to List
                    </button>
                  {/if}
                  <button
                    class="btn btn-sm btn-error btn-outline"
                    on:click={() => deletePantryItem(item.id)}
                    title="Remove from pantry"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
