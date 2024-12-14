<script>
  import Checkbox from '$lib/components/Checkbox.svelte';
  import EditModal from '$lib/components/EditModal.svelte';
  import SocialIcon from '$lib/components/SocialIcon.svelte';
  import { PencilSquare, Plus, XMark, XCircle, CheckCircle } from 'svelte-heros-v2';
  export let cats;
  let searchParams = '';
  let showAddCat = false;
  let saveSuccessClass = 'hidden';
  let saveUpdSuccessClass = 'hidden';
  let saveUpdErrorClass = 'hidden';

  function toggleShowAddCat() {
      showAddCat = !showAddCat;
  }

  async function addCat() {
      const newCat = document.querySelector('.cat-add input').value;
      const newData = { id: cats.length + 1, name: newCat };
      const response = await fetch('/api/cat-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      saveSuccessClass = '';
      setTimeout(() => {
        saveSuccessClass = 'hidden';
          window.location.reload();
      }, 2000);
  }

  async function updCats() {
    const catInputs = document.querySelectorAll('.cat-input');
    let cats = [];
    catInputs.forEach(cat => {
      cats.push({id: parseInt(cat.id,10), name: cat.value});
    });
    let newData = {cats};
    const response = await fetch('/api/cat-upd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData)
    });

    const result = await response.json();
    if (result.success) {
      saveUpdSuccessClass = '';
      setTimeout(() => {
        saveUpdSuccessClass = 'hidden';
        window.location.reload();
      }, 2000);
    } else {
        console.error('Error updating rows:', result.error);
    }
  }

  function confirmDelete(catId,catName){
      const confirmDelete = confirm(`Are you sure you want to delete category: ${catName}?`);
      if (confirmDelete) {
        deleteCat(catId);
      }
  }

  async function deleteCat(catId){
      const response = await fetch('/api/cat-del', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catId)
      });

      const result = await response.json();
      if (result.success) {
          saveUpdSuccessClass = '';
        setTimeout(() => {
          saveUpdSuccessClass = 'hidden';
            window.location.reload();
        }, 3000);
      } else {
        saveUpdErrorClass = '';
        setTimeout(() => {
          saveUpdErrorClass = 'hidden';
      }, 3000);
          console.error('Error deleting row:', result.error);
      }
  }
  </script>
    
  <main class="flex flex-col min-h-auto">
    <div class="content">
    {#if showAddCat}
      <label class="font-bold text-primary" for="cat-add-input">Add New</label>
      <div class="cat-add flex mt-0 w-full ml-0 mb-4">
        <input type="text" id="cat-add-input" class="flex-4 font-normal input input-bordered text-primary input-sm w-4/5 max-w-xs focus:outline-none focus:ring-0" placeholder="New Category Name" />
        <button class="flex-2 btn btn-sm btn-primary text-white ml-2 px-2" on:click={addCat}>Save</button>
          <div class={`fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveSuccessClass}`}>
              <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
          </div>
      </div>
    {/if}
    <div class="flex items-center pr-2">
      <small class="flex-1 font-bold text-primary">CATEGORY</small>
      <small class="ml-auto font-bold text-primary pr-0">DELETE</small>
    </div>
    <div class="scroller flex-grow overflow-y-auto pr-4 min-h-60" style="height: calc(100vh - 180px);">
      <button class="btn btn-ghost text-primary text-lg mr-2" style="position: absolute; top: 0px; right: -10px;" on:click={toggleShowAddCat}>
        <Plus style="margin-right: -5px" />Category
      </button>
      <ul class="mx-0 mt-2 text-primary"> 
        {#each cats as cat}
          <li class="mx-0 w-full flex h-10">
            <input type="text" id={cat.id} class="cat-input flex-7 input input-bordered input-sm w-full max-w-xs focus:outline-none focus:ring-0" placeholder="Category Name" value={cat.name} />
            <button class="ml-auto btn btn-sm btn-ghost text-primary pr-0" on:click={() => confirmDelete(cat.id,cat.name)}><XMark /></button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="w-full pl-1 pr-16 mb-4" style="position: fixed; bottom: 0px;">
    <button class="btn btn-sm btn-primary text-white mx-0 mt-2 px-0 w-full" on:click={updCats}>Update</button>
  </div>
  <div class={`save-upd-success fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveUpdSuccessClass}`}>
      <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
  </div>
  <div class={`save-upd-error fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveUpdErrorClass}`}>
      <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
  </div>
  </main>

  <style>
    @keyframes fade-in-out {
      0% {
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  
    .animate-fade-in-out {
      animation: fade-in-out 2s ease-in-out;
    }
</style>