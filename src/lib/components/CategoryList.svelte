<script>
  import { Plus, XCircle, CheckCircle, Pencil, Trash2, Save, X } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { notifyError, notifySuccess } from '$lib/stores/notifications.js';
  import { api } from '$lib/api.js';

  export let cats = [];

  let showAddCat = false;
  let saveSuccessClass = 'hidden';
  let saveUpdSuccessClass = 'hidden';
  let saveUpdErrorClass = 'hidden';
  let newCatName = '';
  let editableCats = [];
  let catsSnapshot = '';
  let editingId = null;
  let tempName = '';

  $: {
    const snapshot = JSON.stringify(cats ?? []);
    if (snapshot !== catsSnapshot) {
      editableCats = (cats ?? []).map((cat) => ({ ...cat }));
      catsSnapshot = snapshot;
    }
  }

  function toggleShowAddCat() {
    showAddCat = !showAddCat;
    if (showAddCat) {
      newCatName = '';
    }
  }

  function startEditing(cat) {
    editingId = cat.id;
    tempName = cat.name;
  }

  function cancelEditing() {
    editingId = null;
    tempName = '';
  }

  async function saveEdit() {
    if (!tempName.trim()) {
      notifyError('Please enter a category name');
      return;
    }

    try {
      const result = await api.updateCategories({ 
        cats: [{ id: editingId, name: tempName.trim() }] 
      });
      if (result.success) {
        await refreshCats();
        notifySuccess('Category updated');
        editingId = null;
        tempName = '';
      } else {
        notifyError('Failed to update category');
      }
    } catch (error) {
      notifyError('Failed to update category');
      console.error('Error updating category:', error);
    }
  }

  async function addCat() {
    const name = newCatName.trim();
    if (!name) {
      return;
    }

    try {
      const result = await api.addCategory({ name });
      if (result.success) {
        saveSuccessClass = '';
        await refreshCats();
        notifySuccess('Category added.');
        setTimeout(() => {
          saveSuccessClass = 'hidden';
          newCatName = '';
          showAddCat = false;
        }, 1200);
      } else {
        notifyError('Unable to add category.');
        console.error('Error adding row:', result.error);
      }
    } catch (error) {
      notifyError('Unable to add category.');
      console.error('Error adding row:', error);
    }
  }

  async function updCats() {
    const catsPayload = editableCats.map((cat) => ({
      id: cat.id,
      name: cat.name?.trim() ?? ''
    }));

    try {
      const result = await api.updateCategories({ cats: catsPayload });
      if (result.success) {
        saveUpdSuccessClass = '';
        await refreshCats();
        notifySuccess('Categories updated.');
        setTimeout(() => {
          saveUpdSuccessClass = 'hidden';
        }, 1200);
      } else {
        saveUpdErrorClass = '';
        setTimeout(() => {
          saveUpdErrorClass = 'hidden';
        }, 2000);
        notifyError('Unable to update categories.');
        console.error('Error updating rows:', result.error);
      }
    } catch (error) {
      saveUpdErrorClass = '';
      setTimeout(() => {
        saveUpdErrorClass = 'hidden';
      }, 2000);
      notifyError('Unable to update categories.');
      console.error('Error updating rows:', error);
    }
  }

  function confirmDelete(catId, catName){
    const confirmDelete = confirm(`Are you sure you want to delete category: ${catName}?`);
    if (confirmDelete) {
      deleteCat(catId);
    }
  }

  async function deleteCat(catId){
    try {
      const result = await api.deleteCategory(catId);
      if (result.success) {
        saveUpdSuccessClass = '';
        editableCats = editableCats.filter((cat) => cat.id !== catId);
        await refreshCats();
        notifySuccess('Category deleted.');
        setTimeout(() => {
          saveUpdSuccessClass = 'hidden';
        }, 1200);
      } else {
        saveUpdErrorClass = '';
        setTimeout(() => {
          saveUpdErrorClass = 'hidden';
        }, 2000);
        notifyError('Unable to delete category.');
        console.error('Error deleting row:', result.error);
      }
    } catch (error) {
      saveUpdErrorClass = '';
      setTimeout(() => {
        saveUpdErrorClass = 'hidden';
      }, 2000);
      notifyError('Unable to delete category.');
      console.error('Error deleting row:', error);
    }
  }

  async function refreshCats() {
    try {
      const updatedCats = await api.getCategories();
      cats = updatedCats;
      editableCats = updatedCats.map((cat) => ({ ...cat }));
      catsSnapshot = JSON.stringify(updatedCats);
    } catch (error) {
      console.error('Failed to refresh categories:', error);
    }
  }
  </script>
    
  <div class="max-w-4xl mx-auto p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-primary mb-2">Categories</h1>
        <p class="text-primary/70">Organize your meal categories</p>
      </div>
      <button 
        type="button" 
        class="btn btn-primary gap-2 hover:scale-105 transition-transform duration-200"
        on:click={toggleShowAddCat}
        disabled={showAddCat}
      >
        <Plus class="h-5 w-5" />
        Category
      </button>
    </div>

    <!-- Add Category Form -->
    {#if showAddCat}
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 animate-in slide-in-from-top-2 duration-300">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Plus class="h-4 w-4 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-primary">Add New Category</h3>
        </div>
        
        <div class="flex gap-3">
          <input
            type="text"
            class="input input-bordered flex-1 text-lg"
            placeholder="Enter category name"
            bind:value={newCatName}
            on:keydown={(e) => e.key === 'Enter' && addCat()}
          />
          <button 
            type="button" 
            class="btn btn-primary gap-2"
            on:click={addCat}
            disabled={!newCatName.trim()}
          >
            <Save class="h-6 w-6" />
            Save
          </button>
          <button 
            type="button" 
            class="btn btn-ghost"
            on:click={toggleShowAddCat}
          >
            <X class="h-6 w-6" />
          </button>
        </div>
      </div>
    {/if}

    <!-- Categories Grid -->
    {#if editableCats.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {#each editableCats as cat}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:scale-105 transition-all duration-200 group">
            {#if editingId === cat.id}
              <!-- Edit Mode -->
              <div class="space-y-3">
                <input
                  type="text"
                  class="input input-bordered w-full text-lg font-medium"
                  bind:value={tempName}
                  on:keydown={(e) => e.key === 'Enter' && saveEdit()}
                />
                <div class="flex gap-2 justify-end">
                  <button 
                    type="button" 
                    class="btn btn-primary btn-sm gap-2"
                    on:click={saveEdit}
                    disabled={!tempName.trim()}
                  >
                    <Save class="h-6 w-6" />
                    Save
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-ghost btn-sm -mr-4"
                    on:click={cancelEditing}
                  >
                    <X class="h-6 w-6" />
                  </button>
                </div>
              </div>
            {:else}
              <!-- View Mode -->
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-primary mb-1">{cat.name}</h3>
                  <p class="text-sm text-primary/60">Category</p>
                </div>
                <div class="flex gap-1">
                  <button 
                    type="button" 
                    class="btn btn-ghost btn-sm text-primary hover:bg-primary/10 transition-colors duration-200"
                    on:click={() => startEditing(cat)}
                    title="Edit category"
                  >
                    <Pencil class="h-6 w-6" />
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
                    on:click={() => confirmDelete(cat.id, cat.name)}
                    title="Delete category"
                  >
                    <Trash2 class="h-6 w-6" />
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <div class="text-center py-16">
        <div class="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plus class="h-12 w-12 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-primary mb-2">No categories yet</h3>
        <p class="text-primary/70 mb-6 max-w-md mx-auto">
          Create your first category to start organizing your meals. Categories help you group similar types of food together.
        </p>
        <button 
          type="button" 
          class="btn btn-primary gap-2"
          on:click={toggleShowAddCat}
        >
          <Plus class="h-5 w-5" />
          Create Your First Category
        </button>
      </div>
    {/if}

    <!-- Success/Error Overlays -->
    <div class={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${saveSuccessClass}`}>
      <div class="bg-white rounded-xl p-8 text-center">
        <CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
        <p class="text-lg font-semibold text-primary">Category Added!</p>
      </div>
    </div>
    
    <div class={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${saveUpdSuccessClass}`}>
      <div class="bg-white rounded-xl p-8 text-center">
        <CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
        <p class="text-lg font-semibold text-primary">Categories Updated!</p>
      </div>
    </div>
    
    <div class={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 ${saveUpdErrorClass}`}>
      <div class="bg-white rounded-xl p-8 text-center">
        <XCircle class="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p class="text-lg font-semibold text-primary">Update Failed</p>
        <p class="text-primary/70">Please try again</p>
      </div>
    </div>
  </div>
