<script>
    // Imports
    import { onMount } from 'svelte';
    import Checkbox from './Checkbox.svelte';
    import { XMark, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    // Vars
    let saveSuccessClass = 'hidden';
    let saveErrorClass = 'hidden';
    let showCats = false;
    let showNotes = false;
    
    // Props
    export let showModal; 
    export let meals;
    export let meal;
    export let selectedCats;
    export let cats;
    export let srcs;
    let selectedItems = [];

    $: selectedItems = selectedCats;
    
    function closeModal() {
        dispatch('close'); // Notify the parent that the modal is closing
    }

    function toggleCats(){
        showCats = !showCats;
    }

    function toggleNotes(){
        showNotes = !showNotes;
    }
    
    async function updateMeal(){
        const id = meal.id;
        const name = document.querySelector('#meal_name').value;
        const source = document.querySelector('#meal_source').value;
        const cats = selectedItems.filter(str => str !== '').join(',');
        const notes = document.querySelector('#meal_notes').value;
        const newData = {id, name, source, cats, notes };
        const response = await fetch('/api/meal-upd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });

        const result = await response.json();
        if (result.success) {
            saveSuccessClass = '';
            setTimeout(() => {
                saveSuccessClass = 'hidden';
                closeModal();
            }, 2000);
        } else {
            console.error('Error updating row:', result.error);
        }
    }

    function confirmDelete(){
        const confirmDelete = confirm('This meal will be deleted from all views. Are you sure?');
        if (confirmDelete) {
            deleteMeal();
        }
    }

    async function deleteMeal(){
        const id = meal.id;
        const response = await fetch('/api/meal-del', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(id)
        });

        const result = await response.json();
        if (result.success) {
            saveSuccessClass = '';
            setTimeout(() => {
                saveSuccessClass = 'hidden';
                const mealSels = meals.filter((item) => item.id !== id);
                updateSelections(mealSels);
                closeModal();
                window.location.reload();
            }, 2000);
        } else {
            console.error('Error deleting row:', result.error);
        }
    }
</script>
{#if showModal}
    <div class="modal modal-open text-primary">
        <div class="modal-box px-2 py-2">
            <div class="flex items-center m-0 h-8">
                <h3 class="flex-1 font-bold text-lg">Edit Meal</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0"><XMark /></button>
                </div>
            </div>
            <!-- NAME -->
            <small class="font-bold m-0 pb-0">Name</small>
            <input id="meal_name" type="text" class="input input-bordered input-sm w-full max-w-xs" placeholder="Meal Name" value={meal.name} />
            <!-- SOURCE -->
            <small class="font-bold m-0 pb-0">Source</small>
            <select id="meal_source" class="w-full select select-bordered select-sm max-w-xs" value={meal.source}>
                <option value="">-- Select Source --</option>
                {#each srcs as src}
                    <option value={src.abbrev}>{src.name}</option>
                {/each}
            </select>
            <!-- L/D -->
            <label class="flex items-center justify-between mx-2 mt-2 mb-4">
                <Checkbox label="Lunch?" value={12} bind:selectedItems lblClass="modal-chk" />
                <Checkbox label="Dinner?" value={13} bind:selectedItems lblClass="modal-chk" />
            </label>
            <!-- CATS -->
            <div class="rounded-xl border border-primary/25 bg-secondary/90 shadow-sm overflow-hidden my-3">
                <button
                    type="button"
                    class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-secondary transition-colors {showCats ? 'border-b border-primary/20' : ''}"
                    on:click={toggleCats}
                    aria-expanded={showCats}
                >
                    <div class="flex flex-col items-start min-w-0">
                        <span class="text-md font-bold m-0">
                            Categories
                            {selectedItems?.filter((item) => ![12,13].includes(item)).length > 0 ? ` (${selectedItems?.filter((item) => ![12,13].includes(item)).length})` : ''}
                        </span>
                        <span class="text-xs font-normal opacity-70">Tap to {showCats ? 'collapse' : 'expand'}</span>
                    </div>
                    {#if showCats}
                        <ChevronUp class="shrink-0 opacity-80" />
                    {:else}
                        <ChevronDown class="shrink-0 opacity-80" />
                    {/if}
                </button>
                {#if showCats}
                    <div class="cats-shown bg-white/50 px-2 py-2">
                        <div class="modal-collapsible-scroll max-h-40 pr-1">
                            {#each cats as cat}
                                <Checkbox label={cat.name} value={cat.id} bind:selectedItems lblClass="modal-chk" />
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
            <!-- NOTES -->
            <div class="rounded-xl border border-primary/25 bg-secondary/90 shadow-sm overflow-hidden my-3">
                <button
                    type="button"
                    class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-secondary transition-colors {showNotes ? 'border-b border-primary/20' : ''}"
                    on:click={toggleNotes}
                    aria-expanded={showNotes}
                >
                    <div class="flex flex-col items-start min-w-0">
                        <span class="text-md font-bold m-0">Notes</span>
                        <span class="text-xs font-normal opacity-70">Tap to {showNotes ? 'collapse' : 'expand'}</span>
                    </div>
                    {#if showNotes}
                        <ChevronUp class="shrink-0 opacity-80" />
                    {:else}
                        <ChevronDown class="shrink-0 opacity-80" />
                    {/if}
                </button>
                {#if showNotes}
                    <div class="notes-shown bg-white/50 px-2 py-2">
                        <textarea id="meal_notes" class="textarea textarea-bordered w-full m-0" rows="3" placeholder="add notes" value={meal.notes}></textarea>
                    </div>
                {/if}
            </div>
            <div class="flex justify-end">
                <button class="flex-1 btn btn-sm btn-outlined btn-error text-white ml-auto mr-1" on:click={confirmDelete}>Delete</button>
                <button class="flex-1 btn btn-sm btn-primary text-white ml-1" on:click={updateMeal}>Update</button>
                <div class={`save-upd-success fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveSuccessClass}`}>
                    <CheckCircle class="h-16 w-16 mt-8 text-green-500 animate-fade-in-out" />
                </div>
                <div class={`save-upd-error fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 ${saveErrorClass}`}>
                    <XCircle class="h-16 w-16 mt-8 text-red-600 animate-fade-in-out" />
                </div>
            </div>
        </div>
    </div>  
{/if}

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