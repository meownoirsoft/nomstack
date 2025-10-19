<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { currentMealPlan } from '$lib/stores/mealPlan.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { userTier, TIER_TYPES, hasFeatureAccess } from '$lib/stores/userTier.js';
  import { 
    TableCellsSplit, 
    Plus, 
    Trash2, 
    ShoppingCart, 
    ArrowLeft,
    Search,
    X,
    Check,
    Edit3,
    Crown
  } from 'lucide-svelte';

  let pantryItems = [];
  let loading = true;
  let error = null;
  let showAddForm = false;
  let newItemName = '';
  let searchTerm = '';
  let filteredItems = [];
  let editingItemId = null;
  let editingItemName = '';

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
    // Check if user has smart pantry feature
    if (!hasFeatureAccess('smartPantry')) {
      // Redirect to upgrade page for free users
      window.location.href = '/upgrade';
      return;
    }

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

  function startEdit(item) {
    editingItemId = item.id;
    editingItemName = item.name;
  }

  function cancelEdit() {
    editingItemId = null;
    editingItemName = '';
  }

  async function saveEdit() {
    if (!editingItemName.trim()) {
      notifyError('Please enter an item name');
      return;
    }

    try {
      const result = await api.updatePantryItem(editingItemId, editingItemName.trim());
      if (result.success) {
        // Update the item in the local array
        const itemIndex = pantryItems.findIndex(item => item.id === editingItemId);
        if (itemIndex >= 0) {
          pantryItems[itemIndex] = result.data;
          filterItems();
        }
        editingItemId = null;
        editingItemName = '';
        notifySuccess('Item updated');
      } else {
        notifyError(result.error);
      }
    } catch (err) {
      console.error('Error updating pantry item:', err);
      notifyError(err.message || 'Failed to update item');
    }
  }

</script>

<svelte:head>
  <title>Pantry - nomStack</title>
</svelte:head>

<div class="min-h-screen" style="background-color: var(--app-background, #ffffff);">
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
      </div>
      <div class="px-4 py-2">
        <div class="max-w-4xl mx-auto">
          <div class="flex items-start justify-end">
            <button
              class="text-primary hover:text-primary-focus text-sm flex items-center gap-1"
              on:click={() => showAddForm = !showAddForm}
            >
              <Plus class="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>
      <!-- Add Item Form -->
      {#if showAddForm}
        <div class="flex items-center gap-0.5 mt-4 mb-4">
          <input
            type="text"
            placeholder="Item name (e.g., olive oil, salt, flour)"
            bind:value={newItemName}
            class="input input-bordered flex-1 border-primary focus:border-primary focus:outline-primary text-primary"
            on:keydown={(e) => e.key === 'Enter' && addPantryItem()}
          />
          <button
            class="btn btn-success btn-sm"
            on:click={addPantryItem}
            disabled={!newItemName.trim()}
            title="Add item"
          >
            <Check class="h-4 w-4 text-white" />
          </button>
          <button
            class="btn btn-ghost btn-sm"
            on:click={() => {
              showAddForm = false;
              newItemName = '';
            }}
            title="Cancel"
          >
            <X class="h-4 w-4 text-primary" />
          </button>
        </div>
      {/if}

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
            <div class="flex items-center gap-3 px-2 rounded-lg hover:bg-base-50 transition-colors">
              <div class="flex-1">
                {#if editingItemId === item.id}
                  <!-- Edit Mode -->
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      bind:value={editingItemName}
                      class="input input-sm input-bordered flex-1 border-primary focus:border-primary focus:outline-primary text-primary"
                      on:keydown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autofocus
                    />
                    <button
                      class="btn btn-sm btn-ghost"
                      on:click={saveEdit}
                      title="Save changes"
                    >
                      <Check class="h-4 w-4 text-green-500" />
                    </button>
                    <button
                      class="btn btn-sm btn-ghost"
                      on:click={cancelEdit}
                      title="Cancel"
                    >
                      <X class="h-4 w-4 text-primary" />
                    </button>
                  </div>
                {:else}
                  <div class="flex items-center gap-2 -ml-2">
                    <!-- View Mode -->
                    <TableCellsSplit class="h-6 w-6 text-primary mr-0" />
                    <h3 class="font-semibold text-primary">{item.name}</h3>
                  </div>
                {/if}
              </div>
              
              <div class="flex items-center">
                {#if editingItemId !== item.id}
                  {#if hasFeatureAccess('smartPantry')}
                    <button
                      class="btn btn-sm btn-ghost text-primary mr-0"
                      on:click={() => addToShoppingList(item)}
                      title={$currentMealPlan ? "Add to current shopping list" : "Create a meal plan first to add to shopping list"}
                    >
                      <ShoppingCart class="h-4 w-4" />
                      Buy
                    </button>
                  {/if}
                  <div class="flex items-center ml-auto -mr-4">
                    <button
                      class="btn btn-sm btn-ghost py-0 px-1"
                      on:click={() => startEdit(item)}
                      title="Edit item name"
                    >
                      <Edit3 class="h-6 w-6 text-primary" />
                    </button>
                    <button
                      class="btn btn-sm btn-ghost py-0 px-1"
                      on:click={() => deletePantryItem(item.id)}
                      title="Remove from pantry"
                    >
                      <Trash2 class="h-6 w-6 text-red-500" />
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
