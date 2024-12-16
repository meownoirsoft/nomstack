<script>
    import Checkbox from '$lib/components/Checkbox.svelte';
    import EditModal from '$lib/components/EditModal.svelte';
    import SocialIcon from '$lib/components/SocialIcon.svelte';
    import { PencilSquare, Check } from 'svelte-heros-v2';
    export let meals;
    export let sels;
    export let cats;
    export let srcs;
    export let page;
    let selectedItems = sels;
    let selectedCats = [];
    let searchParams = '';
  
    let showModal = false;
    let editMode = false;
    let mealToEdit = {};

    function setupCats(meal){
      if(meal.cats){
        meal.cats.split(",").map(mealcat => cats.find(cat => {
         if( cat.id === parseInt(mealcat,10)){
           selectedCats.push(cat.id);
         }
        }))
      }
      cats = cats.filter(cat => ![12,13].includes(cat.id));
    }
  
    function openModal(meal) {
      mealToEdit = meal;
      setupCats(meal);
      editMode = true;
      showModal = true;
    }
  
    function handleModalClose() {
      showModal = false;
      window.location.reload();
    }

    function clearAll(){
      selectedItems = [];
      updateSelections(selectedItems);
    }

    async function updateSelections(items) {
      let newData = { id: page, meals: items };
      const response = await fetch('/api/sels-upd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
    }
  </script>
    
  <main class="flex flex-col min-h-auto">
    <div class="flex items-center pr-4">
      <span class="flex-1" style="margin-left: -10px; my-0 mx-0 pl-0">
        <button class="btn btn-sm btn-ghost text-primary px-2 py-0" on:click={clearAll}>
          CLEAR<Check class="px-0 mx-0" style="margin-left: -5px;" />
        </button>
      </span>
    </div>
    <div class="scroller flex-grow overflow-y-auto pr-4 min-h-60 max-h-screen">
      <ul class="mx-0 mt-2 text-primary"> 
        {#each meals as meal}
          <li class="mx-0 w-full">
              <label class="flex items-left justify-between h-10">
                  <Checkbox type="sels" label={meal.name} value={meal.id} {page} bind:selectedItems lblClass="flex-5 ml-5 mr-0" />
                  <span class="flex-1 w-6 ml-0 mt-1">
                    <div class="flex">
                      <span><SocialIcon icon={meal.source} /></span>
                      {#if meal.cats?.includes(12)}
                        <span class="ml-2 font-bold" style="color: #C0C0C0">L</span>
                      {/if}
                      {#if meal.cats?.includes(13)}
                        <span class="ml-2 font-bold" style="color: #C0C0C0">D</span>
                      {/if}
                    </div>
                  </span>
                  <button class="btn btn-ghost mx-0 px-0" style="margin-top: -10px;" on:click={() => openModal(meal)}><PencilSquare class="ml-auto mr-0" /></button>
              </label>
          </li>
        {/each}
      </ul>
    </div>
    {#if showModal}
      <EditModal {showModal} meal={mealToEdit} {selectedCats} {cats} {srcs} {meals} {updateSelections} on:close={handleModalClose} />
    {/if}
  </main>