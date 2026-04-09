<script>
    // Imports
    import Checkbox from './Checkbox.svelte';
    import sources from '../data/sources.json';
    import categories from '../data/cats.json';
    import { XMark, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'svelte-heros-v2';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const catsSorted = categories.sort((a, b) => a.name.localeCompare(b.name));
    // Vars
    let selectedItems = [];
    let saveSuccess = false;
    let saveError = false;
    let showCats = false;
    let showNotes = false;

    // Props
    export let showModal; 
    
    function closeModal() {
        dispatch('close'); // Notify the parent that the modal is closing
    }

    function toggleCats(){
        showCats = !showCats;
    }

    function toggleNotes(){
        showNotes = !showNotes;
    }

    async function addNewMeal() {
        const name = document.querySelector('#meal_name').value;
        const source = document.querySelector('#meal_source').value;
        const notes = document.querySelector('#meal_notes').value;
        const cats = document.querySelectorAll('.collapse-content input[type="checkbox"]');
        const selectedCats = Array.from(cats).filter(cat => cat.checked).map(cat => cat.value);
        const newData = { name, source, cats: selectedCats.join(','), notes};
        const response = await fetch('/api/meal-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });

        const result = await response.json();
        if (result.success) {
            saveSuccess = true;
            setTimeout(() => {
                saveSuccess = false;
                closeModal();
            }, 2000);
        } else {
            saveError = true;
            console.error('Error adding row:', result.error);
        }
    }
</script>
{#if showModal}
    <div class="modal modal-open text-primary">
        <div class="modal-box px-2 py-2">
            <div class="flex items-center h-8 m-0">
                <h3 class="flex-1 font-bold text-lg mt-0">Add Meal</h3>
                <div class="ml-auto modal-action mt-0">
                    <button on:click={closeModal} class="btn btn-ghost pr-0" style="z-index: 999;"><XMark /></button>
                </div>
            </div>
            <!-- NAME: first row -->
            <div class="w-full min-w-0 mt-1">
                <small class="font-bold m-0 pb-0 block">Name</small>
                <input id="meal_name" type="text" class="input input-bordered input-sm w-full mt-1" placeholder="Meal Name" />
            </div>
            <!-- SOURCE: second row — label + select on one line, never wraps -->
            <div class="w-full min-w-0 mt-3 flex flex-row flex-nowrap items-center gap-2">
                <small class="font-bold m-0 shrink-0 whitespace-nowrap">Source</small>
                <select id="meal_source" class="select select-bordered select-sm flex-1 min-w-0">
                    <option value="">-- Select Source --</option>
                    {#each sources as source}
                        <option value={source.abbrev}>{source.name}</option>
                    {/each}
                </select>
            </div>
            <!-- L/D -->
            <div class="flex items-center justify-between mx-2 mt-2 mb-4">
                <Checkbox label="Lunch?" value="Lunch" bind:selectedItems lblClass="modal-chk" />
                <Checkbox label="Dinner?" value="Dinner" bind:selectedItems lblClass="modal-chk" />
            </div>
            <!-- CATS -->
            <div class="rounded-xl border border-primary/25 bg-secondary/90 shadow-sm overflow-hidden my-3">
                <button
                    type="button"
                    class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-secondary transition-colors {showCats ? 'border-b border-primary/20' : ''}"
                    on:click={toggleCats}
                    aria-expanded={showCats}
                >
                    <div class="flex flex-col items-start min-w-0">
                        <span class="text-md font-bold m-0">Categories</span>
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
                            {#each catsSorted as category}
                                <Checkbox label={category.name} value={category.name} bind:selectedItems lblClass="modal-chk" />
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
                        <textarea id="meal_notes" class="textarea textarea-bordered w-full m-0" rows="3" placeholder="add notes"></textarea>
                    </div>
                {/if}
            </div>
            <div class="flex justify-end">
                <button class="flex-1 btn btn-sm btn-primary text-white ml-auto" on:click={addNewMeal}>Save</button>
                {#if saveSuccess}
                    <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50">
                        <CheckCircle class="h-16 w-16 mt-8 text-green-500" />
                    </div>
                {/if}
                {#if saveError}
                    <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50">
                        <CheckCircle class="h-16 w-16 mt-8 text-red-600" />
                    </div>
                {/if}
            </div>
        </div>
    </div>  
{/if}