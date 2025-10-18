<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { Store, Plus, Edit3, Trash2, Save, X, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-svelte';

  let stores = [];
  let loading = true;
  let showAddForm = false;
  let editingStore = null;
  let newStoreName = '';
  let editingStoreName = '';

  onMount(async () => {
    await loadStores();
  });

  async function loadStores() {
    try {
      loading = true;
      const result = await api.getStores();
      if (result.success) {
        stores = result.data;
      } else {
        notifyError('Failed to load stores');
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      notifyError('Failed to load stores');
    } finally {
      loading = false;
    }
  }

  async function addStore() {
    if (!newStoreName.trim()) {
      notifyError('Store name is required');
      return;
    }

    try {
      const result = await api.createStore({ name: newStoreName.trim() });
      if (result.success) {
        notifySuccess('Store added successfully');
        newStoreName = '';
        showAddForm = false;
        await loadStores();
      } else {
        notifyError(result.error || 'Failed to add store');
      }
    } catch (error) {
      console.error('Error adding store:', error);
      notifyError('Failed to add store');
    }
  }

  async function updateStore(storeId) {
    if (!editingStoreName.trim()) {
      notifyError('Store name is required');
      return;
    }

    try {
      const result = await api.updateStore(storeId, { name: editingStoreName.trim() });
      if (result.success) {
        notifySuccess('Store updated successfully');
        editingStore = null;
        editingStoreName = '';
        await loadStores();
      } else {
        notifyError(result.error || 'Failed to update store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      notifyError('Failed to update store');
    }
  }

  async function deleteStore(storeId) {
    if (!confirm('Are you sure you want to delete this store? This will move all ingredients back to the List.')) {
      return;
    }

    try {
      const result = await api.deleteStore(storeId);
      if (result.success) {
        notifySuccess('Store deleted successfully');
        await loadStores();
      } else {
        notifyError(result.error || 'Failed to delete store');
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      notifyError('Failed to delete store');
    }
  }

  function startEditing(store) {
    editingStore = store.id;
    editingStoreName = store.name;
  }

  function cancelEditing() {
    editingStore = null;
    editingStoreName = '';
  }

  function cancelAdding() {
    showAddForm = false;
    newStoreName = '';
  }

  async function moveStore(storeId, direction) {
    const currentIndex = stores.findIndex(store => store.id === storeId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stores.length) return;

    // Swap stores in the array
    const newStores = [...stores];
    [newStores[currentIndex], newStores[newIndex]] = [newStores[newIndex], newStores[currentIndex]];
    stores = newStores;

    // Update the section_order in the database
    try {
      const sectionOrder = newStores.map(store => store.name);
      const result = await api.updateStore(storeId, { section_order: sectionOrder });
      if (result.success) {
        notifySuccess('Store order updated');
      } else {
        notifyError('Failed to update store order');
        // Revert the change
        await loadStores();
      }
    } catch (error) {
      console.error('Error updating store order:', error);
      notifyError('Failed to update store order');
      // Revert the change
      await loadStores();
    }
  }
</script>

<div class="space-y-6 mt-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Store class="h-6 w-6 text-primary" />
      <h1 class="text-2xl font-bold text-primary">Stores</h1>
    </div>
    <button 
      class="btn btn-primary btn-sm"
      on:click={() => showAddForm = true}
    >
      <Plus class="h-4 w-4" />
      Add Store
    </button>
  </div>

  <!-- Add Store Form -->
  {#if showAddForm}
    <div class="bg-base-100 rounded-lg shadow-md p-4">
      <h3 class="text-lg font-semibold mb-4 text-primary">Add New Store</h3>
      <div class="flex gap-1">
        <input
          type="text"
          bind:value={newStoreName}
          placeholder="Store name (e.g., Kroger, Whole Foods)"
          class="input input-bordered flex-1"
          on:keydown={(e) => e.key === 'Enter' && addStore()}
        />
        <button class="btn btn-ghost btn-xs px-0 text-primary hover:bg-primary/10" on:click={addStore}>
          <Save class="h-5 w-5" />
        </button>
        <button class="btn btn-ghost btn-xs px-0 text-primary hover:bg-primary/10" on:click={cancelAdding}>
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>
  {/if}

  <!-- Stores List -->
  <div class="bg-base-100 rounded-lg shadow-md">
    <div class="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <p class="text-sm text-primary/70">Order determines shopping list tab sequence</p>
    </div>
    {#if loading}
      <div class="p-8 text-center">
        <div class="loading loading-spinner loading-lg"></div>
        <p class="mt-4 text-primary/70">Loading stores...</p>
      </div>
    {:else if stores.length === 0}
      <div class="p-8 text-center">
        <Store class="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <p class="text-primary/70 mb-4">No stores yet</p>
        <p class="text-sm text-primary/60">Add your first store to organize your shopping lists</p>
      </div>
    {:else}
      <div class="divide-y divide-base-200">
        {#each stores as store, index}
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Store class="h-5 w-5 text-primary/40" />
              {#if editingStore === store.id}
                <input
                  type="text"
                  bind:value={editingStoreName}
                  class="input input-sm input-bordered"
                  on:keydown={(e) => e.key === 'Enter' && updateStore(store.id)}
                  on:keydown={(e) => e.key === 'Escape' && cancelEditing()}
                />
              {:else}
                <span class="font-medium text-primary">{store.name}</span>
              {/if}
            </div>
            
            <div class="flex items-center gap-2">
              <!-- Reorder arrows -->
              <div class="flex gap-1">
                <button 
                  class="btn btn-ghost btn-sm px-1 text-primary hover:bg-primary/10"
                  on:click={() => moveStore(store.id, 'up')}
                  disabled={index === 0}
                  class:opacity-50={index === 0}
                >
                  <ChevronUp class="h-5 w-5 text-primary" />
                </button>
                <button 
                  class="btn btn-ghost btn-sm px-1 text-primary hover:bg-primary/10"
                  on:click={() => moveStore(store.id, 'down')}
                  disabled={index === stores.length - 1}
                  class:opacity-50={index === stores.length - 1}
                >
                  <ChevronDown class="h-5 w-5 text-primary" />
                </button>
              </div>
              
              {#if editingStore === store.id}
                <button 
                  class="btn btn-ghost btn-xs px-0 text-primary hover:bg-primary/10"
                  on:click={() => updateStore(store.id)}
                >
                  <Save class="h-5 w-5" />
                </button>
                <button 
                  class="btn btn-ghost btn-xs px-0 text-primary hover:bg-primary/10"
                  on:click={cancelEditing}
                >
                  <X class="h-5 w-5" />
                </button>
              {:else}
                <button 
                  class="btn btn-ghost btn-xs px-0 text-primary hover:bg-primary/10"
                  on:click={() => startEditing(store)}
                >
                  <Edit3 class="h-5 w-5" />
                </button>
                <button 
                  class="btn btn-ghost btn-xs px-0"
                  on:click={() => deleteStore(store.id)}
                >
                  <Trash2 class="h-5 w-5 text-red-500" />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Back to Shopping List -->
  <div class="text-center">
    <a href="/shopping" class="btn btn-outline text-primary border-primary hover:bg-primary hover:text-white">
      <ShoppingCart class="h-4 w-4" />
      Back to Shopping List
    </a>
  </div>
</div>
