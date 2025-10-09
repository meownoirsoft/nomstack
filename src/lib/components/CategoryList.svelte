<script>
  import { Plus, XMark, XCircle, CheckCircle } from 'svelte-heros-v2';
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

  $: {
    const snapshot = JSON.stringify(cats ?? []);
    if (snapshot !== catsSnapshot) {
      editableCats = (cats ?? []).map((cat) => ({ ...cat }));
      catsSnapshot = snapshot;
    }
  }

  function toggleShowAddCat() {
    showAddCat = !showAddCat;
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
    
  <main class="flex flex-col min-h-auto">
    <div class="content">
    {#if showAddCat}
      <label class="font-bold text-primary" for="cat-add-input">Add New</label>
      <div class="cat-add flex mt-0 w-full ml-0 mb-4">
        <input
          type="text"
          id="cat-add-input"
          class="flex-4 font-normal input input-bordered text-primary input-sm w-4/5 max-w-xs focus:outline-none focus:ring-0"
          placeholder="New Category Name"
          bind:value={newCatName}
        />
        <button type="button" class="flex-2 btn btn-sm btn-primary text-white ml-2 px-2" on:click={addCat}>Save</button>
          <div class={`fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveSuccessClass}`}>
              <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
          </div>
      </div>
    {/if}
    
    <!-- Add Category Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-primary">Categories</h2>
      <button type="button" class="btn btn-ghost text-primary" on:click={toggleShowAddCat}>
        <Plus style="margin-right: -5px" />Category
      </button>
    </div>
    
    <div class="scroller flex-grow overflow-y-auto pr-4 min-h-60" style="height: calc(100vh - 180px);">
      <ul class="mx-0 text-primary"> 
        {#each editableCats as cat}
          <li class="mx-0 w-full flex h-10">
            <input
              type="text"
              class="cat-input flex-7 input input-bordered input-sm w-full max-w-xs focus:outline-none focus:ring-0"
              placeholder="Category Name"
              bind:value={cat.name}
            />
            <button type="button" class="ml-auto btn btn-sm btn-ghost text-primary pr-0" on:click={() => confirmDelete(cat.id,cat.name)}><XMark /></button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="w-full pl-1 pr-16 mb-4" style="position: fixed; bottom: 0px;">
    <button type="button" class="btn btn-sm btn-primary text-white mx-0 mt-2 px-0 w-full" on:click={updCats}>Update</button>
  </div>
  <div class={`save-upd-success fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveUpdSuccessClass}`}>
      <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
  </div>
  <div class={`save-upd-error fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveUpdErrorClass}`}>
      <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
  </div>
  </main>
